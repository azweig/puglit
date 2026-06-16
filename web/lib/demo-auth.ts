/**
 * Puglit web — demo-auth.ts
 * Makes the live demos (/x/<slug>) actually FUNCTIONAL: visitors can register &
 * sign in, and it's backed by Puglit's own Postgres (the same Supabase as the
 * generator). Users are namespaced per project (project_slug) in a dedicated
 * puglit_demo_users table. The DB credentials live ONLY in Puglit's server env —
 * never in the generated source on GitHub. Password hashing + session signing
 * use node:crypto (scrypt + HMAC), no extra deps.
 */
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto"
import { query, isConfigured } from "@/lib/db"

export { isConfigured }

let ready = process.env.NODE_ENV === "production"
async function ensureDemoSchema() {
  if (ready) return
  await query(`
    CREATE TABLE IF NOT EXISTS puglit_demo_users (
      id BIGSERIAL PRIMARY KEY,
      project_slug VARCHAR(80) NOT NULL,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(120),
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (project_slug, email)
    );
    CREATE INDEX IF NOT EXISTS idx_demo_users_slug ON puglit_demo_users(project_slug);
  `)
  ready = true
}

function hashPw(pw: string): string {
  const salt = randomBytes(16).toString("hex")
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`
}
function verifyPw(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const a = Buffer.from(hash, "hex")
  const b = scryptSync(pw, salt, 64)
  return a.length === b.length && timingSafeEqual(a, b)
}

const SECRET = process.env.DEMO_SESSION_SECRET || "puglit-demo-dev-secret"
export interface DemoSession { slug: string; email: string; name: string }

export function signSession(s: DemoSession): string {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url")
  const sig = createHmac("sha256", SECRET).update(body).digest("base64url")
  return `${body}.${sig}`
}
export function readSession(token: string | undefined): DemoSession | null {
  if (!token) return null
  const [body, sig] = token.split(".")
  if (!body || !sig) return null
  const expected = createHmac("sha256", SECRET).update(body).digest("base64url")
  if (sig !== expected) return null
  try { return JSON.parse(Buffer.from(body, "base64url").toString()) } catch { return null }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function registerDemo(slug: string, email: string, password: string, name: string): Promise<{ ok: true; session: DemoSession } | { ok: false; error: string }> {
  if (!isConfigured()) return { ok: false, error: "Demo database not connected." }
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Invalid email." }
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." }
  await ensureDemoSchema()
  const exists = await query(`SELECT 1 FROM puglit_demo_users WHERE project_slug=$1 AND LOWER(email)=LOWER($2) LIMIT 1`, [slug, email])
  if (exists.rows.length) {
    // already registered → treat as login
    return loginDemo(slug, email, password)
  }
  const nm = (name || "").trim().slice(0, 120) || email.split("@")[0]
  await query(`INSERT INTO puglit_demo_users (project_slug, email, name, password_hash) VALUES ($1,$2,$3,$4)`, [slug, email, nm, hashPw(password)])
  return { ok: true, session: { slug, email, name: nm } }
}

export async function loginDemo(slug: string, email: string, password: string): Promise<{ ok: true; session: DemoSession } | { ok: false; error: string }> {
  if (!isConfigured()) return { ok: false, error: "Demo database not connected." }
  await ensureDemoSchema()
  const { rows } = await query(`SELECT email, name, password_hash FROM puglit_demo_users WHERE project_slug=$1 AND LOWER(email)=LOWER($2) LIMIT 1`, [slug, email])
  const u = rows[0]
  if (!u || !verifyPw(password, u.password_hash)) return { ok: false, error: "Invalid email or password." }
  return { ok: true, session: { slug, email: u.email, name: u.name || email } }
}
