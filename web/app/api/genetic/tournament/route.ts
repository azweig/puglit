/**
 * Genetic tournament API — runs iteration 1 (divergence): the 3 teams each design a
 * blueprint through their philosophy + model, the Grand Jury scores per area, a winner is
 * picked, and the evolutionary RPG rewards (XP/levels/diary) are awarded.
 *
 * Runs in the BACKGROUND on the persistent server so it survives the browser/terminal
 * disconnecting (fire-and-forget; status polled from an in-memory map).
 *   POST            → start a tournament, returns { jobId } immediately
 *   GET ?status=ID  → live status/phase + result of a running/finished tournament
 *   GET             → latest persisted tournament (for the /tournament visual)
 */
import { NextRequest, NextResponse } from "next/server"
import { generateConfig, type IntakeAnswers } from "@/lib/generate"
import { studyReference } from "@/lib/app-builder"
import { runDivergence } from "@/lib/tournament"
import { query } from "@/lib/db"

function jid() { return Array.from({ length: 16 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("") }

type JobState = { status: "running" | "done" | "error"; phase: string; startedAt: number; result?: unknown; error?: string }
// module-scoped: persists across requests within the single persistent `next start` process
const JOBS: Map<string, JobState> = (globalThis as any).__puglitTournJobs || ((globalThis as any).__puglitTournJobs = new Map())

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const status = sp.get("status")
    if (status) {
      const j = JOBS.get(status)
      return NextResponse.json(j ? { ok: true, jobId: status, ...j } : { ok: true, jobId: status, status: "unknown" })
    }
    const jobId = sp.get("jobId")
    const job = jobId || (await query<{ job_id: string }>(`SELECT job_id FROM puglit_rounds WHERE iteration=1 ORDER BY id DESC LIMIT 1`)).rows[0]?.job_id
    if (!job) return NextResponse.json({ ok: true, jobId: null, teams: [] })
    const { rows } = await query(
      `SELECT team, score, winner, notes, artifacts->'metrics' AS metrics, artifacts->>'model' AS model, artifacts->'areas' AS areas, artifacts->'blueprint'->'summary' AS summary
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
    JOBS.set(jobId, { status: "running", phase: "Estudiando el producto de referencia…", startedAt: Date.now() })

    // fire-and-forget — keeps running on the server even if the client disconnects
    void Promise.resolve().then(async () => {
      try {
        const reference = a.reference || (await studyReference(config).catch(() => "")) || ""
        const r = await runDivergence(jobId, config, "", reference, (p) => {
          const j = JOBS.get(jobId); if (j) j.phase = p
        })
        JOBS.set(jobId, { status: "done", phase: "Terminado", startedAt: JOBS.get(jobId)?.startedAt || Date.now(), result: { jobId, referenceUsed: !!reference, ...r } })
      } catch (e) {
        JOBS.set(jobId, { status: "error", phase: "Error", startedAt: JOBS.get(jobId)?.startedAt || Date.now(), error: (e as Error).message })
      }
    })

    return NextResponse.json({ ok: true, jobId, status: "running" })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
