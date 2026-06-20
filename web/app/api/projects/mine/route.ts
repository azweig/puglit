/** GET /api/projects/mine — the logged-in user's own builds (history). */
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { listUserJobs } from "@/lib/jobs"

export async function GET() {
  const s = await getSession()
  if (!s) return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 })
  const jobs = await listUserJobs(s.email).catch(() => [])
  return NextResponse.json({ ok: true, email: s.email, jobs })
}
