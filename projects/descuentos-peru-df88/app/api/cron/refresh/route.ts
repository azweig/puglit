import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { pool } from "@/lib/db"

// Scheduled catalog refresh (ingestion / scrapers). Fire-and-forget: responds
// immediately and does the work in after() (external cron callers cap at ~30s).
// Auth: ?key= or x-cron-secret must equal CRON_SECRET. Schedule every few hours.
// Plug one ingestSource() per external source (each upserts into the catalog tables).
export const maxDuration = 300

async function refreshCatalog() {
  // TODO(per-source): for each external source the catalog comes from, fetch it and
  // UPSERT into the catalog tables (parameterized). Keep each source isolated so one
  // failing source never blocks the others. The schema + a working seed already exist.
  await pool.query("SELECT 1") // placeholder so the file is valid and DB-reachable
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const provided = request.headers.get("x-cron-secret") || request.nextUrl.searchParams.get("key")
    if (provided !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  after(async () => { try { await refreshCatalog() } catch { /* best-effort; next tick retries */ } })
  return NextResponse.json({ ok: true, scheduled: true })
}
