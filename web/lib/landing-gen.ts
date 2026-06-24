/**
 * Puglit web — landing-gen.ts
 * Generates a COMPLETE, self-contained, bespoke landing page (HTML + inline CSS)
 * per product, so generated sites don't all look the same. The LLM designs a
 * layout/visual style fitting THIS product's sector, using its real palette,
 * logo monogram, tagline and value props. Rendered in a sandboxed iframe.
 */
import { chatText, MODELS } from "@/lib/openai"
import type { DomainConfig, Localized } from "@/lib/domain-types"

function tr(v: Localized | undefined, lang: string): string {
  if (v == null) return ""
  if (typeof v === "string") return v
  return v[lang] ?? v.en ?? Object.values(v)[0] ?? ""
}

const SYSTEM = `You are an award-winning brand & web designer. Produce a COMPLETE, single-file, responsive landing page as ONE HTML document (a <style> block of inline CSS; you MAY use a Google Fonts <link>; NO JavaScript, NO external images).

LANGUAGE — ABSOLUTELY CRITICAL: write EVERY single word in the target language given in the brief. Buttons, section titles, nav, footer — all of it. If the language is Spanish, there must be ZERO English (no "Get started", no "Why Choose Us", no "Free to use"). Translate everything.

LOGO: if an SVG logo is provided in the brief, embed THAT EXACT <svg> markup as the brand logo in the header (sized ~34px) — do NOT replace it with letters or text.

QUALITY & VARIETY — make it look DISTINCT and tailored to THIS specific product and sector; do NOT use a generic SaaS template. Vary layout, hero composition, sections, shapes and typography. Use the EXACT palette provided. Be modern, polished, mobile-first, with real visual richness — this should look like a real, complete, designed product page, not a sparse skeleton.

Include a substantial page: header (logo+name+nav), a strong hero (headline + subhead + primary CTA with the given label), a value-props/features section using the product's REAL copy, a "how it works" or relevant secondary section, pricing or a free mention if relevant, an FAQ or social-proof touch, and a footer. Self-contained and production-looking.

Output ONLY the raw HTML document starting with <!DOCTYPE html>. No markdown, no code fences, no commentary.`

// For a FREE PUBLIC TOOL (calculator/converter): the page IS the working tool, not a marketing landing.
const TOOL_SYSTEM = `You build a SINGLE, SELF-CONTAINED, FULLY WORKING web app/tool as ONE HTML document — NOT a marketing page.
This is a FREE PUBLIC product: NO sign-up, NO login, NO pricing, NO marketing hero/FAQ, NO "Empezar gratis", NO "Built with" footer. The page IS the working product.
Build the ACTUAL working thing the brief describes, end-to-end, client-side. Use whatever browser APIs it needs:
- A calculator/converter → <input> fields + a <script> with the REAL formula that recomputes live as the user types, the result + a clear verdict, and (if comparing over time) an inline <svg> chart that ACTUALLY plots the data: build the series, map to coords with ~40px padding, draw visible <polyline>s (build the points string — never empty axes), mark any crossover/break-even.
- A CAMERA app → getUserMedia({video}) into a <video>, a <canvas> to grab frames, a capture button, and the live processing/recognition + result display.
- OFFLINE / PWA → register an inline service worker (Blob URL) that caches the shell, use localStorage/IndexedDB for data, and a web app manifest; fetch public APIs (e.g. PokeAPI) and CACHE the responses so it works with no network after first load. Make it installable.
- Match the requested DESIGN/skin EXACTLY (e.g. a Pokédex: red device body, screen, lights, d-pad/buttons). Use the EXACT brand color.
- PREMIUM DESIGN BAR (treat as a hard spec, inline CSS): a real, polished product — NOT default browser styling. Specifically:
  · A centered card/app surface (max-width ~440px on a soft page background or subtle gradient), generous padding (~24-32px), rounded corners (16-20px), layered shadows (a soft large shadow), 1px hairline border.
  · CONTRAST AA: dark ink text on light surfaces; never gray-on-gray or invisible text. Inputs have a visible border, padding (~12px), rounded, and a focus state (ring/border in the brand color).
  · Type hierarchy: a bold title (~24-28px), readable body, small muted labels (~13px, 60% opacity). Consistent 8px spacing rhythm.
  · The primary result is BIG and prominent (large number/verdict in the brand color). Buttons: filled brand color, white text, hover + active states, rounded.
  · System font stack, mobile-first (works at 360px wide), smooth transitions (0.15s). No ugly default input/button/select — style every one.
IMPLEMENT REAL LOGIC, not stubs or placeholders. If something genuinely needs a model that can't run purely client-side (e.g. specific image recognition), do the best honest approximation (a generic TF.js classifier from a CDN, or capture→manual-confirm) and LABEL it clearly as "demo/aproximado" — NEVER fake a result silently.
Everything inline (CSS in <style>, JS in <script>); one file that opens and works. External CDNs ONLY if truly required (e.g. a TF.js model). Use the product's language.
Output ONLY the raw HTML document starting with <!DOCTYPE html>. No markdown, no code fences, no commentary.`

