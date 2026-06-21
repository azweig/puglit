/**
 * pdf-module.ts — HTML → PDF (invoices, reports, contracts, tickets, certificates). Thin client
 * to the gateway's /pdf endpoint (reuses the Scrapling/Playwright chromium already running — no
 * chromium in-app). render(html) → PDF bytes. env: SCRAPER_URL (the shared gateway).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const PDF = `const gateway = () => (process.env.PDF_URL || process.env.SCRAPER_URL || "http://localhost:8200").replace(/\\/$/, "")
/** Render an HTML string to PDF bytes. Build the HTML however you like (template literals). */
export async function renderPdf(html: string, opts?: { landscape?: boolean; format?: string }): Promise<Buffer | null> {
  try {
    const r = await fetch(gateway() + "/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html, landscape: opts?.landscape || false, format: opts?.format || "A4" }) })
    if (!r.ok) return null
    return Buffer.from(await r.arrayBuffer())
  } catch (e) { console.error("[pdf]", (e as Error).message); return null }
}
`

// A route that streams a PDF (POST { html } → application/pdf).
const PDF_ROUTE = `import { NextRequest, NextResponse } from "next/server"
import { renderPdf } from "@/lib/pdf"
export async function POST(req: NextRequest) {
  const { html } = await req.json().catch(() => ({}))
  const pdf = await renderPdf(String(html || "<h1>Empty</h1>"))
  if (!pdf) return NextResponse.json({ error: "pdf failed" }, { status: 500 })
  return new NextResponse(pdf as any, { headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=document.pdf" } })
}
`

export function deterministicPdf(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")} ${config.monetization || ""}`.toLowerCase()
  const wants = /pdf|factura|invoice|recibo|receipt|report|reporte|contrato|contract|ticket|certificad|certificate|boleta|comprobante|export|presupuesto|quote|cv\b|curriculum/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/pdf.ts", content: PDF }, { path: "app/api/pdf/route.ts", content: PDF_ROUTE }] }
}
