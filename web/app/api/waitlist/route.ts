/** POST /api/waitlist — persist email; also notify via Resend if configured. */
import { NextRequest, NextResponse } from "next/server"
import { saveWaitlist, isConfigured } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const e = String(email || "").trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 })
    }

    let saved = false
    if (isConfigured()) {
      try { await saveWaitlist(e); saved = true } catch (err) { console.error("[waitlist] save:", (err as Error).message) }
    }

    const key = process.env.RESEND_API_KEY
    if (key) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.WAITLIST_FROM || "Puglit <onboarding@resend.dev>",
          to: process.env.WAITLIST_NOTIFY || "voidfundcom@gmail.com",
          subject: "🐶 New Puglit waitlist signup", html: `<p><b>${e}</b></p>`, reply_to: e,
        }),
      }).catch(() => {})
    }

    // Saved to DB OR emailed = success. Only fail if neither path is configured.
    if (!saved && !key) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
