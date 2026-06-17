/**
 * Puglit web — ci.ts
 * Drives the REAL verification loop against GitHub Actions: dispatch the
 * verify-generated workflow, read the run status + the tsc errors (as check-run
 * annotations), and let the Fixer repair the offending files against the REAL
 * compiler errors, then re-push. The build job's ci-verify step orchestrates this.
 */
import { chatJSON } from "@/lib/openai"

const GH = "https://api.github.com"
const OWNER = "azweig", REPO = "puglit", WF = "verify-generated.yml"
const h = () => ({ Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "puglit-ci" })
async function gh(path: string, init?: RequestInit) {
  const r = await fetch(`${GH}${path}`, { ...init, headers: { ...h(), ...(init?.headers || {}) } })
  if (r.status === 204) return {}
  if (!r.ok) throw new Error(`gh ${r.status} ${path}: ${(await r.text().catch(() => "")).slice(0, 160)}`)
  return r.json()
}

export interface CiError { path: string; line: number; message: string }

export async function dispatchCi(slug: string): Promise<void> {
  await gh(`/repos/${OWNER}/${REPO}/actions/workflows/${WF}/dispatches`, { method: "POST", body: JSON.stringify({ ref: "main", inputs: { project: slug } }) })
}

/** Newest run of the verify workflow. */
export async function latestRun(): Promise<{ id: number; status: string; conclusion: string | null; head_sha: string; created_at: string } | null> {
  const d = await gh(`/repos/${OWNER}/${REPO}/actions/workflows/${WF}/runs?per_page=1`)
  const run = d.workflow_runs?.[0]
  return run ? { id: run.id, status: run.status, conclusion: run.conclusion, head_sha: run.head_sha, created_at: run.created_at } : null
}

export async function getRun(id: number): Promise<{ status: string; conclusion: string | null; head_sha: string } | null> {
  try { const r = await gh(`/repos/${OWNER}/${REPO}/actions/runs/${id}`); return { status: r.status, conclusion: r.conclusion, head_sha: r.head_sha } } catch { return null }
}

/** Raw plaintext logs of a run's first job (follows the signed-URL redirect). */
async function jobLog(runId: number): Promise<string> {
  const jobs = await gh(`/repos/${OWNER}/${REPO}/actions/runs/${runId}/jobs`)
  const jid = jobs.jobs?.[0]?.id
  if (!jid) return ""
  // The logs endpoint 302s to a signed blob URL that must be fetched WITHOUT our auth header.
  const r1 = await fetch(`${GH}/repos/${OWNER}/${REPO}/actions/jobs/${jid}/logs`, { headers: h(), redirect: "manual" })
  const loc = r1.headers.get("location")
  const r2 = loc ? await fetch(loc) : r1
  return r2.ok ? await r2.text() : ""
}

/**
 * REAL tsc errors of a finished run, parsed straight from the job logs.
 * tsc runs with `cd projects/<slug>`, so its paths are relative — we prefix them.
 * Far more reliable than check-run annotations (which mix in workflow-level noise).
 */
export async function runErrors(runId: number, slug: string): Promise<CiError[]> {
  const log = await jobLog(runId)
  if (!log) return []
  const re = /([^\s(]+\.tsx?)\((\d+),\d+\):\s*error TS\d+:\s*(.+?)\s*$/gm
  const seen = new Set<string>(), out: CiError[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(log))) {
    let p = m[1].replace(/^\.\//, "")
    if (!p.startsWith("projects/")) p = `projects/${slug}/${p}`
    const key = `${p}:${m[2]}:${m[3]}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ path: p, line: Number(m[2]), message: m[3] })
  }
  return out
}

/** Fixer: repair each errored file against the REAL tsc errors, push it back. */
export async function fixFiles(errors: CiError[]): Promise<{ fixed: string[] }> {
  const byFile = new Map<string, string[]>()
  for (const e of errors) { if (!e.path) continue; (byFile.get(e.path) || byFile.set(e.path, []).get(e.path)!).push(`${e.path}(${e.line}): ${e.message}`) }
  const fixed: string[] = []
  for (const [path, errs] of [...byFile].slice(0, 3)) {
    try {
      const cur = await gh(`/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}?ref=main`)
      const code = Buffer.from(cur.content, "base64").toString("utf8")
      const out = (await chatJSON([
        { role: "system", content: `You are the Fixer. Repair this file so the TypeScript compiler errors below are gone. Make MINIMAL surgical changes; do not change behavior or break other files. Return ONLY JSON {"code":"<full corrected file>"}.` },
        { role: "user", content: `FILE ${path}:\n${code}\n\nReal tsc errors:\n${errs.join("\n")}` },
      ], { model: "gpt-4o", temperature: 0.1 })) as { code?: string }
      if (out.code && out.code !== code) {
        await gh(`/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}`, { method: "PUT", body: JSON.stringify({ message: `fix(ci): repair tsc errors in ${path.split("/").pop()}`, content: Buffer.from(out.code).toString("base64"), sha: cur.sha, branch: "main" }) })
        fixed.push(path)
      }
    } catch { /* skip this file */ }
  }
  return { fixed }
}
