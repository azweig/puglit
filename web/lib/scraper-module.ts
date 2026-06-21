/**
 * scraper-module.ts — web scraping, gateway-backed. The heavy stealth browser (Scrapling +
 * Playwright/Chromium) + LLM extractor (ScrapeGraph-ai) run in a SEPARATE Docker service; the
 * generated app is just a thin HTTP client → no chromium bloat in-app.
 *
 *  - scrape(url, {stealth, cookies}) → bypasses anti-bot (Cloudflare) + JS rendering.
 *  - extract(url, prompt)           → LLM pulls structured data ("get the title, price, author").
 *
 * ⚠️ For LinkedIn / paywalled sites: pass YOUR session cookie (cookies). This is gray-area —
 * respects no official API, risks account/IP bans (rate-limit, rotate proxies, persist tokens),
 * exactly as the OSS research warns. Use for your own data / authorized scraping only.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const SCRAPER = `const base = () => (process.env.SCRAPER_URL || "http://localhost:8200").replace(/\\/$/, "")
const headers = () => ({ "Content-Type": "application/json", ...(process.env.SCRAPER_KEY ? { Authorization: "Bearer " + process.env.SCRAPER_KEY } : {}) })

/** Fetch a page. stealth=true bypasses anti-bot (Cloudflare) + renders JS. cookies for
 *  authenticated / paywalled pages (e.g. your LinkedIn li_at session cookie). */
export async function scrape(url: string, opts?: { stealth?: boolean; cookies?: string }): Promise<{ status: number; html: string; text: string } | null> {
  try { return await fetch(base() + "/fetch", { method: "POST", headers: headers(), body: JSON.stringify({ url, stealth: opts?.stealth ?? true, cookies: opts?.cookies }) }).then((r) => r.json()) }
  catch (e) { console.error("[scraper] fetch", (e as Error).message); return null }
}

/** LLM extraction — describe what you want and get structured data back. */
export async function extract(url: string, prompt: string, opts?: { cookies?: string }): Promise<any> {
  try { return await fetch(base() + "/extract", { method: "POST", headers: headers(), body: JSON.stringify({ url, prompt, cookies: opts?.cookies }) }).then((r) => r.json()) }
  catch (e) { console.error("[scraper] extract", (e as Error).message); return null }
}
`

/** Inject the scraper client when the product scrapes / monitors / extracts web data. */
export function deterministicScraper(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /scrap|crawl|extrae|extract|web data|monitor|seguimiento|rastre|linkedin|paywall|harvest|osint|competidor|competitor|precios?\b|prices?\b|raspad/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/scraper.ts", content: SCRAPER }] }
}
