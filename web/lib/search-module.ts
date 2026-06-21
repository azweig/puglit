/**
 * search-module.ts — full-text search, zero-dep. Default: Postgres FTS (ts_vector/ts_rank, no
 * extra infra — you already have Postgres). For instant/typo-tolerant/faceted search, point at a
 * self-hosted Meilisearch (thin HTTP client). pgSearch(table, cols, q) or the Meili client.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const SEARCH = `import { pool } from "@/lib/db"
/** Postgres full-text search over given columns of a table. Safe: table/cols are validated
 *  against an allowlist you pass; the query is parameterized. Returns ranked rows. */
export async function pgSearch(table: string, columns: string[], q: string, limit = 20) {
  const safe = (s: string) => /^[a-z_][a-z0-9_]*$/i.test(s)
  if (!safe(table) || !columns.every(safe) || !columns.length) throw new Error("invalid table/columns")
  const doc = columns.map((c) => \`coalesce(\${c}::text,'')\`).join(" || ' ' || ")
  const { rows } = await pool().query(
    \`SELECT *, ts_rank(to_tsvector('simple', \${doc}), plainto_tsquery('simple', $1)) AS rank
     FROM \${table} WHERE to_tsvector('simple', \${doc}) @@ plainto_tsquery('simple', $1)
     ORDER BY rank DESC LIMIT $2\`, [q, limit])
  return rows
}

// Meilisearch (self-hosted) — instant + typo-tolerant + faceted. env: MEILI_URL, MEILI_KEY
const meili = () => ({ url: (process.env.MEILI_URL || "http://localhost:7700").replace(/\\/$/, ""), key: process.env.MEILI_KEY || "" })
export async function meiliIndex(index: string, docs: any[]) {
  const { url, key } = meili()
  await fetch(\`\${url}/indexes/\${index}/documents\`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key }, body: JSON.stringify(docs) }).catch((e) => console.error("[meili]", e))
}
export async function meiliSearch(index: string, q: string, opts?: { limit?: number; filter?: string }) {
  const { url, key } = meili()
  return fetch(\`\${url}/indexes/\${index}/search\`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key }, body: JSON.stringify({ q, limit: opts?.limit || 20, filter: opts?.filter }) }).then((r) => r.json()).catch(() => null)
}
`

export function deterministicSearch(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /search|busca|buscar|b[uú]squeda|filter|filtro|find|explora|catalog|directorio|listing|marketplace|encontrar|query/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/search.ts", content: SEARCH }] }
}
