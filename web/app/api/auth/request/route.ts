/** POST /api/auth/request {email} — send a 6-digit login code by email (passwordless). */
import { NextRequest, NextResponse } from "next/server"
import { requestLoginCode } from "@/lib/auth"
import { sendLoginCode } from "@/lib/mail"

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json().catch(() => ({}))) as { email?: string }
    if (!email || !EMAIL.test(email)) return NextResponse.json({ ok: false, error: "email inválido" }, { status: 400 })
    const code = await requestLoginCode(email)
    const sent = await sendLoginCode(email, code)
    // beta: if no email provider is configured, return the code so you can test (NEVER when email works)
    return NextResponse.json({ ok: true, sent, ...(sent ? {} : { devCode: code }) })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
