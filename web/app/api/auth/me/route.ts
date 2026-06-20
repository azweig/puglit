/** GET /api/auth/me — the current session, or null. POST (logout) clears it. */
import { NextResponse } from "next/server"
import { getSession, clearSessionCookie } from "@/lib/auth"

export async function GET() {
  const s = await getSession()
  return NextResponse.json({ ok: true, user: s ? { email: s.email, name: s.name } : null })
}
export async function POST() {
  await clearSessionCookie()
  return NextResponse.json({ ok: true })
}
