/**
 * uptime-module.ts — uptime / API health monitoring, Postgres-native. Register endpoints, a cron
 * pings them, records up/down + latency, computes uptime %. checkAll() from a cron. For a full UI,
 * deploy Uptime Kuma alongside; this is the embedded version that lives in YOUR app.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const UP = `import { pool } from "@/lib/db"
export async function addMonitor(name: string, url: string) {
  await pool().query("INSERT INTO monitors (name, url) VALUES ($1,$2) ON CONFLICT (url) DO NOTHING", [name, url])
}
/** Ping every monitor once, record the result. Call from a cron (e.g. every minute). */
export async function checkAll() {
  const { rows } = await pool().query("SELECT id, url FROM monitors WHERE active=true")
  for (const m of rows) {
    const t = Date.now(); let up = false, code = 0
    try { const r = await fetch(m.url, { method: "GET", signal: AbortSignal.timeout(8000) }); code = r.status; up = r.status < 500 } catch {}
    await pool().query("INSERT INTO monitor_checks (monitor_id, up, status_code, latency_ms) VALUES ($1,$2,$3,$4)", [m.id, up, code, Date.now() - t])
  }
}
/** Uptime % for a monitor over the last N hours. */
export async function uptimePct(monitorId: number, hours = 24): Promise<number> {
  const { rows } = await pool().query("SELECT AVG(CASE WHEN up THEN 1 ELSE 0 END)*100 AS pct FROM monitor_checks WHERE monitor_id=$1 AND created_at > NOW() - ($2 || ' hours')::interval", [monitorId, String(hours)])
  return Math.round(Number(rows[0]?.pct || 0))
}
`
const SQL = `CREATE TABLE IF NOT EXISTS monitors (
  id BIGSERIAL PRIMARY KEY, name TEXT, url TEXT UNIQUE NOT NULL, active BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS monitor_checks (
  id BIGSERIAL PRIMARY KEY, monitor_id BIGINT REFERENCES monitors(id), up BOOLEAN, status_code INT,
  latency_ms INT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checks ON monitor_checks(monitor_id, created_at DESC);`
export function deterministicUptime(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/uptime|monitor.*(api|endpoint|servic|web)|healthcheck|health check|ping|disponib.*servic|sla.*monitor|downtime|uptime kuma|status.*api/.test(hay)) return null
  return { files: [{ path: "lib/uptime.ts", content: UP }], extraSql: SQL }
}
