/**
 * Puglit Spine — POST /api/auth/forgot-password
 * Sends a reset link. ALWAYS returns ok (anti-enumeration): the response is
 * identical whether or not the email exists.
 */
import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/users"
import { sendPasswordResetEmail } from "@/lib/auth-emails"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ ok: true })

    const { allowed } = rateLimit(`forgot_${String(email).toLowerCase()}`, 3, 600000)
    if (!allowed) return NextResponse.json({ ok: true }) // silent: don't leak rate state

    const user = await getUserByEmail(email)
    if (user && !user.oauth_provider) {
      await sendPasswordResetEmail(user.id, user.email, user.name || "").catch((e) =>
        console.error("[forgot-password] send failed:", (e as Error)?.message)
      )
    }
  } catch {
    /* swallow — never reveal failure shape */
  }
  return NextResponse.json({ ok: true })
}
