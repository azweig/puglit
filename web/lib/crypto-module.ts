/**
 * crypto-module.ts — encryption at rest + password hashing + signing, all on Node's built-in
 * crypto (no deps). The security primitives every app should have but agents tend to skip:
 *   - encrypt/decrypt: AES-256-GCM (authenticated, tamper-evident) for tokens/secrets/PII at rest
 *   - hashPassword/verifyPassword: scrypt (memory-hard), constant-time compare
 *   - sign/verify: HMAC-SHA256 for tokens/webhook payloads
 * Keys come from env (ENCRYPTION_KEY), never the repo. If the key is missing it degrades to a
 * loud-warned passthrough so the app still runs in dev — set the key for real protection.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const CRYPTO = `import { randomBytes, createCipheriv, createDecipheriv, scryptSync, timingSafeEqual, createHmac } from "node:crypto"
// env: ENCRYPTION_KEY (>= 32 chars). Generate one: openssl rand -hex 32
const keyOf = () => scryptSync(process.env.ENCRYPTION_KEY || "", "puglit-aes", 32)

/** AES-256-GCM encrypt → "enc:iv.tag.ciphertext" (base64). Authenticated. */
export function encrypt(plaintext: string): string {
  const k = process.env.ENCRYPTION_KEY
  if (!k || k.length < 32) { console.warn("[crypto] set ENCRYPTION_KEY (>=32 chars) to encrypt at rest"); return "plain:" + plaintext }
  const iv = randomBytes(12)
  const c = createCipheriv("aes-256-gcm", keyOf(), iv)
  const ct = Buffer.concat([c.update(plaintext, "utf8"), c.final()])
  return "enc:" + [iv.toString("base64"), c.getAuthTag().toString("base64"), ct.toString("base64")].join(".")
}
/** Decrypt a value produced by encrypt() (handles the plaintext-fallback too). */
export function decrypt(blob: string): string {
  if (!blob) return ""
  if (blob.startsWith("plain:")) return blob.slice(6)
  if (!blob.startsWith("enc:")) return blob
  const [iv, tag, ct] = blob.slice(4).split(".")
  const d = createDecipheriv("aes-256-gcm", keyOf(), Buffer.from(iv, "base64"))
  d.setAuthTag(Buffer.from(tag, "base64"))
  return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8")
}

/** Password hashing — scrypt (memory-hard), salted. Store the full string; compare with verify. */
export function hashPassword(pw: string): string {
  const salt = randomBytes(16)
  return salt.toString("hex") + ":" + scryptSync(pw, salt, 64).toString("hex")
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const h = scryptSync(pw, Buffer.from(salt, "hex"), 64)
  const hb = Buffer.from(hash, "hex")
  return h.length === hb.length && timingSafeEqual(h, hb)
}

/** HMAC-SHA256 sign/verify (tokens, webhook signatures). Constant-time verify. */
export function sign(data: string): string { return createHmac("sha256", process.env.ENCRYPTION_KEY || "").update(data).digest("hex") }
export function verifySignature(data: string, sig: string): boolean {
  const e = sign(data)
  return e.length === sig.length && timingSafeEqual(Buffer.from(e), Buffer.from(sig))
}
`

/** Inject crypto when the product handles secrets/auth/PII (or co-injected with payments/social). */
export function deterministicCrypto(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /encrypt|encripta|cifra|crypto|secret|token|password|contrase|auth|pii|sensitive|sensible|privac|secure|seguridad|gdpr|wallet|api[_ ]?key/.test(hay)
  if (!wants) return null
  return cryptoFiles()
}
/** The crypto files (also pulled in by payments/social-auth so stored tokens get encrypted). */
export function cryptoFiles(): { files: AppFile[] } {
  return { files: [{ path: "lib/crypto.ts", content: CRYPTO }] }
}
