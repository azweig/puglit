/**
 * observability-module.ts — APM connector (New Relic/Datadog alternative). Ships custom traces &
 * metrics to a self-hosted SigNoz / OpenTelemetry collector over OTLP-HTTP. trace(name, ms, attrs)
 * + metric(name, value). env: OTEL_URL (collector), OTEL_SERVICE. OSS: SigNoz · OTel+Grafana · Uptrace.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const OBS = `const base = () => (process.env.OTEL_URL || "http://localhost:4318").replace(/\\/$/, "")
const svc = () => process.env.OTEL_SERVICE || "app"
const nano = () => String(Date.now() * 1e6)
/** Record a span (a timed operation) → SigNoz/OTel. Wrap any handler: const t=Date.now(); …; trace("checkout", Date.now()-t). */
export async function trace(name: string, durationMs: number, attrs: Record<string, string> = {}) {
  const end = Date.now(), start = end - durationMs
  const body = { resourceSpans: [{ resource: { attributes: [{ key: "service.name", value: { stringValue: svc() } }] }, scopeSpans: [{ spans: [{ name, startTimeUnixNano: String(start * 1e6), endTimeUnixNano: String(end * 1e6), attributes: Object.entries(attrs).map(([k, v]) => ({ key: k, value: { stringValue: String(v) } })) }] }] }] }
  fetch(\`\${base()}/v1/traces\`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {})
}
/** Record a gauge/counter metric. */
export async function metric(name: string, value: number, attrs: Record<string, string> = {}) {
  const body = { resourceMetrics: [{ resource: { attributes: [{ key: "service.name", value: { stringValue: svc() } }] }, scopeMetrics: [{ metrics: [{ name, gauge: { dataPoints: [{ asDouble: value, timeUnixNano: nano(), attributes: Object.entries(attrs).map(([k, v]) => ({ key: k, value: { stringValue: String(v) } })) }] } }] }] }] }
  fetch(\`\${base()}/v1/metrics\`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {})
}
`
export function deterministicObservability(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/observab|apm|new relic|datadog|tracing|trace|telemetr|opentelemetry|otel|signoz|monitor.*performance|latenc|metrics.*app|prometheus/.test(hay)) return null
  return { files: [{ path: "lib/observability.ts", content: OBS }] }
}
