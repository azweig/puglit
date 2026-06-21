/**
 * projectmgmt-module.ts — project management connector (boards/issues/sprints). Thin client to a
 * self-hosted Plane. Create + list issues, move state. env: PLANE_URL, PLANE_TOKEN, PLANE_WORKSPACE,
 * PLANE_PROJECT. OSS: Plane · Focalboard · Vikunja.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const PM = `const base = () => (process.env.PLANE_URL || "http://localhost:8092").replace(/\\/$/, "")
const ws = () => process.env.PLANE_WORKSPACE || "", pr = () => process.env.PLANE_PROJECT || ""
const h = () => ({ "X-API-Key": process.env.PLANE_TOKEN || "", "Content-Type": "application/json" })
const root = () => \`\${base()}/api/v1/workspaces/\${ws()}/projects/\${pr()}/issues/\`
export async function createIssue(name: string, description = "", priority = "medium") {
  return fetch(root(), { method: "POST", headers: h(), body: JSON.stringify({ name, description_html: "<p>" + description + "</p>", priority }) }).then((r) => r.json()).catch((e) => { console.error("[pm]", e); return null })
}
export async function listIssues() { return fetch(root(), { headers: h() }).then((r) => r.json()).catch(() => null) }
export async function updateIssue(id: string, data: Record<string, unknown>) {
  return fetch(root() + id + "/", { method: "PATCH", headers: h(), body: JSON.stringify(data) }).then((r) => r.json()).catch(() => null)
}
`
export function deterministicProjectMgmt(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/project management|gesti[oó]n de proyecto|kanban|board|tablero|sprint|backlog|issue.*track|tarea.*proyecto|jira|trello|asana|plane|scrum/.test(hay)) return null
  return { files: [{ path: "lib/projectmgmt.ts", content: PM }] }
}
