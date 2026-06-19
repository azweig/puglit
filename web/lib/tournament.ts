/**
 * tournament.ts — the genetic 3-team tournament (F2).
 *
 * Iteration 1 (DIVERGENCE): each of the 3 teams designs a blueprint through its own
 * development philosophy (Lean / DDD / Hacker). A judge panel scores the 3 anonymized
 * designs and picks a winner — escaping the single-chain "rabbit hole".
 * Iteration 2 (CROSS-OPTIMIZE) and 3 (CONVERGE + adversarial QA) build on the winner.
 *
 * On 1 GPU the 3 teams run SEQUENTIALLY on the shared Ollama queue (real distinct agents,
 * not parallel processes). Rounds are persisted to puglit_rounds for the visual + history.
 */
import { planBlueprint, type Blueprint } from "@/lib/app-builder"
import { chatJSON, MODELS } from "@/lib/openai"
import { query } from "@/lib/db"
import { TEAMS, type TeamId } from "@/lib/roster"
import type { DomainConfig } from "@/lib/domain-types"

export interface TeamDesign { team: TeamId; philosophy: string; blueprint: Blueprint; metrics: { tables: number; routes: number; pages: number } }
export interface JudgeScore { team: TeamId; score: number; reason: string }

const JUDGE_SCHEMA = {
  type: "object",
  properties: {
    scores: { type: "array", items: { type: "object", properties: { option: { type: "integer" }, score: { type: "integer" }, reason: { type: "string" } }, required: ["option", "score", "reason"] } },
    winner: { type: "integer" },
  },
  required: ["scores", "winner"],
}

/** Iteration 1: 3 philosophy-divergent blueprints (sequential on local 1-GPU). */
export async function divergeBlueprints(config: DomainConfig, contracts: string, reference?: string): Promise<TeamDesign[]> {
  const out: TeamDesign[] = []
  for (const t of TEAMS) {
    try {
      const bp = await planBlueprint(config, contracts, reference, t.lens)
      out.push({ team: t.id, philosophy: t.philosophy, blueprint: bp, metrics: { tables: bp.tables.length, routes: bp.routes.length, pages: bp.pages.length } })
    } catch { /* a team that fails to design simply doesn't compete this round */ }
  }
  return out
}

/** Judge panel: scores the 3 designs ANONYMIZED (Option 1/2/3) to avoid philosophy bias. */
export async function judgeBlueprints(config: DomainConfig, designs: TeamDesign[]): Promise<{ scores: JudgeScore[]; winner: TeamId }> {
  if (designs.length === 1) return { scores: [{ team: designs[0].team, score: 100, reason: "único candidato" }], winner: designs[0].team }
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const card = (d: TeamDesign, i: number) =>
    `OPTION ${i + 1}\nkind: ${d.blueprint.kind}\nsummary: ${d.blueprint.summary}\ntables (${d.metrics.tables}): ${d.blueprint.tables.map((t) => t.name).join(", ")}\nroutes (${d.metrics.routes}): ${d.blueprint.routes.map((r) => r.path.replace(/^app\/api\//, "").replace(/\/route\.ts$/, "")).join(", ")}\npages (${d.metrics.pages}): ${d.blueprint.pages.map((p) => p.route).join(", ")}`
  const out = (await chatJSON([
    { role: "system", content: `You are the Stakeholder judging panel. Score each candidate blueprint 0-100 on: FIDELITY to the product (does it model THIS product's real surfaces?), COMPLETENESS of user journeys (everything listable is creatable; no dead ends), COHERENCE (no unrelated/contaminating entities), and FEASIBILITY (buildable, right-sized — not bloated, not a toy). Be critical and discriminating; do not tie. Judge ONLY on merit, ignore any house style.
Return ONLY JSON {"scores":[{"option":1,"score":0-100,"reason":"short"}],"winner":<best option number>}.` },
    { role: "user", content: `Product: ${config.identity.name} — ${tagline}\n\n${designs.map(card).join("\n\n")}` },
  ], { model: MODELS.premium, temperature: 0.2, schema: JUDGE_SCHEMA })) as { scores?: { option: number; score: number; reason: string }[]; winner?: number }

  const scores: JudgeScore[] = (out.scores || []).map((s) => ({ team: designs[s.option - 1]?.team, score: s.score, reason: s.reason })).filter((s) => s.team)
  // winner = judge's pick if valid, else highest score, else first
  let winner = designs[(out.winner || 0) - 1]?.team
  if (!winner) winner = [...scores].sort((a, b) => b.score - a.score)[0]?.team || designs[0].team
  return { scores, winner }
}

/** Run + persist iteration 1 of the tournament for a job. Returns the winner + full record. */
export async function runDivergence(jobId: string, config: DomainConfig, contracts: string, reference?: string) {
  const designs = await divergeBlueprints(config, contracts, reference)
  if (!designs.length) return { ok: false as const, error: "no designs" }
  const { scores, winner } = await judgeBlueprints(config, designs)
  const scoreOf = (t: TeamId) => scores.find((s) => s.team === t)?.score ?? null
  for (const d of designs) {
    await query(
      `INSERT INTO puglit_rounds (job_id, iteration, team, role, score, winner, notes, artifacts)
       VALUES ($1, 1, $2, 'builder', $3, $4, $5, $6)`,
      [jobId, d.team, scoreOf(d.team), d.team === winner, scores.find((s) => s.team === d.team)?.reason || "", JSON.stringify({ blueprint: d.blueprint, metrics: d.metrics })],
    ).catch(() => {})
    // tournament win → reputation: the winning team's agents gain a win + xp
    if (d.team === winner) await query(`UPDATE puglit_agents SET wins = wins + 1, xp = xp + 25 WHERE team = $1`, [d.team]).catch(() => {})
  }
  return { ok: true as const, winner, scores, designs: designs.map((d) => ({ team: d.team, philosophy: d.philosophy, metrics: d.metrics, summary: d.blueprint.summary })) }
}
