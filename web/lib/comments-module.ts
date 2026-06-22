/**
 * comments-module.ts — threaded comments on any entity, Postgres-native. addComment(thread,
 * author, body, parentId?) supports nesting; tree(thread) returns the nested structure. For posts,
 * products, tasks, articles — anything users discuss.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const COM = `import { pool } from "@/lib/db"
export async function addComment(thread: string, author: string, body: string, parentId: number | null = null) {
  const { rows } = await pool.query("INSERT INTO comments (thread, author, body, parent_id) VALUES ($1,$2,$3,$4) RETURNING id", [thread, author, body, parentId])
  return rows[0].id
}
/** Nested comment tree for a thread. */
export async function commentTree(thread: string) {
  const { rows } = await pool.query("SELECT id, author, body, parent_id, created_at FROM comments WHERE thread=$1 AND deleted=false ORDER BY created_at", [thread])
  const byParent = new Map<number | null, any[]>()
  for (const r of rows) { const k = r.parent_id; if (!byParent.has(k)) byParent.set(k, []); byParent.get(k)!.push({ ...r, replies: [] }) }
  const attach = (node: any) => { node.replies = byParent.get(node.id) || []; node.replies.forEach(attach); return node }
  return (byParent.get(null) || []).map(attach)
}
export async function deleteComment(id: number) { await pool.query("UPDATE comments SET deleted=true WHERE id=$1", [id]) }
`
const SQL = `CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY, thread TEXT NOT NULL, author TEXT NOT NULL, body TEXT NOT NULL,
  parent_id BIGINT REFERENCES comments(id), deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_thread ON comments(thread, created_at);`

export function deterministicComments(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /comment|comentario|discuss|thread|hilo|reply|respuesta|foro|forum|community|comunidad|post|blog|article|social/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/comments.ts", content: COM }], extraSql: SQL }
}
