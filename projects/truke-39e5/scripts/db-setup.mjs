// Create the schema in the configured Postgres: runs sql/*.sql in order.
// Usage: node --env-file=.env.local scripts/db-setup.mjs
import pg from "pg"
import fs from "fs"
import path from "path"

const cfg = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: process.env.POSTGRES_SSL === "disable" ? undefined : { rejectUnauthorized: false } }
  : { host: process.env.POSTGRES_HOST || "localhost", port: +(process.env.POSTGRES_PORT || 5432), user: process.env.POSTGRES_USER || "postgres", password: process.env.POSTGRES_PASSWORD || "postgres", database: process.env.POSTGRES_DB || "appdb", ssl: process.env.POSTGRES_SSL === "disable" ? undefined : { rejectUnauthorized: false } }

const order = ["001_core.sql", "002_auth.sql", "003_records.sql", "app.sql"]
const c = new pg.Client(cfg)
await c.connect()
for (const f of order) {
  const p = path.join("sql", f)
  if (!fs.existsSync(p)) continue
  const sql = fs.readFileSync(p, "utf8").trim()
  if (!sql) continue
  try { await c.query(sql); console.log("ran", f) } catch (e) { console.log("ERR", f, "→", e.message) }
}
await c.end()
console.log("✅ schema ready")
