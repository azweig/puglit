/**
 * bi-module.ts — BI / dashboards connector. Embeds Metabase dashboards in your app via signed JWT
 * (no data leaves your infra) + runs saved questions via the API. env: METABASE_URL,
 * METABASE_SECRET (embedding), METABASE_KEY (api). OSS: Metabase · Superset · Redash.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const BI = `import { createHmac } from "node:crypto"
function b64url(o: object) { return Buffer.from(JSON.stringify(o)).toString("base64url") }
/** Signed embed URL for a Metabase dashboard (no creds exposed to the browser). */
export function embedDashboardUrl(dashboardId: number, params: Record<string, unknown> = {}): string {
  const secret = process.env.METABASE_SECRET || ""
  const header = b64url({ alg: "HS256", typ: "JWT" })
  const payload = b64url({ resource: { dashboard: dashboardId }, params, exp: Math.floor(Date.now() / 1000) + 600 })
  const sig = createHmac("sha256", secret).update(header + "." + payload).digest("base64url")
  const token = header + "." + payload + "." + sig
  return (process.env.METABASE_URL || "").replace(/\\/$/, "") + "/embed/dashboard/" + token + "#bordered=true&titled=true"
}
/** Run a saved question and get rows (server-side, via the API). */
export async function runQuestion(cardId: number) {
  return fetch((process.env.METABASE_URL || "").replace(/\\/$/, "") + "/api/card/" + cardId + "/query/json", { method: "POST", headers: { "X-API-KEY": process.env.METABASE_KEY || "" } }).then((r) => r.json()).catch(() => null)
}
`
export function deterministicBi(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/\bbi\b|business intelligence|dashboard.*analyt|metabase|superset|redash|reportes.*ejecutiv|self.?serve.*analyt|data.*dashboard|kpi.*board|insights.*data/.test(hay)) return null
  return { files: [{ path: "lib/bi.ts", content: BI }] }
}
