/**
 * Puglit Spine — db.ts
 * PostgreSQL pool (tuned for the Supabase Supavisor pooler) + core schema +
 * the fixed analytics tracking. Domain tables are generated per-project and
 * appended; the Spine only owns the CORE tables (users handled by auth module,
 * page_visits + analytics_events here).
 *
 * PROD NOTE (BLUEPRINT §5/§6): ensureSchema() is SKIPPED in production. DDL is
 * shipped as scripts/sql/*.sql to run manually (app DB role is not the owner).
 * Connect via the POOLER (host aws-N-<region>.pooler.supabase.com, user
 * dbuser.projectref, session mode 5432) — a direct db.<ref>.supabase.co is
 * IPv6-only and Fly egresses IPv4.
 */
import { Pool } from "pg"

export const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DB || "postgres",
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "",
  max: parseInt(process.env.POSTGRES_POOL_MAX || "15"), // ×N machines ≤ DB limit
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
  allowExitOnIdle: true,
  application_name: process.env.APP_NAME || "puglit-app",
})

pool.on("error", (err: Error & { code?: string }) => {
  console.error(`[pg-pool] error code=${err.code || "?"} ${err.message} total=${pool.totalCount} idle=${pool.idleCount} waiting=${pool.waitingCount}`)
})

let initialized = process.env.NODE_ENV === "production"

/** Idempotent core schema. Skipped in prod (run scripts/sql/*.sql manually). */
export async function ensureSchema(): Promise<void> {
  if (initialized) return
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_visits (
        id SERIAL PRIMARY KEY,
        page VARCHAR(255) NOT NULL,
        referrer VARCHAR(500),
        user_agent TEXT,
        ip_address VARCHAR(45),
        session_id VARCHAR(255),
        user_id INTEGER,
        device_type VARCHAR(20) DEFAULT 'desktop',
        country VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_page_visits_created ON page_visits(created_at);
      CREATE INDEX IF NOT EXISTS idx_page_visits_page ON page_visits(page);

      -- Funnel events (funnel_step, form_started, form_error, cta_click…).
      -- Persisted so you can measure drop-off — never discard them.
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event VARCHAR(64) NOT NULL,
        page VARCHAR(255),
        session_id VARCHAR(255),
        user_id INTEGER,
        device_type VARCHAR(20) DEFAULT 'desktop',
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
    `)
    initialized = true
  } finally {
    client.release()
  }
}

export async function trackPageVisit(d: {
  page: string; referrer?: string | null; userAgent?: string; ipAddress?: string
  sessionId?: string; userId?: number; deviceType?: string; country?: string
}): Promise<void> {
  await ensureSchema()
  await pool.query(
    `INSERT INTO page_visits (page, referrer, user_agent, ip_address, session_id, user_id, device_type, country)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [d.page, d.referrer || null, d.userAgent || null, d.ipAddress || null,
     d.sessionId || null, d.userId || null, d.deviceType || "desktop", d.country || null]
  )
}

/** Persists funnel/UX events. Tolerant: if the table isn't created yet in prod, it no-ops. */
export async function trackEvent(d: {
  event: string; page?: string; sessionId?: string; userId?: number
  deviceType?: string; data?: Record<string, any>
}): Promise<void> {
  try {
    await ensureSchema()
    await pool.query(
      `INSERT INTO analytics_events (event, page, session_id, user_id, device_type, data)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [String(d.event).slice(0, 64), d.page || null, d.sessionId || null,
       d.userId || null, d.deviceType || "desktop", d.data ? JSON.stringify(d.data) : null]
    )
  } catch { /* table not yet created in prod → don't block tracking */ }
}
