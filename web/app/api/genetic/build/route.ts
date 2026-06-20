/**
 * POST /api/genetic/build — iteration 3: take the genetic tournament's WINNING blueprint
 * and build it into a real, runnable app (the winning team's design becomes code).
 *
 * Reads the winning blueprint from puglit_rounds, then creates a normal build job with that
 * blueprint INJECTED (jobs.ts → initEngineStateWith), so the pipeline skips planning and
 * builds the winner's design. Returns { jobId } — drive it with build-local.mjs (serves on a
 * port) or watch /build/[id]. Body: the same answers as the tournament (name/what/...).
 */
import { NextRequest, NextResponse } from "next/server"
import { createJob } from "@/lib/jobs"
import { query } from "@/lib/db"
import { isConfigured } from "@/lib/db"
import type { IntakeAnswers } from "@/lib/generate"

export async function POST(request: NextRequest) {
  if (!isConfigured()) return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 })
  try {
    const a = (await request.json().catch(() => ({}))) as Partial<IntakeAnswers> & { jobId?: string }
    const { rows } = await query<{ team: string; artifacts: any }>(
      `SELECT team, artifacts FROM puglit_rounds
       WHERE ${a.jobId ? "job_id=$1 AND " : ""}iteration=1 AND winner=true
       ORDER BY id DESC LIMIT 1`,
      a.jobId ? [a.jobId] : [],
    )
    const win = rows[0]
    if (!win?.artifacts?.blueprint) return NextResponse.json({ ok: false, error: "no hay blueprint ganador — corré un torneo primero" }, { status: 400 })

    const bp = win.artifacts.blueprint
    const answers: IntakeAnswers = {
      name: String(a.name || "App").slice(0, 60),
      what: String(a.what || bp.summary || "").slice(0, 240),
      audience: String(a.audience || "usuarios").slice(0, 120),
      benefits: [],
      color: String(a.color || "#7C3AED"),
      languages: (["es", "en", "both"].includes(String(a.languages)) ? a.languages : "es") as IntakeAnswers["languages"],
      monetization: (["free", "freemium", "subscription"].includes(String(a.monetization)) ? a.monetization : "free") as IntakeAnswers["monetization"],
      price: Number(a.price) || 0,
      modules: [],
      email: String(a.email || "").slice(0, 255),
    }
    const id = await createJob({ answers, branding: null, winnerBlueprint: bp })
    return NextResponse.json({ ok: true, jobId: id, builtFrom: win.team, watch: `/build/${id}` })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
