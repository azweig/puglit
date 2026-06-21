/**
 * dms-module.ts — document management connector (archival, full-text, tags). Thin client to a
 * self-hosted Paperless-ngx: upload, search, fetch. env: PAPERLESS_URL, PAPERLESS_TOKEN. OSS:
 * Paperless-ngx · Mayan EDMS. (Pairs with docparse/ocr for the AI side.)
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const DMS = `const base = () => (process.env.PAPERLESS_URL || "http://localhost:8000").replace(/\\/$/, "")
const h = () => ({ Authorization: "Token " + (process.env.PAPERLESS_TOKEN || "") })
/** Upload a document (multipart). file = a Blob/Buffer. */
export async function upload(file: Blob | Buffer, filename: string, title?: string) {
  const fd = new FormData()
  fd.append("document", new Blob([file as any]), filename)
  if (title) fd.append("title", title)
  return fetch(\`\${base()}/api/documents/post_document/\`, { method: "POST", headers: h(), body: fd }).then((r) => r.text()).catch((e) => { console.error("[dms]", e); return null })
}
export async function search(query: string) {
  return fetch(\`\${base()}/api/documents/?query=\${encodeURIComponent(query)}\`, { headers: h() }).then((r) => r.json()).catch(() => null)
}
export async function getDocument(id: number) {
  return fetch(\`\${base()}/api/documents/\${id}/\`, { headers: h() }).then((r) => r.json()).catch(() => null)
}
`
export function deterministicDms(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/\bdms\b|document management|gesti[oó]n documental|archivo.*document|paperless|expedient|records.*manag|digitaliz|mayan|file.*cabinet/.test(hay)) return null
  return { files: [{ path: "lib/dms.ts", content: DMS }] }
}
