/**
 * queue-module.ts — durable background jobs on Postgres, zero-dep. The SAFE fire-and-forget:
 * enqueue() writes a row, a worker leases jobs FOR UPDATE SKIP LOCKED, runs them with retries
 * and backoff. No parallel in-process loops (that's what took TodoAstros down) — one row at a
 * time, survives restarts. enqueue(type, payload) + registerWorker(type, handler) + runWorker().
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const QUEUE = `import { pool } from "@/lib/db"
type Handler = (payload: any) => Promise<void>
const handlers: Record<string, Handler> = {}

/** Enqueue a job. It runs later in the worker — never blocks the request. */
export async function enqueue(type: string, payload: unknown, opts?: { runAt?: Date; maxAttempts?: number }) {
  await pool().query("INSERT INTO jobs (type, payload, run_at, max_attempts) VALUES ($1,$2,$3,$4)", [type, JSON.stringify(payload ?? {}), opts?.runAt || new Date(), opts?.maxAttempts ?? 5])
}
export function registerWorker(type: string, handler: Handler) { handlers[type] = handler }

/** Lease + run one batch of due jobs. Call from a cron, or runWorker() loops it. */
export async function tick(batch = 5): Promise<number> {
  const { rows } = await pool().query("UPDATE jobs SET status='running', attempts=attempts+1, leased_at=NOW() WHERE id IN (SELECT id FROM jobs WHERE status IN ('queued','retry') AND run_at <= NOW() ORDER BY run_at FOR UPDATE SKIP LOCKED LIMIT $1) RETURNING id, type, payload, attempts, max_attempts", [batch])
  for (const j of rows) {
    const h = handlers[j.type]
    try {
      if (!h) throw new Error("no handler for " + j.type)
      await h(j.payload)
      await pool().query("UPDATE jobs SET status='done', done_at=NOW() WHERE id=$1", [j.id])
    } catch (e) {
      const dead = j.attempts >= j.max_attempts
      const backoff = Math.min(3600, 2 ** j.attempts) // seconds
      await pool().query("UPDATE jobs SET status=$2, last_error=$3, run_at=NOW() + ($4 || ' seconds')::interval WHERE id=$1", [j.id, dead ? "failed" : "retry", String((e as Error).message).slice(0, 500), backoff])
    }
  }
  return rows.length
}
/** Long-running worker loop (or just schedule tick() from your cron). */
export async function runWorker(intervalMs = 2000) {
  const loop = async () => { try { await tick() } catch (e) { console.error("[queue]", (e as Error).message) } setTimeout(loop, intervalMs) }
  loop()
}
`

const QUEUE_SQL = `CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(12) NOT NULL DEFAULT 'queued',  -- queued | running | retry | done | failed
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  leased_at TIMESTAMPTZ,
  done_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jobs_due ON jobs(status, run_at);`

export function queueFiles(): { files: AppFile[]; extraSql: string } { return { files: [{ path: "lib/queue.ts", content: QUEUE }], extraSql: QUEUE_SQL } }
export function deterministicQueue(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /queue|cola|job|background|tarea|async|worker|procesa|batch|cron|programad|schedule|notif|email|envio|reminder|recordatorio/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/queue.ts", content: QUEUE }], extraSql: QUEUE_SQL }
}
