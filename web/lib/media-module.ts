/**
 * media-module.ts — image processing (resize / optimize / thumbnail / format convert). Thin
 * client to the gateway's /image endpoint (Pillow) — no native sharp dep in-app. Pairs with the
 * storage module: upload → optimize → store. process(url|bytes, {width,height,fmt}). env: SCRAPER_URL.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const MEDIA = `const gateway = () => (process.env.MEDIA_URL || process.env.SCRAPER_URL || "http://localhost:8200").replace(/\\/$/, "")
/** Resize/optimize an image. Pass a URL or base64; get back optimized base64 (webp by default). */
export async function optimizeImage(input: { url?: string; dataB64?: string }, opts?: { width?: number; height?: number; quality?: number; fmt?: "webp" | "jpeg" | "png" }) {
  try {
    return await fetch(gateway() + "/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: input.url, data_b64: input.dataB64, width: opts?.width, height: opts?.height, quality: opts?.quality ?? 82, fmt: opts?.fmt || "webp" }) }).then((r) => r.json())
  } catch (e) { console.error("[media]", (e as Error).message); return null }
}
`

export function deterministicMedia(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /imagen|image|foto|photo|thumbnail|miniatura|resize|optimiz|avatar|galer|gallery|portfolio|banner|cover|upload.*(image|foto)|watermark/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/media.ts", content: MEDIA }] }
}