// Distinct design directions so the two options look genuinely different.
const DIRECTIONS = [
  "Bold & editorial: oversized headline typography, asymmetric layout, strong color blocks, generous whitespace, confident and premium.",
  "Warm & approachable: rounded cards, soft shadows, friendly imagery via inline SVG/illustration shapes, gentle gradients, cozy and human.",
  "Sleek & techy: dark or high-contrast theme, glassy/gradient accents, tight grid, modern mono+sans mix, product-led.",
  "Minimal & elegant: lots of white space, refined serif/sans pairing, thin dividers, understated luxury.",
]

export async function generateLandingVariants(config: DomainConfig, count = 2): Promise<string[]> {
  const dirs = DIRECTIONS.slice(0, count)
  const results = await Promise.all(dirs.map((d) => generateLandingHtml(config, d)))
  return results.filter((h): h is string => !!h)
}

export async function generateLandingHtml(config: DomainConfig, styleDirection?: string, asTool = false): Promise<string | null> {
  try {
    const lang = config.identity.languages?.[0] || "en"
    const id = config.identity
    const L = config.landing
    // FREE PUBLIC TOOL (calculator/converter/…) → not a SaaS: no register, no pricing, the CTA opens the tool.
    const monModel = (config.monetization as { model?: string } | undefined)?.model || "free"
    const looksLikeTool = /calculadora|calculator|convert|conversor|tool|herramienta|generador|generator|estimador|simulador|comparador|pokedex|pokemon|c[aá]mara|camera|scanner|esc[aá]ner|reconoc|recogn|visor|viewer|detector|juego|\bgame\b/i.test(`${id.name} ${tr(id.tagline, lang)}`)
    const publicTool = asTool || (config as { triage?: { complexity?: string } }).triage?.complexity === "tool" || (monModel === "free" && looksLikeTool)
    const toolDirective = publicTool ? `

HARD OVERRIDE — THIS IS A FREE PUBLIC TOOL WITH NO ACCOUNTS (not a SaaS):
- NEVER include sign-up / "Empezar gratis" / "Crear cuenta" / login / a pricing section / an FAQ about cost or cancellation or billing.
- The SINGLE primary CTA must OPEN THE TOOL: label it like "Abrir la calculadora" / "Usar ahora" and link it to "/" (the tool itself). Any secondary CTA also links to "/".
- Keep the hero headline SHORT (max ~8 words) — do NOT dump the whole description as the headline; summarize what the tool does.
- The page introduces the tool briefly and sends the user straight INTO it.` : ""
    const palette = (id.palette || []).map((c) => `${c.label || "color"}: ${c.hex}`).join(", ")
    const vps = (L?.valueProps || []).map((v) => `- ${tr(v.title, lang)}: ${tr(v.body, lang)}`).join("\n")
    const brief = `PRODUCT: ${id.name}
LANGUAGE (write EVERYTHING in this language, zero other languages): "${lang}"
${id.logoSvg ? `LOGO SVG (embed this EXACT markup as the header logo, ~34px, do not use letters instead):\n${id.logoSvg}` : ""}
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
SECTOR/AUDIENCE: infer from the product; design accordingly.${styleDirection ? `\nDESIGN DIRECTION (follow this style): ${styleDirection}` : ""}${toolDirective}`

    // gpt-4o is hardcoded → it does NOT exist on a local Ollama install, so the call failed and EVERY
    // product fell back to the generic <Landing> marketing template. Use the provider's configured model.
    const html = await chatText([
      { role: "system", content: publicTool ? TOOL_SYSTEM : SYSTEM },
      { role: "user", content: brief },
    ], { model: MODELS.code, temperature: publicTool ? 0.4 : 0.8 })

    // strip accidental code fences
    let out = html.trim().replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim()
    if (!out.toLowerCase().includes("<!doctype") && !out.toLowerCase().includes("<html")) return null
    return out.slice(0, 120_000)
  } catch {
    return null
  }
}
