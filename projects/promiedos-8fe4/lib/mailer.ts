/**
 * Puglit Spine — mailer.ts
 * Minimal transactional sender used by the auth module. Uses Resend when
 * RESEND_API_KEY is set, otherwise logs to the console (dev). The full
 * email-lifecycle module (tracking, bounce poller, drip) overrides this
 * with sendTrackedEmail when enabled — auth only needs a reliable primitive.
 */
import config from "@/domain.config"

const FROM = process.env.EMAIL_FROM || `${config.identity.name} <onboarding@resend.dev>`

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log(`[mailer:dev] → ${to} :: ${subject}`)
    return
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text().catch(() => "")}`)
  }
}
