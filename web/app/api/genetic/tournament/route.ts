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
import { getSession } from "@/lib/auth"
import { createJob } from "@/lib/jobs"

function jid() { return Array.from({ length: 16 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("") }

type JobState = { status: "running" | "done" | "error"; phase: string; stage?: string; team?: string; model?: string; startedAt: number; result?: any; error?: string }
// module-scoped: persists across requests within the single persistent `next start` process
const JOBS: Map<string, JobState> = (globalThis as any).__puglitTournJobs || ((globalThis as any).__puglitTournJobs = new Map())
let LAST_JOB: string | null = (globalThis as any).__puglitLastJob ?? null

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const status = sp.get("status")
    if (status) {
      const j = JOBS.get(status)
      return NextResponse.json(j ? { ok: true, jobId: status, ...j } : { ok: true, jobId: status, status: "unknown" })
    }
    // ?live — the most recent tournament's live state (for the 2.5D campus to animate)
    if (sp.get("live") !== null) {
      const id = (globalThis as any).__puglitLastJob || LAST_JOB
      const j = id ? JOBS.get(id) : null
      return NextResponse.json(j ? { ok: true, jobId: id, status: j.status, stage: j.stage || null, team: j.team || null, phase: j.phase, model: j.model || null, winner: j.result?.winner || null, leveledUp: j.result?.leveledUp || [], designs: j.result?.designs || [] } : { ok: true, status: "idle" })
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
    const session = await getSession() // the user who launched it → owns the auto-built project
    const config = generateConfig(a as IntakeAnswers)
    const jobId = a.jobId || jid()
    JOBS.set(jobId, { status: "running", phase: "Estudiando el producto de referencia…", stage: "study", startedAt: Date.now() })
    LAST_JOB = jobId; (globalThis as any).__puglitLastJob = jobId

    // fire-and-forget — keeps running on the server even if the client disconnects
    void Promise.resolve().then(async () => {
      try {
        const reference = a.reference || (await studyReference(config).catch(() => "")) || ""
        const r = await runDivergence(jobId, config, "", reference, (p) => {
          const j = JOBS.get(jobId); if (j) { j.phase = p.label; j.stage = p.stage; j.team = p.team; j.model = p.model }
        })
        // AUTO-BUILD the winner (no manual button): create a build job owned by the launcher,
        // seeded with the winning blueprint. The watchdog drives it → it lands in /projects.
        let buildJobId: string | null = null
        if (r.ok && r.winnerBlueprint) {
          const ans = { ...(a as IntakeAnswers), benefits: [], modules: [], price: 0, languages: "es" as const, email: session?.email || "" }
          buildJobId = await createJob({ answers: ans, branding: null, winnerBlueprint: r.winnerBlueprint, tournament: { designs: r.designs, winner: r.winner }, userEmail: session?.email || null }).catch(() => null)
        }
        JOBS.set(jobId, { status: "done", phase: "Terminado", stage: "done", startedAt: JOBS.get(jobId)?.startedAt || Date.now(), result: { jobId, referenceUsed: !!reference, buildJobId, ...r } })
      } catch (e) {
        JOBS.set(jobId, { status: "error", phase: "Error", stage: "error", startedAt: JOBS.get(jobId)?.startedAt || Date.now(), error: (e as Error).message })
      }
    })

    return NextResponse.json({ ok: true, jobId, status: "running" })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
