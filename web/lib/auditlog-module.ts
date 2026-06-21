/**
 * auditlog-module.ts — tamper-aware audit trail (who did what, when), Postgres-native zero-dep.
 * audit(actor, action, target, meta) records every sensitive operation; each row is hash-chained
 * to the previous one so deletions/edits are detectable. Compliance (SOC2/GDPR), debugging, trust.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const AUDIT = `import { pool } from "@/lib/db"
import { createHash } from "node:crypto"
/** Record an audited action. Hash-chained: prev_hash → this row → tamper-evident. */
export async function audit(actor: string, action: string, target = "", meta: Record<string, unknown> = {}) {
  const prev = await pool().query("SELECT hash FROM audit_log ORDER BY id DESC LIMIT 1")
  const prevHash = prev.rows[0]?.hash || ""
  const payload = JSON.stringify({ actor, action, target, meta })
  const hash = createHash("sha256").update(prevHash + payload).digest("hex")
  await pool().query("INSERT INTO audit_log (actor, action, target, meta, prev_hash, hash) VALUES ($1,$2,$3,$4,$5,$6)", [actor, action, target, JSON.stringify(meta), prevHash, hash])
}
export async function auditTrail(target?: string, limit = 100) {
  const { rows } = target
    ? await pool().query("SELECT actor, action, target, meta, created_at FROM audit_log WHERE target=$1 ORDER BY id DESC LIMIT $2", [target, limit])
    : await pool().query("SELECT actor, action, target, meta, created_at FROM audit_log ORDER BY id DESC LIMIT $1", [limit])
  return rows
}
`
const SQL = `CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT, action VARCHAR(64) NOT NULL, target TEXT,
  meta JSONB DEFAULT '{}', prev_hash TEXT, hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`

export function deterministicAuditLog(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /audit|auditor|compliance|cumplimiento|soc2|gdpr|hipaa|trail|registro de actividad|activity log|fintech|banking|legal|admin/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/auditlog.ts", content: AUDIT }], extraSql: SQL }
}
