/** POST /api/job/create — start a generation job; returns { id } for /build/[id]. */
import { NextRequest, NextResponse } from "next/server"
import { createJob } from "@/lib/jobs"
import { isConfigured } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { IntakeAnswers } from "@/lib/generate"

export async function POST(request: NextRequest) {
  if (!isConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 })
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "auth_required" }, { status: 401 })
  try {
    const a = await request.json()
    if (!a.name || !a.what) return NextResponse.json({ error: "missing" }, { status: 400 })
    const answers: IntakeAnswers = {
      name: String(a.name).slice(0, 60),
      what: String(a.what).slice(0, 240),
      audience: String(a.audience || "").slice(0, 120),
      benefits: (Array.isArray(a.benefits) ? a.benefits : []).map((b: unknown) => String(b).slice(0, 80)).filter(Boolean).slice(0, 3),
      color: String(a.color || a.branding?.primaryColor || "#7C3AED"),
      languages: (["es", "en", "both"].includes(String(a.languages)) ? a.languages : "en") as IntakeAnswers["languages"],
      monetization: (["free", "freemium", "subscription"].includes(String(a.monetization)) ? a.monetization : "freemium") as IntakeAnswers["monetization"],
      price: Number(a.price) || 0,
      modules: Array.isArray(a.modules) ? a.modules.map(String) : [],
      email: String(a.email || "").slice(0, 255),
      references: a.references ? String(a.references).slice(0, 8000) : undefined,
      archetype: a.archetype ? String(a.archetype).slice(0, 40) : undefined,
    }
    const id = await createJob({ answers, branding: a.branding, chosenLanding: a.landingHtml, creds: a.creds, userEmail: session.email })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    console.error("[job/create]", (e as Error).message)
    return NextResponse.json({ error: "create_failed" }, { status: 500 })
  }
}
