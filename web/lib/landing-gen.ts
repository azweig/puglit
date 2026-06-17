/**
 * Puglit web — landing-gen.ts
 * Generates a COMPLETE, self-contained, bespoke landing page (HTML + inline CSS)
 * per product, so generated sites don't all look the same. The LLM designs a
 * layout/visual style fitting THIS product's sector, using its real palette,
 * logo monogram, tagline and value props. Rendered in a sandboxed iframe.
 */
import { chatText } from "@/lib/openai"
import type { DomainConfig, Localized } from "@/lib/domain-types"

function tr(v: Localized | undefined, lang: string): string {
  if (v == null) return ""
  if (typeof v === "string") return v
  return v[lang] ?? v.en ?? Object.values(v)[0] ?? ""
}

const SYSTEM = `You are an award-winning brand & web designer. Produce a COMPLETE, single-file, responsive landing page as ONE HTML document (with a <style> block of inline CSS; you MAY use a Google Fonts <link>; NO JavaScript, NO external images except inline SVG).

CRITICAL — make it look DISTINCT and tailored to THIS specific product and sector. Do NOT use a generic SaaS template. Vary the layout, hero composition, section structure, shapes and typography so two different products never look alike. Use the EXACT palette provided (primary, secondary, accent, background, text). Render the brand as the logo monogram in a tasteful mark. Be modern, polished, mobile-first, accessible contrast.

Include: a header with the logo+name, a hero (headline + subhead + a primary CTA button labeled with the given CTA), the value propositions as a well-designed section, a simple pricing or "free" mention if relevant, and a footer. Use the product's real copy. Keep it self-contained and production-looking.

Output ONLY the raw HTML document starting with <!DOCTYPE html>. No markdown, no code fences, no commentary.`

export async function generateLandingHtml(config: DomainConfig): Promise<string | null> {
  try {
    const lang = config.identity.languages?.[0] || "en"
    const id = config.identity
    const L = config.landing
    const palette = (id.palette || []).map((c) => `${c.label || "color"}: ${c.hex}`).join(", ")
    const vps = (L?.valueProps || []).map((v) => `- ${tr(v.title, lang)}: ${tr(v.body, lang)}`).join("\n")
    const brief = `PRODUCT: ${id.name}
LANGUAGE: write ALL copy in "${lang}".
TAGLINE: ${tr(id.tagline, lang)}
HERO HEADLINE: ${tr(L?.hero?.headline, lang) || id.name}
HERO SUBHEAD: ${tr(L?.hero?.subheadline, lang)}
PRIMARY CTA LABEL: ${tr(L?.hero?.ctaPrimary, lang) || "Get started"}
LOGO MONOGRAM: ${id.logoMonogram || id.name.slice(0, 2).toUpperCase()}
LOGO CONCEPT: ${id.logoConcept || "simple monogram"}
PALETTE (use these exact hexes): ${palette || id.brandColor}
PRIMARY COLOR: ${id.brandColor}
MONETIZATION: ${config.monetization?.model}
VALUE PROPS:\n${vps}
SECTOR/AUDIENCE: infer from the product; design accordingly.`

    const html = await chatText([
      { role: "system", content: SYSTEM },
      { role: "user", content: brief },
    ], { model: "gpt-4o", temperature: 0.8 })

    // strip accidental code fences
    let out = html.trim().replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim()
    if (!out.toLowerCase().includes("<!doctype") && !out.toLowerCase().includes("<html")) return null
    return out.slice(0, 120_000)
  } catch {
    return null
  }
}
