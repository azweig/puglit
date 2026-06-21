/**
 * Compile & export a delivered project to the USER's own accounts (BYO).
 *   POST {jobId, githubToken?, vercelToken?, repo?} → spawns build-local in EXPORT_ONLY mode
 *        (assemble + tsc-repair + deploy.sh github/vercel), runs in the background.
 *   GET ?jobId → status { status, githubUrl, vercelUrl }.
 * Tokens are passed straight to the child process env and NEVER stored. Owner-only.
 */
import { NextRequest, NextResponse } from "next/server"
import { spawn } from "node:child_process"
import { writeFileSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { getSession, canAccessJob } from "@/lib/auth"

const statusFile = (jobId: string) => join("/tmp", `puglit-export-${jobId.replace(/[^a-z0-9]/gi, "")}.json`)

export async function GET(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 })
  const jobId = request.nextUrl.searchParams.get("jobId")
  if (!jobId) return NextResponse.json({ ok: false, error: "jobId required" }, { status: 400 })
  const sf = statusFile(jobId)
  if (!existsSync(sf)) return NextResponse.json({ ok: true, status: "idle" })
  try { return NextResponse.json({ ok: true, ...JSON.parse(readFileSync(sf, "utf8")) }) }
  catch { return NextResponse.json({ ok: true, status: "running" }) }
}

export async function POST(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 })
  const { jobId, githubToken, vercelToken, repo } = (await request.json().catch(() => ({}))) as { jobId?: string; githubToken?: string; vercelToken?: string; repo?: string }
  if (!jobId) return NextResponse.json({ ok: false, error: "jobId required" }, { status: 400 })
  if (!(await canAccessJob(jobId, request))) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  if (!githubToken && !vercelToken) return NextResponse.json({ ok: false, error: "dame al menos un token (GitHub y/o Vercel)" }, { status: 400 })

  const sf = statusFile(jobId)
  writeFileSync(sf, JSON.stringify({ status: "starting" }))
  // pass the script + root via env so Turbopack's file-tracer doesn't try to resolve the
  // spawned .mjs as a bundled module (it would fail the build). The shell command is static.
  const child = spawn("bash", ["-c", 'exec node "$PUGLIT_BUILD_SCRIPT" "$PUGLIT_REPO_ROOT"'], {
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      PUGLIT_BUILD_SCRIPT: join(process.cwd(), "scripts", "build-local.mjs"),
      PUGLIT_REPO_ROOT: join(process.cwd(), ".."),
      JOB_ID: jobId, EXPORT_ONLY: "1", EXPORT_STATUS_FILE: sf, EXPORT_REPO: repo || "",
      GH_TOKEN: githubToken || "", VERCEL_TOKEN: vercelToken || "",
      PG_PORT: process.env.PG_PORT || "5432", BASE: "http://localhost:3000", SLUG: `export-${jobId}`,
      PUGLIT_SERVICE_TOKEN: process.env.PUGLIT_SERVICE_TOKEN || "puglit-local-service",
    },
  })
  child.unref()
  return NextResponse.json({ ok: true, status: "running" })
}
