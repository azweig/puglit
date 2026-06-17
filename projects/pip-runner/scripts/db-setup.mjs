// Create the leaderboard schema. Usage: node --env-file=.env.local scripts/db-setup.mjs
import pg from "pg"
import fs from "fs"
const cfg = { host: process.env.POSTGRES_HOST || "localhost", port: +(process.env.POSTGRES_PORT || 5432), user: process.env.POSTGRES_USER || "postgres", password: process.env.POSTGRES_PASSWORD || "postgres", database: process.env.POSTGRES_DB || "appdb", ssl: process.env.POSTGRES_SSL === "disable" ? undefined : { rejectUnauthorized: false } }
const c = new pg.Client(cfg)
await c.connect()
await c.query(fs.readFileSync("sql/app.sql", "utf8"))
await c.end()
console.log("✅ schema ready")
