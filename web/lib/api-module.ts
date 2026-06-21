/**
 * api-module.ts — API builder: turn any table into a REST resource + an OpenAPI spec, so a
 * generated app becomes a documented platform. makeCrud(table, cols) returns GET/POST/PUT/DELETE
 * handlers (parameterized, allowlisted columns → injection-safe); openApiSpec(resources) emits a
 * spec served at /api/openapi. Zero-dep.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const API = `import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
const ident = (s: string) => /^[a-z_][a-z0-9_]*$/i.test(s)
/** CRUD handlers for a table. cols = the columns clients may read/write (allowlist). */
export function makeCrud(table: string, cols: string[]) {
  if (!ident(table) || !cols.every(ident)) throw new Error("invalid table/cols")
  const list = cols.join(", ")
  return {
    async GET(req: NextRequest) {
      const id = req.nextUrl.searchParams.get("id")
      const { rows } = id
        ? await pool().query(\`SELECT id, \${list} FROM \${table} WHERE id=$1\`, [id])
        : await pool().query(\`SELECT id, \${list} FROM \${table} ORDER BY id DESC LIMIT 100\`)
      return NextResponse.json(id ? rows[0] || null : rows)
    },
    async POST(req: NextRequest) {
      const body = await req.json().catch(() => ({}))
      const keys = cols.filter((c) => c in body)
      const vals = keys.map((k) => body[k])
      const { rows } = await pool().query(\`INSERT INTO \${table} (\${keys.join(",")}) VALUES (\${keys.map((_, i) => "$" + (i + 1)).join(",")}) RETURNING id\`, vals)
      return NextResponse.json({ id: rows[0].id }, { status: 201 })
    },
    async PUT(req: NextRequest) {
      const body = await req.json().catch(() => ({}))
      const keys = cols.filter((c) => c in body)
      const set = keys.map((k, i) => \`\${k}=$\${i + 2}\`).join(",")
      await pool().query(\`UPDATE \${table} SET \${set} WHERE id=$1\`, [body.id, ...keys.map((k) => body[k])])
      return NextResponse.json({ ok: true })
    },
    async DELETE(req: NextRequest) {
      const id = req.nextUrl.searchParams.get("id")
      await pool().query(\`DELETE FROM \${table} WHERE id=$1\`, [id])
      return NextResponse.json({ ok: true })
    },
  }
}
/** Minimal OpenAPI 3.1 spec for a set of resources. */
export function openApiSpec(resources: { name: string; cols: string[] }[]) {
  const paths: any = {}
  for (const r of resources) {
    paths["/api/" + r.name] = { get: { summary: "List " + r.name }, post: { summary: "Create " + r.name }, put: { summary: "Update " + r.name }, delete: { summary: "Delete " + r.name } }
  }
  return { openapi: "3.1.0", info: { title: "API", version: "1.0.0" }, paths }
}
`

export function deterministicApi(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /\bapi\b|rest|openapi|swagger|sdk|developer|platform|plataforma|integrac|endpoint|public api|headless/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/api.ts", content: API }] }
}
