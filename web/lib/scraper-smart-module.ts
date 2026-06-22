/**
 * scraper-smart-module.ts — reusable SMART-SCRAPING building block for generated apps (the
 * ScrapeGraphAI capability). Injects lib/scrape.ts (structured extraction from any URL) + a POST
 * /api/scrape route + a scraped_records table — for products that pull info / leads / clients /
 * competitor data from the web. Works against the self-hosted sidecar (SCRAPE_URL → local Ollama,
 * free) OR the ScrapeGraphAI cloud (SCRAPEGRAPH_API_KEY). For HIGH-FREQUENCY production ingestion
 * prefer deterministic selectors/APIs — this is for variable/hard pages + one-off extraction.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const SCRAPE = `// lib/scrape.ts — structured web extraction (Puglit smart-scraper).
// Backends (first configured wins): SCRAPE_URL = self-hosted ScrapeGraphAI sidecar on local Ollama
// (free); SCRAPEGRAPH_API_KEY = ScrapeGraphAI cloud. Returns the JSON shape your prompt asks for.
export type Extracted = Record<string, unknown>

export async function extract(url: string, prompt: string): Promise<Extracted> {
  const sidecar = (process.env.SCRAPE_URL || "").replace(/\\/$/, "")
  if (sidecar) {
    const r = await fetch(sidecar + "/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, prompt }) }).then((x) => x.json())
    if (r?.error && !r?.result) throw new Error("scrape failed: " + r.error)
    return (r?.result ?? {}) as Extracted
  }
  const key = process.env.SCRAPEGRAPH_API_KEY
  if (key) {
    const r = await fetch("https://api.scrapegraphai.com/v1/smartscraper", { method: "POST", headers: { "Content-Type": "application/json", "SGAI-APIKEY": key }, body: JSON.stringify({ website_url: url, user_prompt: prompt }) }).then((x) => x.json())
    return (r?.result ?? r ?? {}) as Extracted
  }
  throw new Error("no scraper configured (set SCRAPE_URL or SCRAPEGRAPH_API_KEY)")
}

/** Extract + persist as a scraped_record (handy for leads/clients/catalog ingestion). */
export async function extractAndStore(url: string, prompt: string, kind = "record"): Promise<Extracted> {
  const { pool } = await import("@/lib/db")
  const data = await extract(url, prompt)
  await pool.query("INSERT INTO scraped_records (kind, source_url, data) VALUES ($1,$2,$3)", [kind, url, JSON.stringify(data)])
  return data
}
`

const ROUTE = `import { NextRequest, NextResponse } from "next/server"
import { extract } from "@/lib/scrape"
/** POST { url, prompt } → structured extraction. Validates input; never leaks raw errors. */
export async function POST(request: NextRequest) {
  try {
    const b = await request.json()
    const url = String(b?.url || "")
    const prompt = String(b?.prompt || "Extract the main structured content of this page.")
    if (!/^https?:\\/\\//.test(url)) return NextResponse.json({ error: "valid url required" }, { status: 400 })
    const result = await extract(url, prompt)
    return NextResponse.json({ result })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || "scrape failed").slice(0, 200) }, { status: 502 })
  }
}
`

const SQL = `CREATE TABLE IF NOT EXISTS scraped_records (
  id BIGSERIAL PRIMARY KEY, kind VARCHAR(48) NOT NULL DEFAULT 'record',
  source_url TEXT NOT NULL, data JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scraped_records_kind ON scraped_records(kind, created_at DESC);`

export function deterministicSmartScraper(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /scrap|extract.*(web|url|page|site|sitio|p[aá]gina)|lead|prospect|cliente potencial|crawl|competitor|competenc|monitor.*(price|precio)|directorio|web data|scraping|enriquec|harvest.*data/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/scrape.ts", content: SCRAPE }, { path: "app/api/scrape/route.ts", content: ROUTE }], extraSql: SQL }
}
