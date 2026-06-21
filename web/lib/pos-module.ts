/**
 * pos-module.ts — point-of-sale: record sales at a register, Postgres-native. ringSale(items) writes
 * a sale + line items + (if the inventory module is present) decrements stock; dailyZ() closes the
 * register. For shops/restaurants/kiosks. OSS full UIs: UniCenta · Floreant (deploy alongside).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const POS = `import { pool } from "@/lib/db"
type Item = { sku: string; name: string; qty: number; price: number }
/** Ring up a sale → returns the sale id + total. Decrements inventory if that module is wired. */
export async function ringSale(register: string, items: Item[], paid: number, method = "cash") {
  const total = items.reduce((s, i) => s + i.qty * i.price, 0)
  const { rows } = await pool().query("INSERT INTO pos_sales (register, total, paid, method, items) VALUES ($1,$2,$3,$4,$5) RETURNING id", [register, total, paid, method, JSON.stringify(items)])
  try { const { adjust } = await import("@/lib/inventory"); for (const i of items) await adjust(i.sku, -Math.abs(i.qty), "pos-sale") } catch {}
  return { id: rows[0].id, total, change: Math.max(0, paid - total) }
}
/** Daily close (Z report) for a register. */
export async function dailyZ(register: string, date: string) {
  const { rows } = await pool().query("SELECT COUNT(*)::int AS n, COALESCE(SUM(total),0) AS gross FROM pos_sales WHERE register=$1 AND created_at::date=$2", [register, date])
  return rows[0]
}
`
const SQL = `CREATE TABLE IF NOT EXISTS pos_sales (
  id BIGSERIAL PRIMARY KEY, register VARCHAR(32), total DOUBLE PRECISION, paid DOUBLE PRECISION,
  method VARCHAR(16), items JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
);`
export function deterministicPos(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/\bpos\b|point of sale|punto de venta|caja|register|cashier|cajero|restaurant|kiosk|kiosko|venta.*mostrador|ticket.*venta/.test(hay)) return null
  return { files: [{ path: "lib/pos.ts", content: POS }], extraSql: SQL }
}
