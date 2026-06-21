/**
 * logs-module.ts — centralized log shipping connector. Posts structured logs to a self-hosted
 * OpenObserve / Loki. log(level, msg, meta) → searchable, retained. env: LOGS_URL, LOGS_KEY,
 * LOGS_STREAM. OSS: OpenObserve · Loki · Vector.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const LOGS = `const base = () => (process.env.LOGS_URL || "http://localhost:5080").replace(/\\/$/, "")
const stream = () => process.env.LOGS_STREAM || "default"
/** Ship one structured log line (fire-and-forget). */
export function log(level: "info" | "warn" | "error", message: string, meta: Record<string, unknown> = {}) {
  const body = [{ level, message, ...meta, _timestamp: Date.now() }]
  fetch(\`\${base()}/api/default/\${stream()}/_json\`, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.LOGS_KEY ? { Authorization: "Basic " + process.env.LOGS_KEY } : {}) }, body: JSON.stringify(body) }).catch(() => {})
}
`
export function deterministicLogs(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/log aggregat|logs centraliz|log.*search|structured log|loki|openobserve|elastic|kibana|centraliz.*log|audit.*log.*search/.test(hay)) return null
  return { files: [{ path: "lib/logs.ts", content: LOGS }] }
}
