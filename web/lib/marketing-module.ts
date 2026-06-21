/**
 * marketing-module.ts — marketing automation connector (the HubSpot core: campaigns, segments,
 * lead scoring). Thin client to a self-hosted Mautic. env: MAUTIC_URL, MAUTIC_USER, MAUTIC_PASS
 * (basic auth) — OSS: Mautic · Listmonk (email-only).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const MK = `const base = () => (process.env.MAUTIC_URL || "http://localhost:8087").replace(/\\/$/, "")
const auth = () => "Basic " + Buffer.from((process.env.MAUTIC_USER || "") + ":" + (process.env.MAUTIC_PASS || "")).toString("base64")
const h = () => ({ Authorization: auth(), "Content-Type": "application/json" })
/** Create/update a marketing contact. */
export async function upsertContact(email: string, fields: Record<string, unknown> = {}) {
  return fetch(\`\${base()}/api/contacts/new\`, { method: "POST", headers: h(), body: JSON.stringify({ email, ...fields }) }).then((r) => r.json()).catch((e) => { console.error("[marketing]", e); return null })
}
export async function addToSegment(contactId: number, segmentId: number) {
  return fetch(\`\${base()}/api/segments/\${segmentId}/contact/\${contactId}/add\`, { method: "POST", headers: h() }).then((r) => r.json()).catch(() => null)
}
export async function addPoints(contactId: number, points: number) {
  return fetch(\`\${base()}/api/contacts/\${contactId}/points/plus/\${points}\`, { method: "POST", headers: h() }).then((r) => r.json()).catch(() => null)
}
`
export function deterministicMarketing(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/marketing|campa[ñn]a|campaign|nurtur|lead scoring|segment|newsletter|automation.*market|funnel|drip|mautic|hubspot/.test(hay)) return null
  return { files: [{ path: "lib/marketing.ts", content: MK }] }
}
