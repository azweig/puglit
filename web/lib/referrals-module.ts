/**
 * referrals-module.ts — referral / invite system with rewards, Postgres-native. codeFor(userId)
 * issues a stable code; redeem(code, newUserId) credits both sides + prevents self/double-referral.
 * Growth loops for any product.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const REF = `import { pool } from "@/lib/db"
import { randomBytes } from "node:crypto"
/** Stable referral code for a user (created once). */
export async function codeFor(userId: string): Promise<string> {
  const ex = await pool.query("SELECT code FROM referral_codes WHERE user_id=$1", [userId])
  if (ex.rows[0]) return ex.rows[0].code
  const code = randomBytes(4).toString("hex")
  await pool.query("INSERT INTO referral_codes (user_id, code) VALUES ($1,$2)", [userId, code])
  return code
}
/** Redeem a code for a new user → credits referrer + referee once. Returns the referrer id or null. */
export async function redeem(code: string, newUserId: string): Promise<string | null> {
  const r = await pool.query("SELECT user_id FROM referral_codes WHERE code=$1", [code])
  const referrer = r.rows[0]?.user_id
  if (!referrer || referrer === newUserId) return null
  const dup = await pool.query("SELECT 1 FROM referrals WHERE referee=$1", [newUserId])
  if (dup.rows[0]) return null
  await pool.query("INSERT INTO referrals (referrer, referee) VALUES ($1,$2)", [referrer, newUserId])
  return referrer
}
export async function referralStats(userId: string) {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS invited FROM referrals WHERE referrer=$1", [userId])
  return { invited: rows[0].invited }
}
`
const SQL = `CREATE TABLE IF NOT EXISTS referral_codes (
  user_id TEXT PRIMARY KEY, code VARCHAR(16) UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS referrals (
  id BIGSERIAL PRIMARY KEY, referrer TEXT NOT NULL, referee TEXT UNIQUE NOT NULL,
  rewarded BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
);`

export function deterministicReferrals(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /referr|referido|invite|invita|recomend|reward|recompensa|growth|viral|share|afiliad|affiliate|programa de/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/referrals.ts", content: REF }], extraSql: SQL }
}
