/** POST /api/auth/verify {email, code} — verify the code and start a session. */
import { NextRequest, NextResponse } from "next/server"
import { verifyLoginCode, setSessionCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = (await request.json().catch(() => ({}))) as { email?: string; code?: string }
    if (!email || !code) return NextResponse.json({ ok: false, error: "faltan datos" }, { status: 400 })
    const session = await verifyLoginCode(email, code)
    if (!session) return NextResponse.json({ ok: false, error: "código inválido o vencido" }, { status: 401 })
    await setSessionCookie(session)
    return NextResponse.json({ ok: true, email: session.email })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
