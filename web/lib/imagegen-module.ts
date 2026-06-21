/**
 * imagegen-module.ts — text → image (products, banners, avatars, illustrations), general purpose
 * (the logo capability was logo-only). Provider-agnostic: a local FLUX/SD server (free) or
 * OpenAI/any. generateImage(prompt) → base64/url. env: IMAGE_GEN_URL, IMAGE_PROVIDER, OPENAI_API_KEY.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const IMAGEGEN = `const provider = () => process.env.IMAGE_PROVIDER || (process.env.IMAGE_GEN_URL ? "local" : "openai")

/** Generate an image from a prompt. Returns { dataB64 } (local FLUX) or { url } (OpenAI). */
export async function generateImage(prompt: string, opts?: { width?: number; height?: number }): Promise<{ dataB64?: string; url?: string } | null> {
  try {
    if (provider() === "local") {
      // local FLUX/SD server (see infra/flux-server.py) → returns base64
      const base = (process.env.IMAGE_GEN_URL || "http://localhost:8300").replace(/\\/$/, "")
      const r = await fetch(base + "/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, width: opts?.width || 1024, height: opts?.height || 1024 }) }).then((x) => x.json())
      return r.image_b64 ? { dataB64: r.image_b64 } : null
    }
    // OpenAI images (gpt-image-1 / dall-e)
    const r = await fetch("https://api.openai.com/v1/images/generations", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.OPENAI_API_KEY }, body: JSON.stringify({ model: process.env.IMAGE_MODEL || "gpt-image-1", prompt, size: (opts?.width || 1024) + "x" + (opts?.height || 1024) }) }).then((x) => x.json())
    const d = r?.data?.[0]
    return d ? { url: d.url, dataB64: d.b64_json } : null
  } catch (e) { console.error("[imagegen]", (e as Error).message); return null }
}
`

export function deterministicImageGen(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /genera.*(imagen|image)|image gen|text.?to.?image|ilustrac|illustration|avatar|banner|arte|art\b|dise[nñ]o|design.*image|flux|stable diffusion|midjourney|dall|ai image|imagen ai/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/imagegen.ts", content: IMAGEGEN }] }
}
