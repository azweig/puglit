/**
 * wms-module.ts — Warehouse Management connector. Thin client to a self-hosted OpenBoxes (or any
 * WMS exposing REST): stock by location, receive, pick, transfer. env: WMS_URL, WMS_TOKEN.
 * OSS: OpenBoxes · Odoo Inventory · Grocy (lite). (Pairs with the inventory module for light cases.)
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const WMS = `const base = () => (process.env.WMS_URL || "http://localhost:8089").replace(/\\/$/, "")
const h = () => ({ Authorization: "Bearer " + (process.env.WMS_TOKEN || ""), "Content-Type": "application/json" })
/** Stock on hand for a product across locations. */
export async function stock(sku: string) {
  return fetch(\`\${base()}/api/products/\${sku}/availability\`, { headers: h() }).then((r) => r.json()).catch((e) => { console.error("[wms]", e); return null })
}
/** Record a stock movement (receive/pick/transfer). */
export async function movement(type: "receive" | "pick" | "transfer", sku: string, qty: number, location?: string) {
  return fetch(\`\${base()}/api/stockMovements\`, { method: "POST", headers: h(), body: JSON.stringify({ type, sku, quantity: qty, location }) }).then((r) => r.json()).catch(() => null)
}
`
export function deterministicWms(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/\bwms\b|warehouse|almac[eé]n|picking|dep[oó]sito|stock.*ubicaci|fulfillment|log[ií]stica.*almac|openboxes|inventory.*warehouse/.test(hay)) return null
  return { files: [{ path: "lib/wms.ts", content: WMS }] }
}
