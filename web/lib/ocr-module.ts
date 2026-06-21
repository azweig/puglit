/**
 * ocr-module.ts — image/scan/PDF → text (Tesseract via the gateway). Thin client → no native OCR
 * dep in-app. ocr(url|bytes, lang) → extracted text. Great for receipts, IDs, documents, business
 * cards. env: OCR_URL (or the shared SCRAPER_URL gateway).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const OCR = `const gateway = () => (process.env.OCR_URL || process.env.SCRAPER_URL || "http://localhost:8200").replace(/\\/$/, "")
/** Extract text from an image. Pass a URL or base64. lang e.g. "eng", "spa", "eng+spa". */
export async function ocr(input: { url?: string; dataB64?: string }, lang = "eng+spa"): Promise<string> {
  try {
    const r = await fetch(gateway() + "/ocr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: input.url, data_b64: input.dataB64, lang }) }).then((x) => x.json())
    return r.text || ""
  } catch (e) { console.error("[ocr]", (e as Error).message); return "" }
}
`

export function deterministicOcr(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /ocr|escane|scan|reconoc.*texto|text.*image|recibo|receipt|factura.*foto|documento|id\b|dni|pasaporte|passport|business card|tarjeta|extraer texto|leer.*imagen/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/ocr.ts", content: OCR }] }
}
