/**
 * tournament.ts — the genetic 3-team tournament (F2) with the evolutionary RPG loop.
 *
 * Iteration 1 (DIVERGENCE): each team designs a blueprint through its own development
 * philosophy AND its own MODEL (Lean→Qwen, Enterprise→DeepSeek-Coder, Hacker→Devstral) —
 * model + philosophy diversity for a real ensemble. Each team's past lessons are injected
 * (few-shot) so they improve over time. The Grand Jury scores the 3 designs PER AREA
 * (data/dev/design/business, 1-100) + a critique; the orchestrator (progression.ts) then
 * awards XP/levels/quality and writes diary lessons (winners AND losers).
 *
 * On 1 GPU the 3 teams + models run SEQUENTIALLY (shared queue). Rounds persist to
 * puglit_rounds for the visual + history.
 */
import { planBlueprint, type Blueprint } from "@/lib/app-builder"
import { chatJSON, MODELS } from "@/lib/openai"
import { query } from "@/lib/db"
import { TEAMS, type TeamId } from "@/lib/roster"
import type { DomainConfig } from "@/lib/domain-types"
import { awardRound, relevantLessons, AREAS, type Area } from "@/lib/progression"
import { PLAYBOOK } from "@/lib/playbooks"

export interface TeamDesign { team: TeamId; philosophy: string; model: string; blueprint: Blueprint; metrics: { tables: number; routes: number; pages: number } }

/** Multi-model council: each team runs a different model (overridable per env). */
export const TEAM_MODEL: Record<TeamId, string> = {
  A: process.env.PUGLIT_TEAM_A_MODEL || MODELS.code,                       // Lean → qwen2.5-coder
  B: process.env.PUGLIT_TEAM_B_MODEL || "deepseek-coder-v2",               // Enterprise → DeepSeek-Coder
  C: process.env.PUGLIT_TEAM_C_MODEL || "devstral",                        // Hacker → Devstral
}

const AREA_SCHEMA = { type: "integer", minimum: 0, maximum: 100 }
const JUDGE_SCHEMA = {
  type: "object",
  properties: {
    scores: {
      type: "array",
      items: {
        type: "object",
        properties: { option: { type: "integer" }, data: AREA_SCHEMA, dev: AREA_SCHEMA, design: AREA_SCHEMA, business: AREA_SCHEMA, critique: { type: "string" } },
        required: ["option", "data", "dev", "design", "business", "critique"],
      },
    },
    winner: { type: "integer" },
  },
  required: ["scores", "winner"],
}

/** Iteration 1: 3 philosophy- AND model-divergent blueprints (sequential on local 1-GPU). */
export type Progress = { label: string; stage: "study" | "design" | "judge"; team?: TeamId; model?: string }

export async function divergeBlueprints(config: DomainConfig, contracts: string, reference?: string, onProgress?: (p: Progress) => void): Promise<TeamDesign[]> {
  const out: TeamDesign[] = []
  const taskText = `${config.identity.name} — ${typeof config.identity.tagline === "string" ? config.identity.tagline : ""}`.trim()
  for (const t of TEAMS) {
    // retrieve the lessons most RELEVANT to THIS product (semantic), not just the recent ones
    const lessons = await relevantLessons(t.id, taskText).catch(() => "")
    const wanted = TEAM_MODEL[t.id]
    onProgress?.({ label: `${t.label} diseñando con ${wanted.split("(")[0].trim()}…`, stage: "design", team: t.id, model: wanted })
    let bp: Blueprint | null = null, usedModel = wanted
    try {
      bp = await planBlueprint(config, contracts, reference, t.lens, { model: wanted, lessons })
    } catch (e) {
      // the team's model failed (not pulled, or returned unparseable output) → log + fall back
      // to the default code model so the team STILL competes (graceful council degradation).
      console.error(`[tournament] team ${t.id} model "${wanted}" failed: ${(e as Error).message?.slice(0, 200)} — retrying with ${MODELS.code}`)
      try { bp = await planBlueprint(config, contracts, reference, t.lens, { model: MODELS.code, lessons }); usedModel = `${MODELS.code} (fallback de ${wanted})` }
      catch (e2) { console.error(`[tournament] team ${t.id} fallback also failed: ${(e2 as Error).message?.slice(0, 200)}`); continue }
    }
    if (bp) out.push({ team: t.id, philosophy: t.philosophy, model: usedModel, blueprint: bp, metrics: { tables: bp.tables.length, routes: bp.routes.length, pages: bp.pages.length } })
  }
  return out
}

