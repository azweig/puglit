/** POST /api/job/[id]/advance — run the next pending step; returns the job. */
import { NextRequest, NextResponse } from "next/server"
import { advanceJob } from "@/lib/jobs"
import { canAccessJob } from "@/lib/auth"

export const maxDuration = 300

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await canAccessJob(id, request))) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const job = await advanceJob(id)
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ ok: true, status: job.status, steps: job.steps, artifacts: { githubUrl: job.artifacts?.githubUrl, previewUrl: job.artifacts?.previewUrl, hasSql: !!job.artifacts?.sql, hasErd: !!job.artifacts?.erd }, name: job.name, slug: job.slug })
}
