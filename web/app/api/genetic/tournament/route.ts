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

function jid() { return Array.from({ length: 16 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("") }

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
