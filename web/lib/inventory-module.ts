/**
 * inventory-module.ts — lightweight stock tracking, Postgres-native (no external WMS needed).
 * adjust/reserve/release stock with an append-only ledger so the on-hand can't drift. For shops,
 * rentals, simple fulfillment. Graduate to the wms module when you need locations/picking.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const INV = `import { pool } from "@/lib/db"
/** On-hand = received - sold - reserved (sum of the ledger). */
export async function onHand(sku: string): Promise<number> {
  const { rows } = await pool.query("SELECT COALESCE(SUM(delta),0) AS q FROM stock_ledger WHERE sku=$1", [sku])
  return Number(rows[0].q)
}
/** Adjust stock (+receive / -sale). reason for the audit trail. */
export async function adjust(sku: string, delta: number, reason = "") {
  await pool.query("INSERT INTO stock_ledger (sku, delta, reason) VALUES ($1,$2,$3)", [sku, delta, reason])
}
/** Reserve units atomically — fails if not enough on hand (prevents overselling). */
export async function reserve(sku: string, qty: number): Promise<boolean> {
  const c = await pool.connect()
  try {
    await c.query("BEGIN")
    const { rows } = await c.query("SELECT COALESCE(SUM(delta),0) AS q FROM stock_ledger WHERE sku=$1 FOR UPDATE", [sku])
    if (Number(rows[0].q) < qty) { await c.query("ROLLBACK"); return false }
    await c.query("INSERT INTO stock_ledger (sku, delta, reason) VALUES ($1,$2,'reserve')", [sku, -Math.abs(qty)])
    await c.query("COMMIT"); return true
  } catch (e) { await c.query("ROLLBACK"); throw e } finally { c.release() }
}
`
const SQL = `CREATE TABLE IF NOT EXISTS stock_ledger (
  id BIGSERIAL PRIMARY KEY, sku VARCHAR(64) NOT NULL, delta DOUBLE PRECISION NOT NULL,
  reason TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_sku ON stock_ledger(sku);`
export function deterministicInventory(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/inventor|stock|existenc|disponib.*producto|sku|on.?hand|oversell|reserva.*stock|almac[eé]n.*simple|units|unidades/.test(hay)) return null
  return { files: [{ path: "lib/inventory.ts", content: INV }], extraSql: SQL }
}
