/**
 * Puglit Spine — GET /api/auth/verify-email?token=…
 * Consumes a single-use verify token and redirects to the app with a flag.
 */
import { NextRequest, NextResponse } from "next/server"
import { consumeToken, markEmailVerified } from "@/lib/users"
import config from "@/domain.config"

const BASE_URL = process.env.APP_URL || `https://${config.identity.domain}`

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.redirect(`${BASE_URL}/?verified=invalid`)

  const result = await consumeToken("verify", token)
  if (!result || !result.userId) {
    return NextResponse.redirect(`${BASE_URL}/?verified=expired`)
  }
  await markEmailVerified(result.userId)
  return NextResponse.redirect(`${BASE_URL}/?verified=1`)
}
