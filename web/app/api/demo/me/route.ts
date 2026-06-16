/** GET /api/demo/me?slug=… — current demo user (from the pd_<slug> cookie). */
import { NextRequest, NextResponse } from "next/server"
import { readSession } from "@/lib/demo-auth"

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") || ""
  const s = readSession(request.cookies.get(`pd_${slug}`)?.value)
  if (!s || s.slug !== slug) return NextResponse.json({ user: null })
  return NextResponse.json({ user: { email: s.email, name: s.name } })
}

export async function POST(request: NextRequest) {
  // logout
  const slug = (await request.json().catch(() => ({}))).slug || ""
  const res = NextResponse.json({ ok: true })
  res.cookies.set(`pd_${slug}`, "", { path: "/", maxAge: 0 })
  return res
}
