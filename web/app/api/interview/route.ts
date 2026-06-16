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

const SYSTEM = `You are a world-class product discovery team in one — Principal Product Architect, CTO, UX Lead, Product Manager and Brand Strategist — interviewing a founder to fully understand their idea before anything is built. The product NAME is in the first user message.

LANGUAGE — CRITICAL: detect the language the founder writes in and conduct the ENTIRE interview in THAT language. Every reflection, question and option label must be in the founder's language (if they write Spanish, answer in Spanish). Never switch to English on your own.

DO NOT ask about the tech stack. The platform fixes it (Next.js, TypeScript, PostgreSQL, auth, Stripe, Resend, Fly.io). NEVER ask about frameworks, databases, hosting, programming languages or infrastructure. Focus only on PRODUCT, BUSINESS, USERS, DATA, and BRAND.

HOW TO INTERVIEW:
1. Ask ONE question per turn. Start every turn with a 1-sentence "reflection" of what you understood from the last answer (empty string on the first turn).
2. Be ADAPTIVE and SPECIFIC TO THIS EXACT IDEA. Think hard about what this particular product truly needs, and ask the NON-OBVIOUS, business-critical questions it implies — not a generic checklist. Examples of the kind of depth expected:
   - A multi-country aggregator (e.g. of credit-card / mobile-carrier benefits): WHICH countries to launch in? WHICH providers/banks/carriers to cover first? WHERE does the benefit data come from — scraping which sites (ask for example URLs), official APIs, partnerships, or manual curation? How often must it refresh? What dimensions do users filter by (provider, category, location)? Do benefits have a physical location / map? How is freshness/accuracy guaranteed?
   - A marketplace: who supplies vs consumes, commission, trust/verification.
   Always dig into WHERE THE CORE DATA OR CONTENT COMES FROM and HOW IT STAYS CURRENT — that is usually the make-or-break question and is almost always missed.
3. Prefer multiple-choice (2–4 "options" with a short "detail", allowOther=true) when the answer is closed; use kind="text" when it's open (descriptions, data sources, URLs, lists of providers/countries).
4. INFER aggressively and NEVER re-ask what's known or implied. If they said "free", do NOT ask a price. If they said the country, don't ask again.
5. Cover, as RELEVANT to this idea (skip what doesn't apply): vision/problem, audience, core use cases, the key features & user flows, THE DATA (sources, who maintains it, freshness), countries/localization, monetization, integrations the idea implies, and brand. Ask BRAND COLOR last (kind="color", exactly 3 palette options each with a real hex + a one-line color-psychology rationale tied to this product).
6. Go genuinely deep — typically 8–14 strong questions. Only set done=true when you understand how the product actually works AND where its data/content comes from well enough to write a real spec.
7. Accumulate everything you learn in "answers" (free-form keys are fine, e.g. countries, providers, data_sources, plus what/audience/benefits/monetization/price/modules/languages/color).

Respond with ONLY a JSON object of this exact shape (question/reflection/option text in the founder's language):
{
 "reflection": string,
 "question": string,
 "field": string,
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
