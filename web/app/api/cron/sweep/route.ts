/**
 * GET /api/cron/sweep — the watchdog. Promotes queued jobs under the concurrency
 * cap, recovers stuck steps (timeout → retry), and advances running jobs even if
 * no one has the build page open. Schedule it every minute (cron-job.org / Vercel
 * cron). Auth: header `x-cron-secret` or ?key= must match CRON_SECRET (if set).
 *
 * FIRE-AND-FORGET: cron-job.org caps requests at ~30s, but sweep()'s job advances
 * (LLM calls, CI polling) can run longer. So we respond 200 immediately and run the
 * sweep in `after()` — Next's post-response hook keeps the function alive up to
 * maxDuration. On Vercel serverless `void promise.then()` would be killed at response;
 * `after()` is the platform-correct equivalent of the project's fire-and-forget rule.
 */
import { NextRequest, NextResponse, after } from "next/server"
import { sweep } from "@/lib/jobs"
import { isConfigured } from "@/lib/db"

export const maxDuration = 300

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const provided = request.headers.get("x-cron-secret") || request.nextUrl.searchParams.get("key")
    if (provided !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!isConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 })
  after(async () => { try { await sweep() } catch { /* watchdog: best-effort, next tick retries */ } })
  return NextResponse.json({ ok: true, scheduled: true })
}