export interface AreaScore { data: number; dev: number; design: number; business: number; critique: string; overall: number }

/** The jury panel: one OR several models (a "triumvirate") that each vote independently.
 *  Set PUGLIT_JURY_MODELS="gpt-oss:20b,qwen2.5-coder:32b,deepseek-r1:32b" (comma-sep) for a
 *  multi-model panel; default is a single judge (MODELS.premium). All local on the A40. */
const JURY_MODELS = (process.env.PUGLIT_JURY_MODELS || "").split(",").map((s) => s.trim()).filter(Boolean)

/** ONE judge scores each design ANONYMIZED (Option 1/2/3) per area + a critique + a winner. */
async function judgeOnce(config: DomainConfig, designs: TeamDesign[], model: string): Promise<{ byTeam: Record<string, AreaScore>; winner: TeamId } | null> {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const card = (d: TeamDesign, i: number) =>
    `OPTION ${i + 1}\nkind: ${d.blueprint.kind}\nsummary: ${d.blueprint.summary}\ntables (${d.metrics.tables}): ${d.blueprint.tables.map((t) => t.name).join(", ")}\nroutes (${d.metrics.routes}): ${d.blueprint.routes.map((r) => r.path.replace(/^app\/api\//, "").replace(/\/route\.ts$/, "")).join(", ")}\npages (${d.metrics.pages}): ${d.blueprint.pages.map((p) => p.route).join(", ")}`
  let parsed: { scores?: { option: number; data: number; dev: number; design: number; business: number; critique: string }[]; winner?: number } = {}
  try {
    parsed = (await chatJSON([
      { role: "system", content: `You are a Stakeholder juror judging candidate blueprints.

${PLAYBOOK.review}

Score EACH candidate 0-100 on FOUR disciplines, and give a one-sentence critique (the single most important thing to improve):
- data: the data model — right tables/relations for THIS product, no missing core entities, no unrelated/contaminating tables.
- dev: the API/operations — every user journey has its routes (create + read + the product's core action), no dead ends.
- design: the pages/UX — the screens a user needs to actually use the product end-to-end.
- business: product fidelity + feature completeness + a coherent money model (no pricing if free, no signup if public).
Be critical and DISCRIMINATING; do not tie. Pick the best overall as winner. Judge only on merit, ignore house style.
Return ONLY JSON {"scores":[{"option":1,"data":0-100,"dev":0-100,"design":0-100,"business":0-100,"critique":"..."}],"winner":<best option number>}.` },
      { role: "user", content: `Product: ${config.identity.name} — ${tagline}\n\n${designs.map(card).join("\n\n")}` },
    ], { model, temperature: 0.2, schema: JUDGE_SCHEMA })) as typeof parsed
  } catch { return null }
  const byTeam: Record<string, AreaScore> = {}
  for (const s of parsed.scores || []) {
    const d = designs[s.option - 1]; if (!d) continue
    byTeam[d.team] = { data: s.data, dev: s.dev, design: s.design, business: s.business, critique: s.critique || "", overall: Math.round((s.data + s.dev + s.design + s.business) / 4) }
  }
  if (!Object.keys(byTeam).length) return null
  let winner = designs[(parsed.winner || 0) - 1]?.team
  if (!winner) winner = (Object.entries(byTeam).sort((a, b) => b[1].overall - a[1].overall)[0]?.[0] as TeamId)
  return { byTeam, winner }
}

/** Grand Jury: runs the PANEL (1..N jurors), averages per-area scores across jurors, and
 *  picks the winner by MAJORITY VOTE — ties broken by the aggregate overall score. */
