/**
 * progression.ts — the evolutionary RPG progression engine (orchestrator layer).
 *
 * The Grand Jury (Stakeholder + 4 specialists) scores each TEAM's deliverable PER AREA
 * (1-100) — never the 75 agents one by one (token-cheap). This module then distributes
 * XP to individual agents:
 *
 *     XP_gained = areaScore(agent's area) × victoryFactor(team) × participation(role, round)
 *
 *   victoryFactor: winner ×1.5, losers ×0.8 (losers earn less but still learn).
 *   participation: how much that role actually worked this round (1.0 high … 0.2 low).
 *
 * Level curve (RPG, levels 1-1000):  XP-to-reach(L) = floor(100 · L^1.8).
 * On each level gained → +1 to the agent's specialty stat.
 * Every scored area also writes a LESSON to each relevant agent's diary (winners AND
 * losers) → injected as few-shot into that agent's next prompt (this is the learning).
 * State persists in Postgres (runtime, for the campus) AND mirrors to an Obsidian vault.
 */
import { query } from "@/lib/db"
import { writeAgentSheet } from "@/lib/obsidian"
import { embed, cosine } from "@/lib/embed"

export type Area = "data" | "dev" | "design" | "business"
export const AREAS: Area[] = ["data", "dev", "design", "business"]
export const AREA_ES: Record<Area, string> = { data: "Arquitectura/Datos", dev: "Desarrollo", design: "Diseño/UX", business: "Negocio/Growth" }

/** Which area each base role belongs to (drives which area-score it earns). */
export const ROLE_AREA: Record<string, Area> = {
  "data-architect": "data", "domain-architect": "data", "contracts-architect": "data",
  "master-spec-architect": "data", "data-engineer": "data",
  "backend-engineer": "dev", "ci-fixer": "dev", "reliability-engineer": "dev",
  "reliability-verifier": "dev", "security-engineer": "dev", "devops": "dev", "completeness-critic": "dev",
  "art-director": "design", "frontend-engineer": "design", "frontend-architect": "design", "design-qc": "design",
  "discovery-interviewer": "business", "answer-extractor": "business", "researcher": "business",
  "reference-studier": "business", "analyst": "business", "seo-specialist": "business",
  "tech-writer": "business", "business-strategist": "business",
}

/** Participation of each role in a given ROUND TYPE (0..1). Iteration-1 is a blueprint
 *  design round → the architects/researchers do the work; builders barely participate yet.
 *  (When the full build runs, participation comes from real per-step activity instead.) */
export const PARTICIPATION: Record<string, Record<string, number>> = {
  diverge: {
    "data-architect": 1.0, "domain-architect": 1.0, "master-spec-architect": 1.0, "contracts-architect": 0.9,
    "researcher": 0.8, "reference-studier": 0.8, "data-engineer": 0.5, "completeness-critic": 0.5,
    "business-strategist": 0.4, "analyst": 0.4, "discovery-interviewer": 0.4, "answer-extractor": 0.3,
    "frontend-architect": 0.3, "art-director": 0.25, "seo-specialist": 0.25, "tech-writer": 0.25,
    "backend-engineer": 0.2, "security-engineer": 0.2, "frontend-engineer": 0.2, "design-qc": 0.2,
    "ci-fixer": 0.15, "reliability-engineer": 0.15, "reliability-verifier": 0.15, "devops": 0.15,
  },
}
const participationFor = (round: string, role: string) => PARTICIPATION[round]?.[role] ?? 0.2

// ── RPG level curve ──────────────────────────────────────────────────────────
export const xpToReach = (level: number) => Math.floor(100 * Math.pow(level, 1.8))
export function levelForXp(xp: number): number {
  if (xp <= 0) return 1
  let L = Math.max(1, Math.floor(Math.pow(xp / 100, 1 / 1.8)))
  while (xpToReach(L + 1) <= xp) L++
  return L
}

