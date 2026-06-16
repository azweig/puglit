/**
 * Puglit Spine — POST /api/auth/resend-verification
 * Re-issues a verification email for the logged-in user (no-op if already verified).
 */
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { getUserById } from "@/lib/users"
import { sendVerificationEmail } from "@/lib/auth-emails"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const session = await getAuthUser(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { allowed } = rateLimit(`resend_${session.userId}`, 3, 600000) // 3 / 10 min
  if (!allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })

  const user = await getUserById(session.userId)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.email_verified) return NextResponse.json({ ok: true, alreadyVerified: true })

  try {
    await sendVerificationEmail(user.id, user.email, user.name || "")
  } catch (e) {
    console.error("[resend-verification] failed:", (e as Error)?.message)
    return NextResponse.json({ error: "Couldn't send email" }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
