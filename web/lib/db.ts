/**
 * Puglit web — db.ts
 * Postgres (Supabase Supavisor pooler) storage for generated projects + waitlist.
 * Everything the interview captures is persisted: raw answers AND the generated
 * config. Tolerant by design: if POSTGRES_* isn't configured yet the generator
 * still works (returns the config) — it just can't persist; isConfigured() lets
 * the UI say so honestly instead of pretending.
 *
 * PROD: run web/sql/puglit.sql in Supabase (the app role can't DDL). ensureSchema
 * only runs outside production as a dev convenience.
 */
import { Pool } from "pg"
import type { DomainConfig } from "@/lib/domain-types"

let _pool: Pool | null = null

export function isConfigured(): boolean {
  return !!process.env.POSTGRES_HOST && !!process.env.POSTGRES_PASSWORD
}

function pool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      database: process.env.POSTGRES_DB || "postgres",
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      max: parseInt(process.env.POSTGRES_POOL_MAX || "5"),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
      allowExitOnIdle: true,
      application_name: "puglit-web",
      // Supabase requires TLS. Set POSTGRES_SSL=disable for a local plain DB.
      ssl: process.env.POSTGRES_SSL === "disable" ? undefined : { rejectUnauthorized: false },
    })
    _pool.on("error", (e) => console.error("[pg] pool error:", e.message))
  }
  return _pool
}

/** Shared query helper (used by demo-auth too). */
export async function query<T = any>(text: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number | null }> {
  return pool().query(text, params as never) as unknown as Promise<{ rows: T[]; rowCount: number | null }>
}

let initialized = process.env.NODE_ENV === "production"
async function ensureSchema(): Promise<void> {
  if (initialized) return
  await pool().query(SCHEMA_SQL)
  initialized = true
}

export interface ProjectRow {
  slug: string
  name: string
  email: string | null
  config: DomainConfig
  landing_html: string | null
  created_at: string
}

export async function saveProject(input: {
  slug: string; email: string | null; name: string
  answers: Record<string, unknown>; config: DomainConfig; landingHtml?: string | null
}): Promise<void> {
  await ensureSchema()
  // Idempotent: deliver can re-run (re-entrant pipeline) and a slug may already exist —
  // upsert instead of crashing the whole build on a duplicate-key violation.
  await pool().query(
    `INSERT INTO puglit_projects (slug, email, name, answers, config, landing_html)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (slug) DO UPDATE SET
       email = EXCLUDED.email, name = EXCLUDED.name, answers = EXCLUDED.answers,
       config = EXCLUDED.config, landing_html = EXCLUDED.landing_html`,
    [input.slug, input.email, input.name, JSON.stringify(input.answers), JSON.stringify(input.config), input.landingHtml || null]
  )
}

export async function getProject(slug: string): Promise<ProjectRow | null> {
  if (!isConfigured()) return null
  await ensureSchema()
  const { rows } = await pool().query(
    `SELECT slug, name, email, config, landing_html, created_at FROM puglit_projects WHERE slug = $1 LIMIT 1`,
    [slug]
  )
  return rows[0] || null
}

export async function listProjects(limit = 24): Promise<ProjectRow[]> {
  if (!isConfigured()) return []
  await ensureSchema()
  const { rows } = await pool().query(
    `SELECT slug, name, config, created_at FROM puglit_projects
     WHERE featured = TRUE ORDER BY created_at DESC LIMIT $1`,
    [limit]
  )
  return rows
}

export async function slugExists(slug: string): Promise<boolean> {
  if (!isConfigured()) return false
  await ensureSchema()
  const { rows } = await pool().query(`SELECT 1 FROM puglit_projects WHERE slug = $1 LIMIT 1`, [slug])
  return rows.length > 0
}

export async function saveWaitlist(email: string): Promise<void> {
  await ensureSchema()
  await pool().query(
    `INSERT INTO puglit_waitlist (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
    [email]
  )
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS puglit_projects (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(120) NOT NULL,
  answers JSONB NOT NULL,
  config JSONB NOT NULL,
  landing_html TEXT,
  featured BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_puglit_projects_created ON puglit_projects(created_at DESC);
-- Idempotent: add landing_html to tables created before this column existed.
ALTER TABLE puglit_projects ADD COLUMN IF NOT EXISTS landing_html TEXT;

CREATE TABLE IF NOT EXISTS puglit_waitlist (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS puglit_jobs (
  id VARCHAR(32) PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  answers JSONB NOT NULL,
  branding JSONB,
  config JSONB,
  steps JSONB NOT NULL,
  artifacts JSONB,
  completion INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  lease_until TIMESTAMP WITH TIME ZONE,
  user_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_puglit_jobs_status ON puglit_jobs(status, updated_at DESC);
-- idempotent: owner scoping for multi-user (builds created before this column existed)
ALTER TABLE puglit_jobs ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_puglit_jobs_user ON puglit_jobs(user_email, created_at DESC);
`