export async function judgeBlueprints(config: DomainConfig, designs: TeamDesign[]): Promise<{ byTeam: Record<string, AreaScore>; winner: TeamId }> {
  const jury = JURY_MODELS.length ? JURY_MODELS : [MODELS.premium]
  const verdicts: { byTeam: Record<string, AreaScore>; winner: TeamId }[] = []
  for (const m of jury) { const v = await judgeOnce(config, designs, m).catch(() => null); if (v) verdicts.push(v) } // sequential: 1 GPU swaps

  const byTeam: Record<string, AreaScore> = {}
  for (const d of designs) {
    const ss = verdicts.map((v) => v.byTeam[d.team]).filter(Boolean)
    if (!ss.length) { byTeam[d.team] = { data: 60, dev: 60, design: 60, business: 60, critique: "sin evaluación del jurado", overall: 60 }; continue }
    const avg = (k: "data" | "dev" | "design" | "business") => Math.round(ss.reduce((s, x) => s + x[k], 0) / ss.length)
    const data = avg("data"), dev = avg("dev"), design = avg("design"), business = avg("business")
    // keep the critiques from each juror (deduped) so the diary/UI sees the panel's view
    const crit = [...new Set(ss.map((x) => x.critique).filter(Boolean))].slice(0, 3).join(" · ")
    byTeam[d.team] = { data, dev, design, business, critique: crit, overall: Math.round((data + dev + design + business) / 4) }
  }

  // winner = majority vote across jurors; tie → highest aggregate overall (the "desempate")
  const votes: Record<string, number> = {}
  for (const v of verdicts) if (v.winner) votes[v.winner] = (votes[v.winner] || 0) + 1
  const ranked = Object.entries(byTeam).sort((a, b) => b[1].overall - a[1].overall)
  let winner = (Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0]) as TeamId | undefined
  const topVotes = winner ? votes[winner] : 0
  const tied = Object.values(votes).filter((n) => n === topVotes).length > 1
  if (!winner || tied) winner = (ranked[0]?.[0] as TeamId) || designs[0]?.team // tie / no votes → aggregate overall
  return { byTeam, winner }
}

/** Run + persist iteration 1: diverge → judge per-area → award XP/levels/lessons. */
export async function runDivergence(jobId: string, config: DomainConfig, contracts: string, reference?: string, onProgress?: (p: Progress) => void) {
  const designs = await divergeBlueprints(config, contracts, reference, onProgress)
  if (!designs.length) return { ok: false as const, error: "no designs (¿modelos del council bajados?)" }
  onProgress?.({ label: "El Gran Jurado evalúa los 3 diseños…", stage: "judge" })
  const { byTeam, winner } = await judgeBlueprints(config, designs)

  // distribute the evolutionary rewards (XP, level-ups, quality, diary lessons) + Obsidian
  const areaScores: Record<string, Partial<Record<Area, number>>> = {}
  const feedback: Record<string, Partial<Record<Area, string>>> = {}
  for (const [team, s] of Object.entries(byTeam)) {
    areaScores[team] = { data: s.data, dev: s.dev, design: s.design, business: s.business }
    feedback[team] = Object.fromEntries(AREAS.map((ar) => [ar, s.critique])) as Partial<Record<Area, string>>
  }
  const { leveledUp } = await awardRound({ jobId, round: "diverge", winner, areaScores, feedback }).catch(() => ({ leveledUp: [] as { id: string; level: number }[] }))

  for (const d of designs) {
    const s = byTeam[d.team]
    await query(
      `INSERT INTO puglit_rounds (job_id, iteration, team, role, score, winner, notes, artifacts)
       VALUES ($1, 1, $2, 'builder', $3, $4, $5, $6)`,
      [jobId, d.team, s?.overall ?? null, d.team === winner, s?.critique || "", JSON.stringify({ blueprint: d.blueprint, metrics: d.metrics, model: d.model, areas: s })],
    ).catch(() => {})
  }
  return {
    ok: true as const, winner, leveledUp,
    winnerBlueprint: designs.find((d) => d.team === winner)?.blueprint || null, // → auto-build
    designs: designs.map((d) => ({ team: d.team, philosophy: d.philosophy, model: d.model, metrics: d.metrics, summary: d.blueprint.summary, areas: byTeam[d.team] })),
  }
}
