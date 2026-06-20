/**
 * auth.ts — passwordless platform auth for the Puglit genetic console (multi-user beta).
 * Email → 6-digit code (15-min, hashed in Postgres) → HMAC-signed session cookie. No
 * passwords. Reuses the demo-auth HMAC pattern. The 75-agent swarm stays SHARED (collective
 * evolution) — auth just identifies who is driving, so we can scope each user's own builds.
 */
import { cookies } from "next/headers"
import { createHmac, randomInt, createHash, timingSafeEqual } from "node:crypto"
import { query } from "@/lib/db"

const SECRET = process.env.PUGLIT_SESSION_SECRET || "puglit-dev-secret-change-me"
const COOKIE = "puglit_session"
const SESSION_DAYS = 30

export interface Session { email: string; name?: string; exp: number }

export function signSession(s: Session): string {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url")
  const sig = createHmac("sha256", SECRET).update(body).digest("base64url")
  return `${body}.${sig}`
}
export function readSession(token?: string): Session | null {
  if (!token) return null
  const [body, sig] = token.split(".")
  if (!body || !sig) return null
  const expected = createHmac("sha256", SECRET).update(body).digest("base64url")
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try { const s = JSON.parse(Buffer.from(body, "base64url").toString()) as Session; return s.exp > Date.now() ? s : null } catch { return null }
}

export async function getSession(): Promise<Session | null> {
  const c = await cookies()
  return readSession(c.get(COOKIE)?.value)
}
export async function setSessionCookie(s: Session): Promise<void> {
  const c = await cookies()
  c.set(COOKIE, signSession(s), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DAYS * 86400 })
}
export async function clearSessionCookie(): Promise<void> {
  const c = await cookies(); c.delete(COOKIE)
}

const hashCode = (email: string, code: string) => createHash("sha256").update(`${email}:${code}:${SECRET}`).digest("hex")

/** Generate + store a fresh login code for an email (returns it so the caller can email it). */
export async function requestLoginCode(email: string): Promise<string> {
  const e = email.trim().toLowerCase()
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0")
  await query(`DELETE FROM puglit_login_codes WHERE email=$1`, [e]).catch(() => {})
  await query(`INSERT INTO puglit_login_codes (email, code_hash, expires_at) VALUES ($1,$2, NOW() + INTERVAL '15 minutes')`, [e, hashCode(e, code)]).catch(() => {})
  return code
}
/** Verify a code; on success upsert the user + return a Session (caller sets the cookie). */
export async function verifyLoginCode(email: string, code: string): Promise<Session | null> {
  const e = email.trim().toLowerCase()
  const { rows } = await query<{ code_hash: string }>(
    `SELECT code_hash FROM puglit_login_codes WHERE email=$1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`, [e])
  if (!rows[0]) return null
  const want = hashCode(e, String(code).trim())
  if (rows[0].code_hash.length !== want.length || !timingSafeEqual(Buffer.from(rows[0].code_hash), Buffer.from(want))) return null
  await query(`DELETE FROM puglit_login_codes WHERE email=$1`, [e]).catch(() => {})
  await query(`INSERT INTO puglit_users (email, last_login) VALUES ($1, NOW()) ON CONFLICT (email) DO UPDATE SET last_login=NOW()`, [e]).catch(() => {})
  return { email: e, exp: Date.now() + SESSION_DAYS * 86400_000 }
}
