/**
 * crm-module.ts — CRM connector (HubSpot alternative). Thin REST client to a self-hosted EspoCRM
 * (clean REST API) — leads, contacts, deals/opportunities + pipeline stages. The OSS CRM runs as
 * its own service. env: CRM_URL, CRM_KEY (X-Api-Key). OSS: EspoCRM · Twenty · SuiteCRM.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const CRM = `const base = () => (process.env.CRM_URL || "http://localhost:8085").replace(/\\/$/, "")
const h = () => ({ "X-Api-Key": process.env.CRM_KEY || "", "Content-Type": "application/json" })
/** Create a record of any CRM entity (Lead, Contact, Account, Opportunity). */
export async function createRecord(entity: string, data: Record<string, unknown>) {
  return fetch(\`\${base()}/api/v1/\${entity}\`, { method: "POST", headers: h(), body: JSON.stringify(data) }).then((r) => r.json()).catch((e) => { console.error("[crm]", e); return null })
}
export async function listRecords(entity: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString()
  return fetch(\`\${base()}/api/v1/\${entity}?\${qs}\`, { headers: h() }).then((r) => r.json()).catch(() => null)
}
export async function updateRecord(entity: string, id: string, data: Record<string, unknown>) {
  return fetch(\`\${base()}/api/v1/\${entity}/\${id}\`, { method: "PUT", headers: h(), body: JSON.stringify(data) }).then((r) => r.json()).catch(() => null)
}
/** Move a deal/opportunity to a new pipeline stage. */
export async function moveStage(oppId: string, stage: string) { return updateRecord("Opportunity", oppId, { stage }) }
`
export function deterministicCrm(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/\bcrm\b|lead|contacto|contact|deal|oportunidad|opportunit|pipeline|sales|ventas|cliente|customer|hubspot|salesforce|postventa|funnel/.test(hay)) return null
  return { files: [{ path: "lib/crm.ts", content: CRM }] }
}