interface AgentRow { id: string; team: string; role: string; queen: boolean; stats: Record<string, number>; level: number; xp: number; quality_sum: number; quality_n: number }

/**
 * Award a tournament round's results to every participating agent: XP, level-ups (+stat),
 * quality reputation, projects/wins counters, and a diary lesson. Then mirror to Obsidian.
 *
 * @param areaScores per-team per-area scores 0-100, e.g. { A:{data:90,dev:80,...}, B:{...}, C:{...} }
 * @param feedback   per-team per-area short critique (what to improve), for the diary
 */
export async function awardRound(opts: {
  jobId: string
  round: "diverge" | "cross" | "converge"
  winner: string
  areaScores: Record<string, Partial<Record<Area, number>>>
  feedback: Record<string, Partial<Record<Area, string>>>
}): Promise<{ leveledUp: { id: string; level: number }[] }> {
  const { jobId, round, winner, areaScores, feedback } = opts
  const { rows } = await query<AgentRow>(`SELECT id,team,role,queen,stats,level,xp,quality_sum,quality_n FROM puglit_agents`)
  const leveledUp: { id: string; level: number }[] = []
  const embCache = new Map<string, number[] | null>() // many agents share an identical lesson → embed each unique string once

  for (const a of rows) {
    const teamScores = areaScores[a.team]; if (!teamScores) continue
    const area: Area = a.queen ? "data" : (ROLE_AREA[a.role] || "business")
    // queen earns the team's BEST area (she owns the whole deliverable); others their own area
    const score = a.queen ? Math.max(...AREAS.map((ar) => teamScores[ar] ?? 0)) : (teamScores[area] ?? 0)
    if (!score) continue
    const victory = a.team === winner ? 1.5 : 0.8
    const part = a.queen ? 1.0 : participationFor(round, a.role)
    const gained = Math.round(score * victory * part)
    if (gained <= 0) continue

    const newXp = a.xp + gained
    const newLevel = levelForXp(newXp)
    const levelsGained = Math.max(0, newLevel - a.level)
    // +1 to the specialty (highest) stat per level gained
    const stats = { ...a.stats }
    if (levelsGained > 0) {
      const spec = Object.keys(stats).sort((x, y) => (stats[y] || 0) - (stats[x] || 0))[0]
      if (spec) stats[spec] = (stats[spec] || 0) + levelsGained
      leveledUp.push({ id: a.id, level: newLevel })
    }
    const qsum = a.quality_sum + score / 10 // area score 0-100 → 0-10 quality contribution
    const qn = a.quality_n + 1

    await query(
      `UPDATE puglit_agents SET xp=$2, level=$3, stats=$4, quality_sum=$5, quality_n=$6,
         projects = projects + 1, wins = wins + $7 WHERE id=$1`,
      [a.id, newXp, newLevel, JSON.stringify(stats), qsum, qn, a.team === winner ? 1 : 0],
    ).catch(() => {})

    // diary lesson — winners record what worked, losers record the critique to improve
    const fb = feedback[a.team]?.[area]
    const entry = a.team === winner
      ? `Ganamos el round (${AREA_ES[area]} ${score}/100). ${fb || "Mantener este enfoque."}`
      : `Perdimos (${AREA_ES[area]} ${score}/100). A mejorar: ${fb || "subir fidelidad y completitud del área."}`
    // embed the lesson (semantic "gene") so it can be retrieved by RELEVANCE later, not just recency
    if (!embCache.has(entry)) embCache.set(entry, await embed(entry).catch(() => null))
    const emb = embCache.get(entry) || null
    await query(
      `INSERT INTO puglit_agent_diary (agent_id, job_id, kind, entry, quality, embedding) VALUES ($1,$2,$3,$4,$5,$6)`,
      [a.id, jobId, a.team === winner ? "win" : "critique", entry, score / 10, emb ? JSON.stringify(emb) : null],
    ).catch(() => {})
  }

  // mirror the whole roster to the Obsidian vault (human-readable sheets + diary)
  await syncObsidian().catch(() => {})
  return { leveledUp }
}

