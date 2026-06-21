/**
 * docparse-module.ts — any document → clean Markdown (microsoft/markitdown via the gateway).
 * The bridge from files to AI: PDF / Word / Excel / PowerPoint / HTML / images → Markdown you can
 * feed straight into the rag or llm modules. Thin client → no parser dep in-app. env: SCRAPER_URL.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const DOCPARSE = `const gateway = () => (process.env.DOCPARSE_URL || process.env.SCRAPER_URL || "http://localhost:8200").replace(/\\/$/, "")
/** Convert a document to Markdown. Pass a URL, or base64 + filename (so the parser knows the type). */
export async function toMarkdown(input: { url?: string; dataB64?: string; filename?: string }): Promise<string> {
  try {
    const r = await fetch(gateway() + "/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: input.url, data_b64: input.dataB64, filename: input.filename || "doc" }) }).then((x) => x.json())
    return r.markdown || ""
  } catch (e) { console.error("[docparse]", (e as Error).message); return "" }
}
`

export function deterministicDocparse(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /documento|document|pdf|word|docx|excel|xlsx|powerpoint|pptx|markdown|parse|ingest|knowledge base|base de conocimiento|subir.*(doc|archivo)|adjunt|attach|resum.*doc|chat with.*(pdf|doc)|preguntale.*(pdf|doc)/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/docparse.ts", content: DOCPARSE }] }
}
