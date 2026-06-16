/**
 * POST /api/spec
 * After the interview, produce a complete DIAGNOSIS — a "Project Master
 * Specification" of everything Puglit will build — for the user to review
 * BEFORE any code is generated. It deliberately does NOT ask/choose the tech
 * stack (Puglit fixes that); instead it states what will be generated on it.
 */
import { NextRequest, NextResponse } from "next/server"
import { chatJSON, aiConfigured, type ChatMessage } from "@/lib/openai"

const SYSTEM = `You are a Principal Product Architect + CTO + UX Lead + Product Manager + Brand Strategist. From the interview transcript, produce a COMPLETE Project Master Specification for the product — detailed enough that an AI could generate the full app. Be concrete and specific to THIS product (no generic filler); infer sensible specifics where the user didn't say.

IMPORTANT: Do NOT choose or ask about the tech stack — it is FIXED by the platform (Next.js, TypeScript, PostgreSQL, auth, Stripe, Resend, Fly.io). In "generatedStack" just state what will be generated on that fixed stack for THIS product.

Return ONLY JSON with this exact shape (arrays of short, concrete strings unless noted):
{
  "executiveSummary": string,
  "problem": string,
  "audience": string,
  "useCases": string[],
  "features": { "mustHave": string[], "niceToHave": string[], "future": string[] },
  "roles": [{ "role": string, "permissions": string[] }],
  "dataModel": [{ "entity": string, "fields": string[], "relations": string[] }],
  "screens": [{ "name": string, "purpose": string }],
  "userFlows": string[],
  "branding": { "name": string, "tagline": string, "colorRationale": string, "voice": string },
  "content": { "emails": string[], "notifications": string[], "legal": string[] },
  "monetization": string,
  "integrations": [{ "name": string, "purpose": string }],
  "analytics": string[],
  "ai": string,
  "risks": string[],
  "assumptions": string[],
  "generatedStack": string[],
  "openQuestions": string[]
}`

export async function POST(request: NextRequest) {
  if (!aiConfigured()) return NextResponse.json({ error: "ai_not_configured" }, { status: 503 })
  try {
    const { messages, productName } = await request.json()
    const history: ChatMessage[] = Array.isArray(messages) ? messages : []
    const transcript = history.map((m) => `${m.role}: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`).join("\n")

    const spec = await chatJSON([
      { role: "system", content: SYSTEM },
      { role: "user", content: `Product name: "${productName}".\n\nInterview transcript:\n${transcript}` },
    ], { model: "gpt-4o", temperature: 0.3 })

    return NextResponse.json({ ok: true, spec })
  } catch (e) {
    console.error("[spec]", (e as Error).message)
    return NextResponse.json({ error: "spec_failed" }, { status: 500 })
  }
}
