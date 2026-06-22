/**
 * statuspage-module.ts — public/internal status page, Postgres-native + a ready /status page.
 * Components with health + incidents with updates (investigating→identified→resolved). Pairs with
 * the uptime module (component health from monitors). OSS full UI: Cachet · Statping-ng.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const SP = `import { pool } from "@/lib/db"
export async function setComponent(name: string, status: "operational" | "degraded" | "down") {
  await pool.query("INSERT INTO status_components (name, status) VALUES ($1,$2) ON CONFLICT (name) DO UPDATE SET status=$2, updated_at=NOW()", [name, status])
}
export async function openIncident(title: string, body: string, impact = "minor") {
  const { rows } = await pool.query("INSERT INTO status_incidents (title, impact, state) VALUES ($1,$2,'investigating') RETURNING id", [title, impact])
  await pool.query("INSERT INTO status_incident_updates (incident_id, state, body) VALUES ($1,'investigating',$2)", [rows[0].id, body])
  return rows[0].id
}
export async function updateIncident(id: number, state: "identified" | "monitoring" | "resolved", body: string) {
  await pool.query("UPDATE status_incidents SET state=$2, updated_at=NOW() WHERE id=$1", [id, state])
  await pool.query("INSERT INTO status_incident_updates (incident_id, state, body) VALUES ($1,$2,$3)", [id, state, body])
}
export async function statusSnapshot() {
  const components = (await pool.query("SELECT name, status FROM status_components ORDER BY name")).rows
  const incidents = (await pool.query("SELECT id, title, impact, state, updated_at FROM status_incidents WHERE state<>'resolved' ORDER BY id DESC")).rows
  const allUp = components.every((c: any) => c.status === "operational")
  return { overall: incidents.length ? "incident" : allUp ? "operational" : "degraded", components, incidents }
}
`
const PAGE = `import { statusSnapshot } from "@/lib/statuspage"
export const dynamic = "force-dynamic"
export default async function StatusPage() {
  const s = await statusSnapshot()
  const color = s.overall === "operational" ? "#16a34a" : s.overall === "incident" ? "#dc2626" : "#e8820c"
  return (<main style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui", padding: 20 }}>
    <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 14, height: 14, borderRadius: 99, background: color }} /> Estado del sistema</h1>
    <ul style={{ listStyle: "none", padding: 0 }}>{s.components.map((c: any) => (<li key={c.name} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}><span>{c.name}</span><b style={{ color: c.status === "operational" ? "#16a34a" : "#e8820c" }}>{c.status}</b></li>))}</ul>
    {s.incidents.length > 0 && (<section><h2>Incidentes</h2>{s.incidents.map((i: any) => (<div key={i.id} style={{ padding: 12, background: "#fff7f0", borderRadius: 8, margin: "8px 0" }}><b>{i.title}</b> — {i.state}</div>))}</section>)}
  </main>)
}
`
const SQL = `CREATE TABLE IF NOT EXISTS status_components (name VARCHAR(64) PRIMARY KEY, status VARCHAR(16) DEFAULT 'operational', updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS status_incidents (id BIGSERIAL PRIMARY KEY, title TEXT, impact VARCHAR(12), state VARCHAR(16), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS status_incident_updates (id BIGSERIAL PRIMARY KEY, incident_id BIGINT, state VARCHAR(16), body TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`
export function deterministicStatusPage(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/status page|p[aá]gina de estado|incident|incidente|status del|cachet|service status|estado.*servic|degraded|outage|sla/.test(hay)) return null
  return { files: [{ path: "lib/statuspage.ts", content: SP }, { path: "app/status/page.tsx", content: PAGE }], extraSql: SQL }
}
