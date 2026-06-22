/**
 * brain-insights.ts — mine the brain into actionable signal.
 *  #10 brainDigest(): top patterns / failures / trends (for the dashboard + the report).
 *  #11 antiPatterns(): the recurring HIGH-severity mistakes, as a compact "AVOID" line injected into
 *      the dev prompts so the swarm stops repeating known errors.
 */
import { query } from "@/lib/db"

const ISSUE_RULE: Record<string, string> = {
  "phantom-table": "declare EVERY table you query in the schema — no phantom tables",
  "sql-injection": "ALWAYS parameterized SQL ($1,$2…) — never string-interpolate user input",
  "hardcoded-secret": "never hardcode keys/tokens — read them from process.env",
  "dangerous-exec": "no eval / new Function / child_process",
  "xss": "sanitize before dangerouslySetInnerHTML",
  "hardcoded-credential": "credentials come from process.env, never string literals",
  "missing-import": "only import @/lib/* files that actually exist",
}

let apCache = { text: "", at: 0 }
/** #11 — recurring HIGH issue kinds (last 30d) as an AVOID line. 5-min cached. */
export async function antiPatterns(): Promise<string> {
  if (Date.now() - apCache.at < 5 * 60_000) return apCache.text
  try {
    const { rows } = await query<{ kind: string; n: number }>(
      `SELECT k AS kind, count(*)::int n
         FROM puglit_metrics, jsonb_array_elements_text(COALESCE(meta->'kinds','[]'::jsonb)) k
        WHERE name='build_success' AND created_at > NOW() - interval '30 days'
        GROUP BY k ORDER BY n DESC LIMIT 6`)
    const top = rows.filter((r) => r.n >= 2).map((r) => ISSUE_RULE[r.kind] || r.kind)
    apCache = { text: top.length ? `AVOID these recurring mistakes (from past builds): ${top.join("; ")}.` : "", at: Date.now() }
    return apCache.text
  } catch { return apCache.text }
}

export type BrainDigest = {
  builds: number; cleanRate: number; modules: number
  topIssues: { kind: string; n: number }[]
  skills: { area: string; version: number; score: number }[]
  agents: { id: string; level: number; xp: number }[]
  metrics: { name: string; n: number; avg: number }[]
}

/** #10 — a snapshot of what the brain has learned (for the dashboard + the build report). */
export async function brainDigest(): Promise<BrainDigest> {
  const q = async <T>(sql: string): Promise<T[]> => { try { return (await query<T>(sql)).rows } catch { return [] } }
  const bs = await q<{ n: number; clean: number }>(`SELECT count(*)::int n, count(*) FILTER (WHERE value=1)::int clean FROM puglit_metrics WHERE name='build_success'`)
  const topIssues = await q<{ kind: string; n: number }>(`SELECT k kind, count(*)::int n FROM puglit_metrics, jsonb_array_elements_text(COALESCE(meta->'kinds','[]'::jsonb)) k WHERE name='build_success' GROUP BY k ORDER BY n DESC LIMIT 8`)
  const modules = await q<{ n: number }>(`SELECT count(*)::int n FROM puglit_modules`)
  const skills = await q<{ area: string; version: number; score: number }>(`SELECT area, version, ROUND(val_score::numeric,1)::float score FROM puglit_skills WHERE status='active' ORDER BY area`)
  const agents = await q<{ id: string; level: number; xp: number }>(`SELECT id, level, xp FROM puglit_agents ORDER BY xp DESC LIMIT 10`)
  const metrics = await q<{ name: string; n: number; avg: number }>(`SELECT name, count(*)::int n, ROUND(avg(value)::numeric,2)::float avg FROM puglit_metrics GROUP BY name ORDER BY n DESC`)
  const builds = Number(bs[0]?.n || 0)
  return { builds, cleanRate: builds ? Math.round((Number(bs[0]?.clean || 0) / builds) * 100) : 0, modules: Number(modules[0]?.n || 0), topIssues, skills, agents, metrics }
}
