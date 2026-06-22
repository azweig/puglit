/**
 * admin-module.ts — auto CRUD admin over your tables (the thing everyone asks for right after a
 * build), Postgres-native. adminList/adminCreate/adminUpdate/adminDelete operate on an ALLOWLIST
 * of (table → columns) so it's injection-safe and scoped. Guard the routes by role (spine auth).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const ADMIN = `import { pool } from "@/lib/db"
const ident = (s: string) => /^[a-z_][a-z0-9_]*$/i.test(s)
// Allowlist: which tables admin may touch + which columns. Edit this to your schema.
export const ADMIN_TABLES: Record<string, string[]> = JSON.parse(process.env.ADMIN_TABLES || "{}")
function guard(table: string) { const cols = ADMIN_TABLES[table]; if (!cols || !ident(table)) throw new Error("table not admin-enabled"); return cols }

export async function adminList(table: string, opts: { page?: number; q?: string } = {}) {
  const cols = guard(table); const page = opts.page || 1; const off = (page - 1) * 25
  const { rows } = await pool.query(\`SELECT id, \${cols.join(",")} FROM \${table} ORDER BY id DESC LIMIT 25 OFFSET $1\`, [off])
  const total = (await pool.query(\`SELECT COUNT(*)::int AS n FROM \${table}\`)).rows[0].n
  return { rows, total, page }
}
export async function adminCreate(table: string, data: Record<string, unknown>) {
  const cols = guard(table); const keys = cols.filter((c) => c in data)
  const { rows } = await pool.query(\`INSERT INTO \${table} (\${keys.join(",")}) VALUES (\${keys.map((_, i) => "$" + (i + 1)).join(",")}) RETURNING id\`, keys.map((k) => data[k]))
  return rows[0].id
}
export async function adminUpdate(table: string, id: number, data: Record<string, unknown>) {
  const cols = guard(table); const keys = cols.filter((c) => c in data)
  await pool.query(\`UPDATE \${table} SET \${keys.map((k, i) => k + "=$" + (i + 2)).join(",")} WHERE id=$1\`, [id, ...keys.map((k) => data[k])])
}
export async function adminDelete(table: string, id: number) { guard(table); await pool.query(\`DELETE FROM \${table} WHERE id=$1\`, [id]) }
`

export function deterministicAdmin(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /admin|backoffice|back.?office|panel|dashboard|gestion|manage|moderat|cms|operador|staff|internal tool/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/admin.ts", content: ADMIN }] }
}
