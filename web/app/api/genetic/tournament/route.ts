/**
 * POST /api/genetic/tournament — run iteration 1 (divergence) of the genetic tournament:
 * the 3 teams each design a blueprint through their philosophy, a judge picks the winner.
 * Body: the intake answers (name, what, audience, …) like /api/job/create.
 * Returns the winner + per-team scores; persists rounds to puglit_rounds.
 */
import { NextRequest, NextResponse } from "next/server"
import { generateConfig, type IntakeAnswers } from "@/lib/generate"
import { studyReference } from "@/lib/app-builder"
import { runDivergence } from "@/lib/tournament"
import { query } from "@/lib/db"

function jid() { return Array.from({ length: 16 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("") }

/** GET — the latest tournament's iteration-1 rounds (for the visual). ?jobId= for a specific one. */
export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get("jobId")
    const job = jobId || (await query(`SELECT job_id FROM puglit_rounds WHERE iteration=1 ORDER BY id DESC LIMIT 1`)).rows[0]?.job_id
    if (!job) return NextResponse.json({ ok: true, jobId: null, teams: [] })
    const { rows } = await query(
      `SELECT team, score, winner, notes, artifacts->'metrics' AS metrics, artifacts->'blueprint'->'summary' AS summary,
              (SELECT json_agg(t->>'name') FROM jsonb_array_elements(artifacts->'blueprint'->'tables') t) AS tables
       FROM puglit_rounds WHERE job_id=$1 AND iteration=1 ORDER BY team`, [job])
    return NextResponse.json({ ok: true, jobId: job, teams: rows })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const a = (await request.json()) as Partial<IntakeAnswers> & { jobId?: string; reference?: string }
    if (!a?.name) return NextResponse.json({ ok: false, error: "name required" }, { status: 400 })
    const config = generateConfig(a as IntakeAnswers)
    const jobId = a.jobId || jid()
    // Fidelity bar: study the real reference product first so every team designs to its
    // actual surfaces (depth) instead of a shallow sketch.
    const reference = a.reference || (await studyReference(config).catch(() => "")) || ""
    const r = await runDivergence(jobId, config, "", reference)
    return NextResponse.json({ jobId, referenceUsed: !!reference, ...r })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
