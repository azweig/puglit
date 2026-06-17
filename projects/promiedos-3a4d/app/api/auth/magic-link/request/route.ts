/**
 * Puglit Spine — POST /api/auth/magic-link/request { email }
 * Passwordless sign-in. ALWAYS returns ok (anti-enumeration). Only emails
 * existing accounts — magic links don't create users (register does that).
 */
import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/users"
import { sendMagicLinkEmail } from "@/lib/auth-emails"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ ok: true })

    const { allowed } = rateLimit(`magic_${String(email).toLowerCase()}`, 3, 600000)
    if (!allowed) return NextResponse.json({ ok: true })

    const user = await getUserByEmail(email)
    if (user) {
      await sendMagicLinkEmail(user.id, user.email).catch((e) =>
        console.error("[magic-link] send failed:", (e as Error)?.message)
      )
    }
  } catch {
    /* swallow */
  }
  return NextResponse.json({ ok: true })
}
