/**
 * POST /api/demo/auth { slug, action: "register"|"login", email, password, name? }
 * Functional auth for the live demos — backed by Puglit's Postgres, scoped per
 * project. Sets an httpOnly session cookie pd_<slug>. (The generated source on
 * GitHub uses its OWN env-based auth; this is only the hosted demo.)
 */
import { NextRequest, NextResponse } from "next/server"
import { registerDemo, loginDemo, signSession } from "@/lib/demo-auth"

export async function POST(request: NextRequest) {
  try {
    const { slug, action, email, password, name } = await request.json()
    if (!slug || !email || !password) return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 })

    const r = action === "login"
      ? await loginDemo(String(slug), String(email), String(password))
      : await registerDemo(String(slug), String(email), String(password), String(name || ""))

    if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 })

    const res = NextResponse.json({ ok: true, user: { email: r.session.email, name: r.session.name } })
    res.cookies.set(`pd_${slug}`, signSession(r.session), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60,
    })
    return res
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 })
  }
}
