/**
 * GET /api/cron/sweep — the watchdog. Promotes queued jobs under the concurrency
 * cap, recovers stuck steps (timeout → retry), and advances running jobs even if
 * no one has the build page open. Schedule it every minute (cron-job.org / Vercel
 * cron). Auth: header `x-cron-secret` or ?key= must match CRON_SECRET (if set).
 */
import { NextRequest, NextResponse } from "next/server"
import { sweep } from "@/lib/jobs"
import { isConfigured } from "@/lib/db"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const provided = request.headers.get("x-cron-secret") || request.nextUrl.searchParams.get("key")
    if (provided !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!isConfigured()) return NextResponse.json({ error: "db_not_configured" }, { status: 503 })
  const result = await sweep()
  return NextResponse.json({ ok: true, ...result })
}
