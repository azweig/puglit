/**
 * Puglit Spine — users.ts
 * The generic user store owned by the auth module. Domain-specific signup
 * fields (birth date, dietary prefs, favourite team…) live in the `profile`
 * JSONB column, NOT as hard columns — the seam stays domain-free. Subscription
 * state (plan + subscription_end) lives here; getEffectivePlan() is the single
 * source of truth the gating layer reads.
 *
 * PROD NOTE: ensureAuthSchema() is skipped in production (see db.ts). Ship the
 * matching scripts/sql/002_auth.sql for Supabase since the app role can't DDL.
 */
import { randomBytes } from "node:crypto"
import { pool } from "@/lib/db"
import config from "@/domain.config"

export interface UserRow {
  id: number
  email: string
  name: string | null
  password_hash: string | null
  plan: string
  subscription_end: Date | null
  email_verified: boolean
  oauth_provider: string | null
  profile: Record<string, unknown> | null
  created_at: Date
}

export type TokenKind = "verify" | "reset" | "magic"

let authInitialized = process.env.NODE_ENV === "production"

/** Idempotent auth schema. Skipped in prod — run scripts/sql/002_auth.sql there. */
export async function ensureAuthSchema(): Promise<void> {
  if (authInitialized) return
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(120),
        password_hash TEXT,
        plan VARCHAR(40) NOT NULL DEFAULT 'free',
        subscription_end TIMESTAMP WITH TIME ZONE,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        oauth_provider VARCHAR(20),
        profile JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));

      -- One table for all short-lived auth tokens (verify/reset/magic).
      CREATE TABLE IF NOT EXISTS auth_tokens (
        id SERIAL PRIMARY KEY,
        kind VARCHAR(10) NOT NULL,
        token VARCHAR(120) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
    `)
    authInitialized = true
  } finally {
    client.release()
  }
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  await ensureAuthSchema()
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email]
  )
  return rows[0] || null
}

export async function getUserById(id: number): Promise<UserRow | null> {
  await ensureAuthSchema()
  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id])
  return rows[0] || null
}

export async function createUser(input: {
  email: string
  name: string
  passwordHash: string | null
  oauthProvider?: string | null
  profile?: Record<string, unknown> | null
}): Promise<UserRow> {
  await ensureAuthSchema()
  const { rows } = await pool.query(
    `INSERT INTO users (email, name, password_hash, oauth_provider, profile, plan)
     VALUES ($1,$2,$3,$4,$5,'free') RETURNING *`,
    [input.email, input.name, input.passwordHash, input.oauthProvider || null,
     input.profile ? JSON.stringify(input.profile) : null]
  )
  return rows[0]
}

export async function markEmailVerified(userId: number): Promise<void> {
  await pool.query(`UPDATE users SET email_verified = TRUE WHERE id = $1`, [userId])
}

export async function setPasswordHash(userId: number, hash: string): Promise<void> {
  await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, userId])
}

export async function setUserPlan(userId: number, plan: string, subscriptionEnd: Date | null): Promise<void> {
  await pool.query(
    `UPDATE users SET plan = $1, subscription_end = $2 WHERE id = $3`,
    [plan, subscriptionEnd, userId]
  )
}

// ---------------------------------------------------------------------------
// Plan resolution — the single source of truth for gating.
// A plan with interval "one-time" never expires (treated as lifetime).
// Any time-bound plan whose subscription_end has passed falls back to free.
// ---------------------------------------------------------------------------
const NON_EXPIRING = new Set(
  config.monetization.plans.filter((p) => p.interval === "one-time").map((p) => p.id)
)
const FREE_PLAN_ID = config.monetization.plans.find((p) => p.priceUsd === 0)?.id || "free"

export async function getEffectivePlan(userId: number): Promise<string> {
  const user = await getUserById(userId)
  if (!user) return FREE_PLAN_ID
  if (user.plan === FREE_PLAN_ID || NON_EXPIRING.has(user.plan)) return user.plan
  if (user.subscription_end && new Date(user.subscription_end).getTime() < Date.now()) {
    return FREE_PLAN_ID
  }
  return user.plan
}

// ---------------------------------------------------------------------------
// Auth tokens (verify / reset / magic) — opaque random, single-use, expiring.
// ---------------------------------------------------------------------------
export async function createToken(
  kind: TokenKind,
  userId: number | null,
  email: string,
  ttlMs: number
): Promise<string> {
  await ensureAuthSchema()
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + ttlMs)
  await pool.query(
    `INSERT INTO auth_tokens (kind, token, user_id, email, expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [kind, token, userId, email, expiresAt]
  )
  return token
}

/** Consumes a token: returns its {userId,email} if valid+unused+unexpired, else null. */
export async function consumeToken(
  kind: TokenKind,
  token: string
): Promise<{ userId: number | null; email: string } | null> {
  await ensureAuthSchema()
  const { rows } = await pool.query(
    `UPDATE auth_tokens SET used_at = NOW()
     WHERE token = $1 AND kind = $2 AND used_at IS NULL AND expires_at > NOW()
     RETURNING user_id, email`,
    [token, kind]
  )
  if (!rows[0]) return null
  return { userId: rows[0].user_id, email: rows[0].email }
}

export { FREE_PLAN_ID }
