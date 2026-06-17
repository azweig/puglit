/**
 * Puglit Spine — GET /api/auth/magic-link/consume?token=…
 * Consumes a single-use magic token, sets the session cookie, redirects to app.
 * A successful magic sign-in also verifies the email (proves inbox ownership).
 */
import { NextRequest, NextResponse } from "next/server"
import { consumeToken, getUserById, markEmailVerified } from "@/lib/users"
import { signJWT, setAuthCookie } from "@/lib/auth"
import config from "@/domain.config"

const BASE_URL = process.env.APP_URL || `https://${config.identity.domain}`

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.redirect(`${BASE_URL}/login?magic=invalid`)

  const result = await consumeToken("magic", token)
  if (!result || !result.userId) {
    return NextResponse.redirect(`${BASE_URL}/login?magic=expired`)
  }
  const user = await getUserById(result.userId)
  if (!user) return NextResponse.redirect(`${BASE_URL}/login?magic=invalid`)

  if (!user.email_verified) await markEmailVerified(user.id)

  const jwt = await signJWT({ userId: user.id, email: user.email, plan: user.plan || "free" })
  const cookie = setAuthCookie(jwt)
  const response = NextResponse.redirect(`${BASE_URL}/?magic=1`)
  response.cookies.set(cookie.name, cookie.value, cookie.options)
  return response
}
