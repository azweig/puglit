/**
 * I'm Still Alive — notify.ts
 * Multi-channel delivery: email (Resend via lib/mailer), SMS + WhatsApp (Twilio).
 * Degrades gracefully: if a channel's credentials aren't configured it returns
 * {sent:false, reason:"not_configured"} instead of throwing — so the flow works
 * and the dashboard can show exactly what needs a key.
 */
import { sendEmail } from "@/lib/mailer"

export type Channel = "email" | "sms" | "whatsapp"

export async function notify(channel: Channel, contact: string, subject: string, body: string): Promise<{ sent: boolean; reason?: string }> {
  try {
    if (channel === "email") {
      if (!process.env.RESEND_API_KEY) return { sent: false, reason: "not_configured" }
      await sendEmail(contact, subject, `<div style="font-family:system-ui,sans-serif;line-height:1.6">${body.replace(/\n/g, "<br/>")}</div>`)
      return { sent: true }
    }
    // sms / whatsapp via Twilio
    const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM
    if (!sid || !token || !from) return { sent: false, reason: "not_configured" }
    const wa = channel === "whatsapp"
    const params = new URLSearchParams({
      From: wa ? `whatsapp:${from}` : from,
      To: wa ? `whatsapp:${contact}` : contact,
      Body: `${subject}\n\n${body}`,
    })
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })
    if (!res.ok) return { sent: false, reason: "send_failed" }
    return { sent: true }
  } catch {
    return { sent: false, reason: "send_failed" }
  }
}
