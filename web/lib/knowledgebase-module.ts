/**
 * knowledgebase-module.ts — self-service docs/FAQ connector. Thin client to a self-hosted Outline.
 * Create/search docs for support deflection. env: OUTLINE_URL, OUTLINE_TOKEN. OSS: Outline · BookStack.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const KB = `const base = () => (process.env.OUTLINE_URL || "http://localhost:3000").replace(/\\/$/, "")
const h = () => ({ Authorization: "Bearer " + (process.env.OUTLINE_TOKEN || ""), "Content-Type": "application/json" })
export async function createDoc(title: string, text: string, collectionId?: string) {
  return fetch(\`\${base()}/api/documents.create\`, { method: "POST", headers: h(), body: JSON.stringify({ title, text, collectionId: collectionId || process.env.OUTLINE_COLLECTION, publish: true }) }).then((r) => r.json()).catch((e) => { console.error("[kb]", e); return null })
}
export async function searchDocs(query: string) {
  return fetch(\`\${base()}/api/documents.search\`, { method: "POST", headers: h(), body: JSON.stringify({ query }) }).then((r) => r.json()).catch(() => null)
}
`
export function deterministicKnowledgeBase(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/knowledge base|base de conocimiento|faq|docs|documentaci|wiki|help center|centro de ayuda|self.?service|articles|art[ií]culos|outline/.test(hay)) return null
  return { files: [{ path: "lib/knowledgebase.ts", content: KB }] }
}
