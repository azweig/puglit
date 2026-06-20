/**
 * image-gen.ts — raster image generation (logos, covers) behind a provider abstraction,
 * mirroring openai.ts. Lets the art-director produce a REAL logo image instead of an
 * LLM-written SVG monogram. ALWAYS graceful: no provider configured / any failure → returns
 * null so the caller falls back to the SVG (zero breakage when unset).
 *
 * Provider (env):
 *  - PUGLIT_IMAGE_PROVIDER = "openai" | "compat" | "none"  (default: auto)
 *  - PUGLIT_IMAGE_URL  — an OpenAI-compatible images endpoint base (local FLUX/SD via LocalAI,
 *                        or a fal/replicate proxy). e.g. http://localhost:8080/v1
 *  - PUGLIT_IMAGE_MODEL — gpt-image-1 (openai) | flux.1-schnell / sdxl (local)
 *  - PUGLIT_IMAGE_KEY  — falls back to OPENAI_API_KEY
 *
 * On the A40: run a local OpenAI-compatible image server (LocalAI with a FLUX/SDXL model)
 * and point PUGLIT_IMAGE_URL at it → 100% local/free logos. Or just set OPENAI_API_KEY to
 * use gpt-image-1 (BYOK). Mind VRAM: a 12-24GB image model + the 32B coder won't co-reside
 * on 44GB, so run image gen when the coder isn't loaded (or on a second GPU).
 */
export type ImageSize = "256x256" | "512x512" | "1024x1024"

function imageProvider(): { kind: "openai" | "compat" | "none"; url: string; key: string; model: string } {
  const explicit = process.env.PUGLIT_IMAGE_PROVIDER
  const key = process.env.PUGLIT_IMAGE_KEY || process.env.OPENAI_API_KEY || ""
  const url = (process.env.PUGLIT_IMAGE_URL || "").replace(/\/$/, "")
  const model = process.env.PUGLIT_IMAGE_MODEL || (url ? "flux.1-schnell" : "gpt-image-1")
  if (explicit === "none") return { kind: "none", url: "", key: "", model }
  if (explicit === "compat" || (!explicit && url)) return { kind: "compat", url: url || "http://localhost:8080/v1", key, model }
  if (explicit === "openai" || (!explicit && key)) return { kind: "openai", url: "https://api.openai.com/v1", key, model }
  return { kind: "none", url: "", key: "", model }
}

export function imageGenAvailable(): boolean { return imageProvider().kind !== "none" }
export function imageProviderInfo() { const p = imageProvider(); return { provider: p.kind, model: p.model, url: p.kind === "compat" ? p.url : undefined } }

/** Generate one image → PNG bytes (Buffer), or null if no provider / on any failure. */
export async function generateImage(opts: { prompt: string; size?: ImageSize; transparent?: boolean }): Promise<Buffer | null> {
  const p = imageProvider()
  if (p.kind === "none") return null
  try {
    const body: Record<string, unknown> = { model: p.model, prompt: opts.prompt.slice(0, 1000), size: opts.size || "1024x1024", n: 1 }
    if (opts.transparent && p.kind === "openai") body.background = "transparent"
    const res = await fetch(`${p.url}/images/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(p.key ? { Authorization: `Bearer ${p.key}` } : {}) },
      body: JSON.stringify(body),
    })
    if (!res.ok) { console.error("[image-gen]", p.kind, res.status, (await res.text().catch(() => "")).slice(0, 200)); return null }
    const d = await res.json()
    const item = d?.data?.[0]
    if (item?.b64_json) return Buffer.from(item.b64_json, "base64")
    if (item?.url) { const img = await fetch(item.url); return Buffer.from(await img.arrayBuffer()) }
    return null
  } catch (e) { console.error("[image-gen] failed:", (e as Error).message); return null }
}

/** Same, returned as a data: URI (for embedding in config/identity or <img src>). */
export async function generateImageDataUri(opts: { prompt: string; size?: ImageSize; transparent?: boolean }): Promise<string | null> {
  const buf = await generateImage(opts)
  return buf ? `data:image/png;base64,${buf.toString("base64")}` : null
}
