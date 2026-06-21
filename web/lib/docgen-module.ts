/**
 * docgen-module.ts — GENERATE Office documents (inspired by anthropics/skills docx/xlsx/pptx).
 * The write-side counterpart to docparse (read). makeDocx(title, paragraphs) / makeXlsx(title,
 * rows) via the gateway (python-docx/openpyxl) → no native dep in-app. For invoices, reports,
 * exports, contracts as editable Office files. env: DOCGEN_URL (or shared SCRAPER_URL).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const DOCGEN = `const gateway = () => (process.env.DOCGEN_URL || process.env.SCRAPER_URL || "http://localhost:8200").replace(/\\/$/, "")
async function gen(body: unknown): Promise<Buffer | null> {
  try { const r = await fetch(gateway() + "/docgen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json()); return r.data_b64 ? Buffer.from(r.data_b64, "base64") : null }
  catch (e) { console.error("[docgen]", (e as Error).message); return null }
}
/** Word document from a title + paragraphs → .docx bytes. */
export async function makeDocx(title: string, paragraphs: string[]): Promise<Buffer | null> { return gen({ kind: "docx", title, paragraphs }) }
/** Excel sheet from rows (array of arrays) → .xlsx bytes. */
export async function makeXlsx(title: string, rows: (string | number)[][]): Promise<Buffer | null> { return gen({ kind: "xlsx", title, rows }) }
`

export function deterministicDocgen(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /docx|word|excel|xlsx|spreadsheet|planilla|hoja de c[aá]lculo|export.*(doc|excel)|generar.*(documento|reporte)|office|powerpoint|pptx|contrato editable|plantilla/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/docgen.ts", content: DOCGEN }] }
}
