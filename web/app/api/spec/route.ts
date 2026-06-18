/**
 * POST /api/spec
 * After the interview, produce a complete DIAGNOSIS — a "Project Master
 * Specification" of everything Puglit will build — for the user to review
 * BEFORE any code is generated. It deliberately does NOT ask/choose the tech
 * stack (Puglit fixes that); instead it states what will be generated on it.
 */
import { NextRequest, NextResponse } from "next/server"
import { chatJSON, aiConfigured, MODELS, type ChatMessage } from "@/lib/openai"
import { generateLogoSvg } from "@/lib/logo-gen"

const SYSTEM = `You are a Principal Product Architect + CTO + UX Lead + Product Manager + Brand Strategist. From the interview transcript, produce a COMPLETE Project Master Specification for the product — detailed enough that an AI could generate the full app. Be concrete and specific to THIS product (no generic filler); infer sensible specifics where the user didn't say.

LANGUAGE: write ALL prose values in the SAME language the founder used in the transcript (e.g. if they wrote Spanish, the whole spec must be in Spanish). Keep entity/field names in English (they map to code).

Pay special attention to product-specific essentials the founder mentioned — e.g. for a data aggregator: the COUNTRIES targeted, the PROVIDERS covered, and WHERE THE DATA COMES FROM (scraping/APIs/partnerships/manual) and how it's kept fresh. If something critical wasn't decided, put it in "openQuestions" rather than inventing it.

BE COMPLETE — this must be enough to build a WHOLE app, not a sketch:
- screens: list EVERY screen for EVERY role, including PUBLIC/end-customer-facing ones (e.g. a public booking page for diners, a search page for visitors), auth screens, and admin screens — each with its purpose.
- roles: include every distinct actor (e.g. restaurant/owner, diner/customer, admin) with a real permission list.
- userFlows: include the critical and EDGE flows (e.g. payment authorization → capture vs refund, cancellation/no-show handling, same-day reminders, repeat-customer tracking).
- dataModel: every entity with fields + relations needed for the features.
- For branding.palette give a full, sector-appropriate palette (primary/secondary/accent/background/text + shades) with real distinct hexes — NOT a single color repeated; branding.primaryColor is the main brand hex; branding.logo gives a monogram (1-2 letters from the name) and a one-line logo concept fitting the sector.

IMPORTANT: Do NOT choose or ask about the tech stack — it is FIXED by the platform (Next.js, TypeScript, PostgreSQL, auth, Stripe, Resend, Fly.io). In "generatedStack" just state what will be generated on that fixed stack for THIS product.

ARCHETYPE & HONESTY (critical — this is how we avoid building a nonsensical shell):
- "archetype": classify the product as ONE of: "game" | "status_monitoring" | "marketplace" | "social" | "content_feed" | "directory" | "dashboard" | "ecommerce" | "tool" | "saas_accounts" | "other".
- "ossAlternatives": if a MATURE open-source project already does ~90% of this (status page → Upptime/Cachet/Statping; analytics → Plausible/Umami; forum → Discourse; wiki → Outline; forms → Formbricks; etc.), list 1-3 as {"name","url","why"} and be honest that adopting/forking it may beat a from-scratch build. Empty array if none truly fits.
- "neededFromYou": the REAL inputs only the founder can provide for this to actually work — be specific: a status/monitoring product needs the ACTUAL endpoints/services to check (URLs, expected status, cadence); a data-driven product needs the data source/API/credentials; an integrations product needs the accounts to connect. Short imperative strings. If the build ships with sample/seed data until these are provided, also say so in "assumptions".
- Do NOT invent a money path that contradicts the model: if monetization is "free" there is NO pricing page and NO "registrate gratis"/paywall; if the product is public (it IS the homepage, no login) there is NO signup screen. State this explicitly in "monetization".

Return ONLY JSON with this exact shape (arrays of short, concrete strings unless noted):
{
  "archetype": "game"|"status_monitoring"|"marketplace"|"social"|"content_feed"|"directory"|"dashboard"|"ecommerce"|"tool"|"saas_accounts"|"other",
  "ossAlternatives": [{ "name": string, "url": string, "why": string }],
  "neededFromYou": string[],
  "executiveSummary": string,
  "problem": string,
  "audience": string,
  "useCases": string[],
  "features": { "mustHave": string[], "niceToHave": string[], "future": string[] },
  "roles": [{ "role": string, "permissions": string[] }],
  "dataModel": [{ "entity": string, "fields": string[], "relations": string[] }],
  "screens": [{ "name": string, "purpose": string }],
  "userFlows": string[],
  "branding": { "name": string, "tagline": string, "voice": string, "primaryColor": "#RRGGBB", "palette": [{ "hex": "#RRGGBB", "label": string }] (5-8 colors: primary, secondary, accent, background, text, plus shades), "logo": { "monogram": string (1-2 letters), "concept": string (one line describing the logo idea) } },
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
    const { messages, productName, references } = await request.json()
    const history: ChatMessage[] = Array.isArray(messages) ? messages : []
    const transcript = history.map((m) => `${m.role}: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`).join("\n")
    const refBlock = typeof references === "string" && references.trim()
      ? `\n\nREFERENCES the founder provided (web pages / docs / images — use them for data interpretation, brand and feature suggestions):\n${references.slice(0, 6000)}`
      : ""

    const spec = await chatJSON([
      { role: "system", content: SYSTEM },
      { role: "user", content: `Product name: "${productName}".\n\nInterview transcript:\n${transcript}${refBlock}` },
    ], { model: MODELS.premium, temperature: 0.3 }) as any

    // Generate the real vector logo now so the diagnosis can show it.
    try {
      const b = spec?.branding || {}
      const pal = Array.isArray(b.palette) ? b.palette : []
      const svg = await generateLogoSvg({
        identity: {
          name: productName, tagline: b.tagline || "", domain: "", languages: ["en"],
          brandColor: b.primaryColor, accentColor: pal[2]?.hex, logoConcept: b.logo?.concept,
        },
      } as any)
      if (svg) { spec.branding = { ...b, logoSvg: svg } }
    } catch { /* logo optional */ }

    return NextResponse.json({ ok: true, spec })
  } catch (e) {
    console.error("[spec]", (e as Error).message)
    return NextResponse.json({ error: "spec_failed" }, { status: 500 })
  }
}
