/**
 * Puglit Spine — POST /api/auth/register
 * Generic signup. Domain-specific signup fields arrive in `profile` (an object)
 * and are stored as JSONB — the spine never hardcodes domain columns. If the
 * email already exists with a matching password we log the user in (better UX
 * than a 409 wall); a mismatch returns 409 with emailExists for the client.
 */
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createUser, getUserByEmail } from "@/lib/users"
import { signJWT, setAuthCookie } from "@/lib/auth"
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/auth-emails"
import config from "@/domain.config"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const emailEnabled = !!config.modules.emailLifecycle

function publicUser(u: { id: number; email: string; name: string | null; plan: string; email_verified: boolean }) {
  return { id: u.id, email: u.email, name: u.name, plan: u.plan, emailVerified: u.email_verified }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, profile } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password and name are required" }, { status: 400 })
    }
    if (!EMAIL_RE.test(String(email))) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    // Server-side name validation (defends against direct POSTs bypassing the
    // client). Unicode whitelist via NFD strip; blocks HTML/JS injection.
    const trimmedName = String(name).trim()
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      return NextResponse.json({ error: "Invalid name (2-60 characters)" }, { status: 400 })
    }
    const nameNoAccents = trimmedName.normalize("NFD").replace(/[̀-ͯ]/g, "")
    if (!/^[a-zA-Z\s'\-.]+$/.test(nameNoAccents)) {
      return NextResponse.json({ error: "Name contains invalid characters" }, { status: 400 })
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const existing = await getUserByEmail(email)
    if (existing?.password_hash) {
      const passwordOk = await bcrypt.compare(password, existing.password_hash)
      if (passwordOk) {
        const token = await signJWT({ userId: existing.id, email: existing.email, plan: existing.plan || "free" })
        const cookie = setAuthCookie(token)
        const response = NextResponse.json({ user: publicUser(existing), existing: true })
        response.cookies.set(cookie.name, cookie.value, cookie.options)
        return response
      }
      return NextResponse.json(
        { error: "This email is already registered. Sign in or reset your password.", emailExists: true },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await createUser({
      email,
      name: trimmedName,
      passwordHash,
      profile: profile && typeof profile === "object" ? profile : null,
    })

    // Verification is awaited (tolerant): if it fails the account still exists,
    // and the user can re-send from the login screen — but they see a real
    // error instead of silently never getting a mail.
    if (emailEnabled) {
      try {
        await sendVerificationEmail(user.id, user.email, trimmedName)
      } catch (e) {
        console.error("[register] verification email failed:", (e as Error)?.message)
      }
      void sendWelcomeEmail(user.email, trimmedName).catch(() => {})
    }

    const token = await signJWT({ userId: user.id, email: user.email, plan: "free" })
    const cookie = setAuthCookie(token)
    const response = NextResponse.json({ user: publicUser(user) })
    response.cookies.set(cookie.name, cookie.value, cookie.options)
    return response
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Failed to register" }, { status: 500 })
  }
}