/** Recent diary lessons for an agent — injected as few-shot into its next prompt. */
export async function recentLessons(agentId: string, n = 4): Promise<string[]> {
  const { rows } = await query<{ entry: string }>(
    `SELECT entry FROM puglit_agent_diary WHERE agent_id=$1 ORDER BY created_at DESC LIMIT $2`, [agentId, n])
  return rows.map((r) => r.entry)
}

/** Team-level lesson digest (the architects' lessons) — RECENCY-ordered fallback. */
export async function teamLessonDigest(team: string, n = 6): Promise<string> {
  const { rows } = await query<{ entry: string }>(
    `SELECT d.entry FROM puglit_agent_diary d JOIN puglit_agents a ON a.id=d.agent_id
     WHERE a.team=$1 ORDER BY d.created_at DESC LIMIT $2`, [team, n])
  if (!rows.length) return ""
  return rows.map((r) => `- ${r.entry}`).join("\n")
}

/** Team lessons most RELEVANT to the current task (semantic, via embeddings). Hardened per the
 *  critiques: (a) a RELEVANCE FLOOR so a loosely-related lesson from another domain (fintech →
 *  health) can't be force-applied; (b) RECENCY DECAY so newer lessons outweigh stale ones (no
 *  contradictory advice from old app versions); (c) returns nothing rather than noise when no
 *  lesson clears the floor. Falls back to recency if embeddings aren't available. */
export async function relevantLessons(team: string, taskText: string, n = 6): Promise<string> {
  const q = await embed(taskText).catch(() => null)
  if (!q) return teamLessonDigest(team, n)
  const { rows } = await query<{ entry: string; embedding: unknown; created_at: Date }>(
    `SELECT DISTINCT ON (d.entry) d.entry, d.embedding, d.created_at FROM puglit_agent_diary d JOIN puglit_agents a ON a.id=d.agent_id
     WHERE a.team=$1 AND d.embedding IS NOT NULL ORDER BY d.entry, d.created_at DESC LIMIT 400`, [team])
  if (!rows.length) return teamLessonDigest(team, n)
  const now = Date.now()
  const RELEVANCE_FLOOR = 0.35 // below this, the lesson is from a different domain → ignore it
  const scored = rows.map((r) => {
    const v = Array.isArray(r.embedding) ? (r.embedding as number[]) : (() => { try { return JSON.parse(String(r.embedding)) as number[] } catch { return [] } })()
    const sim = v.length ? cosine(q, v) : -1
    const ageDays = (now - new Date(r.created_at).getTime()) / 86400000
    const decay = Math.exp(-ageDays / 45) // half-life ~31 days → recent lessons weigh more
    return { entry: r.entry, sim, score: sim * (0.6 + 0.4 * decay) }
  }).filter((s) => s.sim >= RELEVANCE_FLOOR).sort((a, b) => b.score - a.score)
  if (!scored.length) return "" // nothing relevant enough → no advice beats wrong advice
  return scored.slice(0, n).map((s) => `- ${s.entry}`).join("\n")
}

/** Write every agent's current sheet to the Obsidian vault. */
export async function syncObsidian(): Promise<void> {
  const { rows } = await query<AgentRow & { name: string; philosophy?: string }>(
    `SELECT id,team,role,name,queen,stats,level,xp,quality_sum,quality_n FROM puglit_agents`)
  for (const a of rows) {
    const diary = (await query<{ kind: string; entry: string; quality: number | null; created_at: string }>(
      `SELECT kind,entry,quality,created_at FROM puglit_agent_diary WHERE agent_id=$1 ORDER BY created_at DESC LIMIT 20`, [a.id])).rows
    await writeAgentSheet(a, diary).catch(() => {})
  }
}
