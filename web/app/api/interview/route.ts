/**
 * POST /api/interview
 * The AI interviewer. Receives the conversation so far and returns the next
 * structured step: a reflection of what it understood + the next question, as
 * multiple-choice (A/B/C/D + "Other") whenever possible. It accumulates a
 * partial `answers` object and sets done=true when it has enough. Brand color
 * is asked LAST, as 3 AI-proposed palettes with rationale — never up front.
 */
import { NextRequest, NextResponse } from "next/server"
import { chatJSON, aiConfigured, type ChatMessage } from "@/lib/openai"

const SYSTEM = `You are Puglit's friendly product interviewer. You turn a founder's idea into a SaaS spec. You already know the product NAME (given in the first user message). Run a SHORT interview (aim 5–6 questions total) to fill this answers object:
- what: one sentence describing what the product does
- audience: who it's for
- benefits: array of 3 short key benefits (the user's words)
- monetization: "free" | "freemium" | "subscription"
- price: monthly price in USD as a number (0 if free)
- modules: subset of ["aiLayer","payments","emailLifecycle","contentBlog","engine","gamification","profiling","growth","geo","mobile"]
- languages: "en" | "es" | "both"
- color: a hex string like "#7C3AED"

HARD RULES:
1. Ask ONE question per turn.
2. ALWAYS start with a 1-sentence "reflection" of what you understood from their last answer (empty string on the very first turn).
3. Strongly prefer multiple choice: give 2–4 "options" each with a short "detail", and set allowOther=true so they can type their own. Use kind="text" ONLY for "what" and "benefits".
4. INFER aggressively from their free text — pre-fill the "answers" object and only ask what is still missing or ambiguous.
5. BRAND COLOR comes near the END, never early. When you ask it, set kind="color" and PROPOSE exactly 3 palette options; each option MUST include a real "color" hex and a one-line "detail" explaining the choice via color psychology tied to THIS product's audience + purpose.
6. When the answers object is complete enough to build the product, set done=true, write a final reflection, and return the full answers.

Respond with ONLY a JSON object of this exact shape:
{
 "reflection": string,
 "question": string,
 "field": "what"|"audience"|"benefits"|"monetization"|"modules"|"languages"|"color"|"done",
 "kind": "text"|"choice"|"color"|"done",
 "options": [{"id":"A","label":string,"detail":string,"color":string|null}],
 "allowOther": boolean,
 "answers": object,
 "done": boolean
}`

const EXTRACT = `From the interview transcript, output ONLY this JSON with the final answers (infer the best value for each from the whole conversation):
{"what": string, "audience": string, "benefits": [string,string,string], "monetization": "free"|"freemium"|"subscription", "price": number, "modules": string[] (subset of ["aiLayer","payments","emailLifecycle","contentBlog","engine","gamification","profiling","growth","geo","mobile"]), "languages": "en"|"es"|"both", "color": "#RRGGBB"}`

async function extractAnswers(productName: string, history: ChatMessage[]): Promise<Record<string, unknown>> {
  try {
    return (await chatJSON([
      { role: "system", content: EXTRACT },
      { role: "user", content: `Product name: "${productName}".\n\nTranscript:\n${history.map((m) => `${m.role}: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`).join("\n")}` },
    ], { temperature: 0 })) as Record<string, unknown>
  } catch { return {} }
}

export async function POST(request: NextRequest) {
  if (!aiConfigured()) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 })
  }
  try {
    const { messages, productName, hasLogo, hasWebsite } = await request.json()
    const history: ChatMessage[] = Array.isArray(messages) ? messages : []

    const ctx: string[] = []
    if (productName) ctx.push(`Product name: "${productName}".`)
    if (hasLogo) ctx.push("The founder already uploaded a logo — keep brand color suggestions compatible with an existing logo.")
    if (hasWebsite) ctx.push("The founder already has a website — keep the style coherent with an existing brand.")

    const full: ChatMessage[] = [
      { role: "system", content: SYSTEM },
      ...(ctx.length ? [{ role: "user", content: ctx.join(" ") } as ChatMessage] : []),
      ...history,
    ]

    const step = (await chatJSON(full)) as Record<string, unknown>

    // Normalize completion: the model sometimes signals done via kind/field but
    // not the boolean, and doesn't reliably accumulate `answers`. When finished,
    // run a dedicated extraction so generate always gets complete answers.
    const finished = step.done === true || step.kind === "done" || step.field === "done"
    if (finished) {
      const fresh = await extractAnswers(productName, history)
      step.answers = { ...(step.answers as object || {}), ...fresh }
      step.done = true
      step.kind = "done"
    }
    return NextResponse.json({ ok: true, step })
  } catch (e) {
    const msg = (e as Error).message || "error"
    console.error("[interview]", msg)
    return NextResponse.json({ error: msg.startsWith("ai_") ? msg : "interview_failed" }, { status: 500 })
  }
}
