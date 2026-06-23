/**
 * swarm-fitness.ts — the four levers that minimize the "model ceiling" without a better model:
 *  1) objectiveScore(): a DETERMINISTIC, measurable blueprint-quality signal blended into the
 *     tournament so selection isn't purely the noisy LLM judge (objective fitness).
 *  2) exemplarFor()/storeExemplar(): retrieval of KNOWN-GOOD code (builds that passed the gate) into
 *     generation prompts — the model imitates working code instead of inventing it.
 *  3) frontierEscalate(): a small budget of a STRONGER model for the hard cases the local one can't
 *     fix (e.g. security issues), capped so cost stays bounded.
 *  4) generateBest(): best-of-N selected by an objective score (rejection sampling).
 */
import { query } from "@/lib/db"
import { embed, cosine } from "@/lib/embed"

type Bp = { tables?: { name: string; columns?: unknown[] }[]; routes?: unknown[]; pages?: unknown[]; summary?: string }

/** Objective, measurable blueprint quality (0-100). No LLM — pure structure. */
export function objectiveScore(bp: Bp): number {
  const tables = bp.tables || [], routes = bp.routes || [], pages = bp.pages || []
  let s = 40
  if (tables.length >= 1) s += 8
  if (tables.length >= 3) s += 6
  if (tables.length && tables.every((t) => ((t.columns as unknown[])?.length || 0) >= 2)) s += 14 // real schemas, not stubs
  if (routes.length >= Math.max(2, tables.length)) s += 14 // operations cover the entities
  if (pages.length >= 2) s += 10
  if (pages.length >= 3) s += 4
  // penalty: routes referencing tables the blueprint never declares (phantom-table risk)
  const declared = new Set(tables.map((t) => (t.name || "").toLowerCase()))
  let phantom = 0
  for (const m of JSON.stringify(routes).toLowerCase().matchAll(/\b(?:from|into|update|join)\s+([a-z_][a-z0-9_]*)/g)) {
    if (m[1].length > 3 && !declared.has(m[1]) && !["set", "values", "where"].includes(m[1])) phantom++
  }
  s -= Math.min(20, phantom * 4)
  // #4 PARSIMONY (ShinkaEvolve): at equal coverage, the LEANER design wins. Penalize over-modeling
  // (more tables than the routes/pages actually surface) and runaway total surface (bloat).
  const surface = routes.length + pages.length
  if (tables.length > Math.max(3, surface)) s -= Math.min(10, (tables.length - surface) * 2) // tables nobody uses
  if (tables.length + surface > 44) s -= 6 // sprawling spec
  return Math.max(0, Math.min(100, s))
}

/** Store a piece of code that came from a build which passed the gate, for future retrieval. */
export async function storeExemplar(kind: string, task: string, code: string): Promise<void> {
  if (!code || code.length < 80 || code.length > 8000) return
  const e = await embed(task).catch(() => null)
  // #2 NOVELTY GATE (ShinkaEvolve): never store a near-duplicate of an existing exemplar — keeps the
  // archive DIVERSE + informative instead of 10 near-identical calculators (a redundant pool teaches little).
  if (e) {
    try {
      const { rows } = await query<{ embedding: unknown }>("SELECT embedding FROM verified_exemplars WHERE kind=$1 AND embedding IS NOT NULL ORDER BY created_at DESC LIMIT 40", [kind])
      const NOVELTY = Number(process.env.PUGLIT_EXEMPLAR_NOVELTY || 0.93)
      for (const r of rows) {
        const v = (typeof r.embedding === "string" ? JSON.parse(r.embedding) : r.embedding) as number[]
        if (Array.isArray(v) && cosine(e, v) > NOVELTY) return // too similar → skip
      }
    } catch { /* if the check fails, fall through and store */ }
  }
  await query("INSERT INTO verified_exemplars (kind, task, code, embedding) VALUES ($1,$2,$3,$4)", [kind, task.slice(0, 300), code, e ? JSON.stringify(e) : null]).catch(() => {})
}

/** Retrieve known-good exemplars of a kind for the prompt — a MIX, not just the nearest, so the model
 *  RECOMBINES ideas instead of copying one (#3 mixed inspiration, ShinkaEvolve's ArchiveInspirationSelector). */
export async function exemplarFor(kind: string, taskText: string): Promise<string> {
  try {
    const q = await embed(taskText).catch(() => null)
    if (!q) return ""
    const { rows } = await query<{ code: string; embedding: unknown }>("SELECT code, embedding FROM verified_exemplars WHERE kind=$1 AND embedding IS NOT NULL ORDER BY created_at DESC LIMIT 60", [kind])
    const scored = rows.map((r) => {
      const v = (typeof r.embedding === "string" ? JSON.parse(r.embedding) : r.embedding) as number[]
      return { code: r.code, sim: Array.isArray(v) ? cosine(q, v) : 0 }
    }).filter((x) => x.sim > 0).sort((a, b) => b.sim - a.sim)
    const picks: string[] = []
    if (scored[0] && scored[0].sim > 0.55) picks.push(scored[0].code) // the nearest match (exploit)
    const others = scored.slice(2).filter((x) => x.sim > 0.3) // a different, loosely-related one (explore/recombine)
    if (others.length) picks.push(others[Math.floor(Math.random() * others.length)].code)
    if (!picks.length) return ""
    return "\n\n" + picks.map((c, i) => `KNOWN-GOOD example ${i + 1} of a working ${kind} (imitate the structure + RECOMBINE ideas across examples, adapt to THIS task — never copy domain details):\n\`\`\`\n${c.slice(0, 2400)}\n\`\`\``).join("\n") + "\n"
  } catch { return "" }
}

// ── frontier escalation (bounded budget per build) ──────────────────────────
let _frontierUsed = 0
export function resetFrontierBudget() { _frontierUsed = 0 }
export function frontierRemaining() { return Math.max(0, parseInt(process.env.PUGLIT_FRONTIER_BUDGET || "0", 10) - _frontierUsed) }
/** Use a stronger model for what the local one can't fix. Returns null if no budget/not configured. */
export async function frontierEscalate(messages: { role: string; content: string }[]): Promise<string | null> {
  if (frontierRemaining() <= 0 || !process.env.PUGLIT_FRONTIER_MODEL) return null
  _frontierUsed++
  try {
    const base = (process.env.PUGLIT_FRONTIER_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")
    const r = await fetch(`${base}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (process.env.PUGLIT_FRONTIER_KEY || "") }, body: JSON.stringify({ model: process.env.PUGLIT_FRONTIER_MODEL, messages, temperature: 0.1 }) }).then((x) => x.json())
    return r?.choices?.[0]?.message?.content || null
  } catch (e) { console.error("[frontier]", (e as Error).message); return null }
}

/** Best-of-N: run a generator N times, keep the result with the highest objective score. */
export async function generateBest<T>(gen: () => Promise<T>, score: (r: T) => number, n?: number): Promise<T> {
  const N = n || parseInt(process.env.PUGLIT_BEST_OF || "1", 10)
  if (N <= 1) return gen()
  let best: T | null = null, bestScore = -Infinity
  for (let i = 0; i < N; i++) {
    const r = await gen().catch(() => null as unknown as T)
    if (r == null) continue
    const sc = score(r)
    if (sc > bestScore) { bestScore = sc; best = r }
  }
  return best ?? gen()
}
