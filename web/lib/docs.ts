/**
 * Puglit web — docs.ts
 * Two independent documentation agents whose output goes into the generated repo:
 *  - Technical Writer  → docs/technical/* (architecture, flows, UML, API, security, deploy)
 *  - Business Strategist → docs/business/* (SWOT/FODA, Lean Canvas, competitors, GTM,
 *    pricing, market sizing) + a YC-style pitch deck (self-contained HTML, print-to-PDF).
 */
import { chatJSON, chatText, aiConfigured, MODELS } from "@/lib/openai"
import type { DomainConfig, Localized } from "@/lib/domain-types"

function loc(v: Localized | undefined, lang: string): string {
  if (v == null) return ""
  if (typeof v === "string") return v
  return v[lang] ?? v.en ?? Object.values(v)[0] ?? ""
}
type File = { path: string; content: string }
function under(prefix: string, files: any[]): File[] {
  return (Array.isArray(files) ? files : [])
    .filter((f) => f?.path && typeof f.content === "string")
    .slice(0, 8)
    .map((f) => {
      let name = String(f.path).split("/").pop() || "DOC.md"
      if (!/\.(md|html)$/i.test(name)) name += ".md"
      return { path: `${prefix}${name}`, content: String(f.content).slice(0, 40_000) }
    })
}

const TECH_SYS = `You are a Principal Engineer + technical writer. Produce COMPREHENSIVE technical documentation for the given product, built on the Puglit/TodoAstros stack (Next.js 16, TypeScript, PostgreSQL via pooler, auth JWT, Stripe, Resend, Fly.io). Cover, as separate markdown files:
- ARCHITECTURE.md — system overview, component/module map, the stack and why, how requests flow.
- DATA-FLOWS.md — the key user/data flows as Mermaid sequence diagrams.
- DATA-MODEL.md — the ER diagram (Mermaid) + a description of each entity and relationship.
- API.md — the endpoints (from the contract), request/response, auth, gating.
- SECURITY.md — threat model, authz matrix, RLS, rate-limiting, data handling.
- DEPLOYMENT.md — envs, migrations, Fly/Vercel deploy, CI, observability.
Use Mermaid for all diagrams. Be specific to THIS product. Return ONLY JSON: {"files":[{"path":"ARCHITECTURE.md","content":"<markdown>"}, ...]}.`

const BIZ_SYS = `You are an ex-McKinsey strategist + Y Combinator partner. Produce a COMPLETE, investor-grade business package for the product, in the product's language. As separate markdown files:
- SWOT.md (FODA) — strengths, weaknesses, opportunities, threats.
- LEAN-CANVAS.md — the full Lean Canvas (problem, solution, UVP, unfair advantage, channels, segments, cost, revenue, metrics).
- COMPETITORS.md — real/likely competitors, positioning, differentiation, feature comparison.
- MARKET.md — TAM/SAM/SOM with reasoning, trends, timing.
- GTM.md — go-to-market: acquisition channels, launch plan, growth loops.
- PRICING.md — pricing strategy, tiers, rationale, willingness-to-pay.
Be concrete and rigorous (numbers with stated assumptions). Return ONLY JSON: {"files":[{"path":"SWOT.md","content":"<markdown>"}, ...]}.`

export async function genTechnicalDocs(config: DomainConfig, contracts: string, erd: string): Promise<File[]> {
  if (!aiConfigured()) return []
  try {
    const lang = config.identity.languages?.[0] || "en"
    const ents = (config.entities || []).map((e) => `${e.name}(${e.fields.map((f) => f.name + ":" + f.type).join(",")})`).join("; ")
    const out = (await chatJSON([
      { role: "system", content: TECH_SYS },
      { role: "user", content: `Language: ${lang}. Product: ${config.identity.name} — ${loc(config.identity.tagline, lang)}. Entities: ${ents}. Modules: ${Object.keys(config.modules || {}).filter((k) => (config.modules as any)[k]).join(", ")}.\nCONTRACTS:\n${contracts}\nER (Mermaid):\n${erd}` },
    ], { model: MODELS.balanced, temperature: 0.3 })) as { files?: any[] }
    return under("docs/technical/", out.files || [])
  } catch { return [] }
}

export async function genBusinessDocs(config: DomainConfig): Promise<File[]> {
  if (!aiConfigured()) return []
  const lang = config.identity.languages?.[0] || "en"
  const ctx = `Language: ${lang}. Product: ${config.identity.name} — ${loc(config.identity.tagline, lang)}. What: ${config.engine?.description || ""}. Monetization: ${config.monetization?.model}.`
  const files: File[] = []
  try {
    const out = (await chatJSON([{ role: "system", content: BIZ_SYS }, { role: "user", content: ctx }], { model: MODELS.balanced, temperature: 0.5 })) as { files?: any[] }
    files.push(...under("docs/business/", out.files || []))
  } catch { /* analysis optional */ }
  try {
    const brand = config.identity.brandColor || "#7C3AED"
    const deck = await chatText([
      { role: "system", content: `You are a pitch-deck designer. Produce a self-contained, print-to-PDF, Y-Combinator-style PITCH DECK as ONE HTML document (inline CSS, no JS). One <section> per slide (full-viewport), in this order: Cover, Problem, Solution, Product (how it works), Market (TAM/SAM/SOM), Business model, Go-to-market, Competition, Traction/roadmap, Team, The Ask. Use the brand color ${brand}. Punchy, investor copy in the product's language. Output ONLY the HTML starting with <!DOCTYPE html>.` },
      { role: "user", content: ctx },
    ], { model: MODELS.balanced, temperature: 0.6 })
    let html = deck.trim().replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim()
    if (html.toLowerCase().includes("<html") || html.toLowerCase().includes("<!doctype")) files.push({ path: "docs/business/pitch-deck.html", content: html.slice(0, 120_000) })
  } catch { /* deck optional */ }
  return files
}
