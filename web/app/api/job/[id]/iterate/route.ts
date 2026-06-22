import { NextRequest, NextResponse } from "next/server"
import { getJob } from "@/lib/jobs"
import { canAccessJob } from "@/lib/auth"
import { query } from "@/lib/db"
import { iterateApp } from "@/lib/iterate"

export const maxDuration = 300

/** POST /api/job/[id]/iterate { request } — #4 surgically apply a change to the generated app. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await canAccessJob(id, request))) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const job = await getJob(id)
  const appFiles = (job?.artifacts as { appFiles?: { path: string; content: string }[] } | undefined)?.appFiles
  if (!appFiles?.length) return NextResponse.json({ error: "no_app" }, { status: 404 })
  const body = await request.json().catch(() => ({}))
  const req = String(body?.request || "").trim()
  if (req.length < 4) return NextResponse.json({ error: "request_too_short" }, { status: 400 })
  const res = await iterateApp(appFiles, req)
  await query("UPDATE puglit_jobs SET artifacts = jsonb_set(COALESCE(artifacts,'{}'::jsonb), '{appFiles}', $2::jsonb), updated_at=NOW() WHERE id=$1", [id, JSON.stringify(res.files)]).catch(() => {})
  return NextResponse.json({ ok: true, changed: res.changed, note: res.note })
}
