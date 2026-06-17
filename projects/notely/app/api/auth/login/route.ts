/**
 * Puglit Spine — POST /api/auth/login
 * Email + password. Rate-limited per-email. OAuth-only accounts are told to use
 * their provider button instead of failing with a generic "invalid credentials".
 */
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getUserByEmail } from "@/lib/users"
import { signJWT, setAuthCookie } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const { allowed } = rateLimit(`login_${String(email).toLowerCase()}`, 5, 60000)
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 })
    }

    const user = await getUserByEmail(email)
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    if (user.oauth_provider) {
      return NextResponse.json(
        { error: `This account was created with ${user.oauth_provider}. Use that button to sign in.` },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await signJWT({ userId: user.id, email: user.email, plan: user.plan || "free" })
    const cookie = setAuthCookie(token)
    const response = NextResponse.json({
      user: {
        id: user.id, email: user.email, name: user.name, plan: user.plan,
        subscriptionEnd: user.subscription_end, emailVerified: !!user.email_verified,
      },
    })
    response.cookies.set(cookie.name, cookie.value, cookie.options)
    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 })
  }
}
