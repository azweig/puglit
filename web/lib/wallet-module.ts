/**
 * wallet-module.ts — in-app credits / points ledger (append-only, auditable), Postgres-native.
 * credit/debit(userId, amount, reason); balance = sum of the ledger (never a mutable field, so it
 * can't drift). Perfect for AI products that sell credits/usage, loyalty points, in-app currency.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const WALLET = `import { pool } from "@/lib/db"
/** Add credits (reason e.g. "purchase", "signup-bonus", "refund"). */
export async function credit(userId: string, amount: number, reason = "") {
  await pool().query("INSERT INTO wallet_ledger (user_id, amount, reason) VALUES ($1,$2,$3)", [userId, Math.abs(amount), reason])
}
/** Spend credits — throws if the balance would go negative (atomic check). */
export async function debit(userId: string, amount: number, reason = ""): Promise<boolean> {
  const client = await pool().connect()
  try {
    await client.query("BEGIN")
    const { rows } = await client.query("SELECT COALESCE(SUM(amount),0) AS bal FROM wallet_ledger WHERE user_id=$1 FOR UPDATE", [userId])
    if (Number(rows[0].bal) < amount) { await client.query("ROLLBACK"); return false }
    await client.query("INSERT INTO wallet_ledger (user_id, amount, reason) VALUES ($1,$2,$3)", [userId, -Math.abs(amount), reason])
    await client.query("COMMIT")
    return true
  } catch (e) { await client.query("ROLLBACK"); throw e } finally { client.release() }
}
export async function balance(userId: string): Promise<number> {
  const { rows } = await pool().query("SELECT COALESCE(SUM(amount),0) AS bal FROM wallet_ledger WHERE user_id=$1", [userId])
  return Number(rows[0].bal)
}
export async function history(userId: string, limit = 50) {
  return (await pool().query("SELECT amount, reason, created_at FROM wallet_ledger WHERE user_id=$1 ORDER BY id DESC LIMIT $2", [userId, limit])).rows
}
`
const SQL = `CREATE TABLE IF NOT EXISTS wallet_ledger (
  id BIGSERIAL PRIMARY KEY, user_id TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL, reason TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_ledger(user_id);`

export function deterministicWallet(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")} ${config.monetization || ""}`.toLowerCase()
  const wants = /credit|cr[eé]dito|wallet|billetera|points|puntos|token|saldo|balance|coin|moneda|loyalty|lealtad|usage.*pay|pay.?per|prepaid|recarga/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/wallet.ts", content: WALLET }], extraSql: SQL }
}
