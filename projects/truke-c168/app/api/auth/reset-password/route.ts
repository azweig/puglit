/**
 * Puglit Spine — POST /api/auth/reset-password { token, password }
 * Consumes a single-use reset token, sets the new password hash, and logs in.
 */
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { consumeToken, getUserById, setPasswordHash } from "@/lib/users"
import { signJWT, setAuthCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const result = await consumeToken("reset", token)
    if (!result || !result.userId) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)
    await setPasswordHash(result.userId, hash)

    const user = await getUserById(result.userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 400 })

    const jwt = await signJWT({ userId: user.id, email: user.email, plan: user.plan || "free" })
    const cookie = setAuthCookie(jwt)
    const response = NextResponse.json({ ok: true })
    response.cookies.set(cookie.name, cookie.value, cookie.options)
    return response
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
