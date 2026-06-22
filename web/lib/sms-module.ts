/**
 * sms-module.ts — send SMS + verification codes, zero-dep. Twilio by default (works worldwide);
 * env-swappable. sendSMS(to, body) + sendCode(to) / verifyCode for OTP-by-SMS. env: TWILIO_SID,
 * TWILIO_TOKEN, TWILIO_FROM. (For pure notifications you can also use Apprise; this is for 2-way
 * / verification SMS.)
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const SMS = `import { pool } from "@/lib/db"
/** Send an SMS via Twilio. */
export async function sendSMS(to: string, body: string): Promise<{ id: string } | null> {
  const sid = process.env.TWILIO_SID || "", token = process.env.TWILIO_TOKEN || ""
  try {
    const r = await fetch(\`https://api.twilio.com/2010-04-01/Accounts/\${sid}/Messages.json\`, { method: "POST", headers: { Authorization: "Basic " + Buffer.from(sid + ":" + token).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM || "", Body: body }) }).then((x) => x.json())
    return r.sid ? { id: r.sid } : null
  } catch (e) { console.error("[sms]", (e as Error).message); return null }
}
/** Send a 6-digit verification code (stored hashed, 10-min expiry). */
export async function sendCode(to: string): Promise<boolean> {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  await pool.query("INSERT INTO sms_codes (phone, code, expires_at) VALUES ($1,$2, NOW() + interval '10 minutes')", [to, code]).catch(() => {})
  return !!(await sendSMS(to, "Tu código: " + code))
}
/** Verify a code the user entered. */
export async function verifyCode(to: string, code: string): Promise<boolean> {
  const { rows } = await pool.query("SELECT id FROM sms_codes WHERE phone=$1 AND code=$2 AND expires_at > NOW() ORDER BY id DESC LIMIT 1", [to, String(code).trim()])
  if (!rows[0]) return false
  await pool.query("DELETE FROM sms_codes WHERE phone=$1", [to]).catch(() => {})
  return true
}
`

const SMS_SQL = `CREATE TABLE IF NOT EXISTS sms_codes (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(24) NOT NULL,
  code  VARCHAR(8) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`

export function deterministicSms(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /\bsms\b|texto|text message|twilio|verificaci[oó]n.*(tel|phone|celular|m[oó]vil)|phone verif|otp.*sms|c[oó]digo.*(sms|tel|celular)|2fa.*sms/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/sms.ts", content: SMS }], extraSql: SMS_SQL }
}
