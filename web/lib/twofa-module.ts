/**
 * twofa-module.ts — TOTP two-factor auth (Google Authenticator / Authy compatible), zero-dep
 * (node crypto). generateSecret() → store per user; otpauthUrl() → render as a QR; verifyTotp()
 * on login. ±1 step tolerance for clock drift. Pairs with the spine's auth + the crypto module
 * (encrypt the stored secret).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const TWOFA = `import { createHmac, randomBytes } from "node:crypto"
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = ""
  for (const b of buf) { value = (value << 8) | b; bits += 8; while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5 } }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}
function base32Decode(str: string): Buffer {
  let bits = 0, value = 0; const out: number[] = []
  for (const c of str.replace(/=+$/, "").toUpperCase()) { const idx = B32.indexOf(c); if (idx < 0) continue; value = (value << 5) | idx; bits += 5; if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8 } }
  return Buffer.from(out)
}
/** New random TOTP secret (base32). Store it (encrypted) per user. */
export function generateSecret(): string { return base32Encode(randomBytes(20)) }
/** Current 6-digit code for a secret (window = step offset, for drift tolerance). */
export function totp(secret: string, window = 0): string {
  const counter = Math.floor(Date.now() / 1000 / 30) + window
  const buf = Buffer.alloc(8); buf.writeBigInt64BE(BigInt(counter))
  const h = createHmac("sha1", base32Decode(secret)).update(buf).digest()
  const o = h[h.length - 1] & 0xf
  const code = ((h[o] & 0x7f) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1000000
  return String(code).padStart(6, "0")
}
/** Verify a user-entered token (±1 step for clock drift). */
export function verifyTotp(secret: string, token: string): boolean {
  return [0, -1, 1].some((w) => totp(secret, w) === String(token).trim())
}
/** otpauth:// URI — render it as a QR for the user to scan in their authenticator app. */
export function otpauthUrl(secret: string, account: string, issuer = "App"): string {
  return \`otpauth://totp/\${encodeURIComponent(issuer)}:\${encodeURIComponent(account)}?secret=\${secret}&issuer=\${encodeURIComponent(issuer)}&period=30&digits=6\`
}
`

export function deterministicTwoFA(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /2fa|mfa|two.?factor|dos factores|totp|authenticator|otp|verificaci[oó]n en dos|secure login|banking|fintech|wallet|seguridad de cuenta/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/twofa.ts", content: TWOFA }] }
}
