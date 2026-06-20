/**
 * art-director.ts — the design specialist that turns a product's brand into a REAL logo
 * image (via image-gen.ts). It crafts a tight text-to-image prompt using the design
 * playbook, then generates the image. Returns a PNG data URI, or null → caller falls back
 * to the LLM-written SVG monogram (graceful when no image provider is configured).
 */
import { chatText, MODELS } from "@/lib/openai"
import { generateImageDataUri, imageGenAvailable } from "@/lib/image-gen"
import { PLAYBOOK } from "@/lib/playbooks"
import type { DomainConfig } from "@/lib/domain-types"

async function craftLogoPrompt(config: DomainConfig): Promise<string> {
  const name = config.identity.name
  const color = config.identity.brandColor || "#7C3AED"
  const concept = config.identity.logoConcept || ""
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const sys = `You are an Art Director. Write ONE concise text-to-image prompt (<55 words) for a modern, minimal, MEMORABLE app LOGO mark: a clean flat vector-style icon/symbol (NOT text-heavy; no words/letters unless a single monogram glyph), bold simple shapes, on a transparent background, legible at 32px. ${PLAYBOOK.design.split("\n")[1] || ""} Output ONLY the prompt text.`
  const usr = `Product: ${name}${tagline ? ` — ${tagline}` : ""}. Brand color: ${color}.${concept ? ` Concept hint: ${concept}.` : ""}`
  const p = (await chatText([{ role: "system", content: sys }, { role: "user", content: usr }], { model: MODELS.cheap, temperature: 0.6 }).catch(() => "")).trim()
  return (p || `Minimal flat vector logo mark for "${name}", brand color ${color}, bold simple memorable icon, transparent background`).slice(0, 500)
}

/** Generate a REAL logo image for the product → PNG data URI, or null (→ fall back to SVG). */
export async function generateBrandLogo(config: DomainConfig): Promise<{ dataUri: string; prompt: string } | null> {
  if (!imageGenAvailable()) return null
  const prompt = await craftLogoPrompt(config)
  const dataUri = await generateImageDataUri({ prompt, size: "1024x1024", transparent: true })
  return dataUri ? { dataUri, prompt } : null
}
