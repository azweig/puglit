import { Pool } from "pg"

const g = globalThis as unknown as { _pool?: Pool }
export const pool =
  g._pool ||
  (g._pool = new Pool({
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "appdb",
    max: 10,
    idleTimeoutMillis: 30000,
    ssl: process.env.POSTGRES_SSL === "disable" ? undefined : { rejectUnauthorized: false },
  }))
