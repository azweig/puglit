/**
 * errortracking-module.ts — self-hosted error tracking (Sentry-style), Postgres-native. captureError
 * stores the error + context + a fingerprint (groups duplicates with a count); withErrorTracking()
 * wraps a route handler. Optional forward to a Sentry DSN / webhook. Observability the spine's
 * analytics doesn't cover. Zero-dep.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const ERR = `import { pool } from "@/lib/db"
import { createHash } from "node:crypto"
/** Record an error (grouped by fingerprint; increments count on repeats). */
export async function captureError(err: unknown, context: Record<string, unknown> = {}) {
  const e = err as Error
  const msg = e?.message || String(err)
  const fp = createHash("md5").update((e?.stack || msg).split("\\n").slice(0, 3).join("")).digest("hex").slice(0, 16)
  try {
    await pool.query(
      "INSERT INTO errors (fingerprint, message, stack, context, count) VALUES ($1,$2,$3,$4,1) ON CONFLICT (fingerprint) DO UPDATE SET count=errors.count+1, last_seen=NOW(), message=$2",
      [fp, msg.slice(0, 500), (e?.stack || "").slice(0, 4000), JSON.stringify(context)])
  } catch {}
  if (process.env.ERROR_WEBHOOK) fetch(process.env.ERROR_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, fingerprint: fp, context }) }).catch(() => {})
}
/** Wrap a Next route handler so any throw is captured + returns a clean 500. */
export function withErrorTracking<T extends (...a: any[]) => Promise<Response>>(handler: T): T {
  return (async (...args: any[]) => {
    try { return await handler(...args) }
    catch (err) { await captureError(err, { route: true }); return new Response(JSON.stringify({ error: "internal error" }), { status: 500, headers: { "Content-Type": "application/json" } }) }
  }) as T
}
`
const SQL = `CREATE TABLE IF NOT EXISTS errors (
  id BIGSERIAL PRIMARY KEY, fingerprint VARCHAR(32) UNIQUE NOT NULL,
  message TEXT, stack TEXT, context JSONB DEFAULT '{}', count INT DEFAULT 1,
  resolved BOOLEAN DEFAULT FALSE, first_seen TIMESTAMPTZ DEFAULT NOW(), last_seen TIMESTAMPTZ DEFAULT NOW()
);`

export function deterministicErrorTracking(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /error|sentry|observab|monitor|tracking|crash|exception|logging|reliab|debug|production|saas|admin/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/errortracking.ts", content: ERR }], extraSql: SQL }
}
