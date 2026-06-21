/**
 * esign-module.ts — e-signature connector (DocuSign alternative). Thin client to a self-hosted
 * Documenso. Send a document for signature + check status. env: DOCUMENSO_URL, DOCUMENSO_KEY.
 * OSS: Documenso · OpenSign.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const ES = `const base = () => (process.env.DOCUMENSO_URL || "http://localhost:3000").replace(/\\/$/, "")
const h = () => ({ Authorization: "Bearer " + (process.env.DOCUMENSO_KEY || ""), "Content-Type": "application/json" })
/** Create a document + invite signers (recipients = [{name,email}]). Returns the document id. */
export async function sendForSignature(title: string, recipients: { name: string; email: string }[], fileBase64?: string) {
  return fetch(\`\${base()}/api/v1/documents\`, { method: "POST", headers: h(), body: JSON.stringify({ title, recipients, ...(fileBase64 ? { documentDataId: fileBase64 } : {}) }) }).then((r) => r.json()).catch((e) => { console.error("[esign]", e); return null })
}
export async function signatureStatus(documentId: string) {
  return fetch(\`\${base()}/api/v1/documents/\${documentId}\`, { headers: h() }).then((r) => r.json()).catch(() => null)
}
`
export function deterministicEsign(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/firma|sign|esign|e-sign|signature|docusign|contrato.*firm|legal.*doc|documenso|notari/.test(hay)) return null
  return { files: [{ path: "lib/esign.ts", content: ES }] }
}
