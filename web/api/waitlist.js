/**
 * Puglit waitlist — Vercel serverless function.
 * Captures an email and notifies the founder inbox via Resend.
 * Honest fallback: if RESEND_API_KEY isn't set we return 503 (not a fake 200),
 * so the homepage shows the "star us on GitHub, we'll open soon" message
 * instead of silently dropping signups. Set RESEND_API_KEY (and optionally
 * WAITLIST_NOTIFY) in the Vercel project env to start delivering.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" })
    return
  }

  let body = req.body
  if (typeof body === "string") {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  const email = (body && body.email ? String(body.email) : "").trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: "invalid_email" })
    return
  }

  const key = process.env.RESEND_API_KEY
  const notify = process.env.WAITLIST_NOTIFY || "voidfundcom@gmail.com"
  const from = process.env.WAITLIST_FROM || "Puglit <onboarding@resend.dev>"

  if (!key) {
    // Not configured yet — tell the truth rather than fake success.
    res.status(503).json({ ok: false, reason: "not_configured" })
    return
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: notify,
        subject: `🐶 New Puglit waitlist signup`,
        html: `<p>New waitlist signup:</p><p><b>${email}</b></p>`,
        reply_to: email,
      }),
    })
    if (!r.ok) throw new Error(`resend_${r.status}`)
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(502).json({ ok: false, error: "send_failed" })
  }
}
