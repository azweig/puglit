/** GET /api/job/[id] — full job artifacts (SQL, ER diagram, links) for the build page. */
import { NextRequest, NextResponse } from "next/server"
import { getJob } from "@/lib/jobs"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJob(id)
  if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({
    ok: true, status: job.status, name: job.name, slug: job.slug,
    completion: (job as any).completion ?? 0,
    stepsDone: (job.steps || []).filter((s: any) => s.status === "done").length,
    stepsTotal: (job.steps || []).length,
    sql: job.artifacts?.sql || null,
    erd: job.artifacts?.erd || null,
    contracts: job.artifacts?.contracts || null,
    engine: job.artifacts?.engine || null,
    findings: job.artifacts?.findings || [],
    ciGreen: job.artifacts?.ciGreen ?? null,
    ciErrors: job.artifacts?.ciErrors || [],
    githubUrl: job.artifacts?.githubUrl || null,
    previewUrl: job.artifacts?.previewUrl || null,
  })
}
