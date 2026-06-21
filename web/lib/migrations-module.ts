/**
 * migrations-module.ts — versioned schema migrations (an ORM/raw-SQL gap-filler), Postgres-native.
 * Declare ordered { version, name, sql } steps; runMigrations() applies the pending ones inside a
 * transaction and records them in schema_migrations (idempotent, safe to run on boot). Turns the
 * swarm's raw SQL into a tracked, repeatable schema history — and makes auto-repair additive.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const MIG = `import { pool } from "@/lib/db"
export interface Migration { version: number; name: string; sql: string }

/** Apply all migrations whose version is newer than what's recorded. Idempotent. */
export async function runMigrations(migrations: Migration[]): Promise<number> {
  const db = pool()
  await db.query("CREATE TABLE IF NOT EXISTS schema_migrations (version INT PRIMARY KEY, name TEXT, applied_at TIMESTAMPTZ DEFAULT NOW())")
  const { rows } = await db.query("SELECT COALESCE(MAX(version),0) AS v FROM schema_migrations")
  const current = rows[0].v
  const pending = migrations.filter((m) => m.version > current).sort((a, b) => a.version - b.version)
  let applied = 0
  for (const m of pending) {
    const client = await db.connect()
    try {
      await client.query("BEGIN")
      await client.query(m.sql)
      await client.query("INSERT INTO schema_migrations (version, name) VALUES ($1,$2)", [m.version, m.name])
      await client.query("COMMIT")
      applied++
    } catch (e) { await client.query("ROLLBACK"); throw new Error(\`migration \${m.version} (\${m.name}) failed: \${(e as Error).message}\`) }
    finally { client.release() }
  }
  return applied
}
/** Current schema version. */
export async function schemaVersion(): Promise<number> {
  try { const { rows } = await pool().query("SELECT COALESCE(MAX(version),0) AS v FROM schema_migrations"); return rows[0].v } catch { return 0 }
}
`

export function deterministicMigrations(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /migrat|schema|database|orm|version.*(db|schema)|evolv|alter|seed|datos|enterprise|saas|admin/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/migrations.ts", content: MIG }] }
}
