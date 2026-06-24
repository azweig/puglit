/**
 * Puglit web — logo-gen.ts
 * Generates a REAL vector logo MARK (an SVG icon, not just letters) per product,
 * from the logo concept + palette. Embedded in the landing and shown in the preview.
 */
import { chatText, MODELS } from "@/lib/openai"
import type { DomainConfig } from "@/lib/domain-types"

const SYSTEM = `You are a top brand logo designer. Design ONE clean, modern, flat VECTOR logo MARK (an icon — NOT text, NOT letters) as a single self-contained SVG.
Requirements:
- viewBox="0 0 64 64", no width/height attributes.
- Use the brand colors given (primary + accent). Simple, bold geometric shapes; recognizable at 24px; minimal paths; flat (no heavy gradients, no filters, no external refs).
- The mark must visually evoke the described concept / the product's sector.
- NO text, NO letters, NO words inside the SVG.
Output ONLY the SVG markup, starting with <svg and ending with </svg>. No markdown, no commentary.`

export async function generateLogoSvg(config: DomainConfig): Promise<string | null> {
  try {
    const id = config.identity
    const primary = id.brandColor || "#7C3AED"
    const accent = id.accentColor || primary
    const concept = id.logoConcept || `a mark for ${id.name}`
    const out = await chatText([
      { role: "system", content: SYSTEM },
      { role: "user", content: `Brand: ${id.name}. Sector hint: ${typeof id.tagline === "string" ? id.tagline : Object.values(id.tagline)[0]}. Concept: ${concept}. Primary: ${primary}. Accent: ${accent}.` },
    ], { model: MODELS.code, temperature: 0.6 })
    let svg = out.trim().replace(/^```(svg|html|xml)?\s*/i, "").replace(/```\s*$/i, "").trim()
    const i = svg.indexOf("<svg"), j = svg.lastIndexOf("</svg>")
    if (i === -1 || j === -1) return null
    svg = svg.slice(i, j + 6)
    return svg.slice(0, 8000)
  } catch {
    return null
  }
}
