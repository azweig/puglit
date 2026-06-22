/**
 * brain-sync.ts — durable, MERGE-AWARE sync of the agents' brain (hybrid persistence).
 *
 * The brain (diary, metrics, exemplars, evolved SkillOpt skills, harvested modules, agent XP) is the
 * accumulated learning. This is NOT a "git push that clobbers": it's a merge that respects two data
 * classes so parallel agents/pods never lose or contradict learnings:
 *
 *   • APPEND-ONLY / additive (diary, metrics, exemplars, skill-rejects) → UNION by content key
 *     (CRDT grow-set). Concurrent writers only add; nothing is overwritten.
 *   • MUTABLE / authoritative (skills, modules, agent XP) → arbitrated by an OBJECTIVE score, never
 *     last-write-wins: the ACTIVE skill per area = the highest HELD-OUT validation score; a module =
 *     the highest version; agent XP = the max. → no incongruent learnings.
 *
 * Authoritative live store = the cloud Postgres (POSTGRES_*). exportBrain()/mergeBrain() are for
 * snapshots (git/bucket backup) + bootstrapping/reconciling a fresh or offline pod SAFELY.
 */
import { query } from "@/lib/db"

export type BrainSnapshot = Record<string, Record<string, unknown>[]>

// append-only tables: { columns to copy, the natural dedup key, which columns are JSONB }
const APPEND: Record<string, { cols: string[]; key: string[]; json: string[] }> = {
  puglit_agent_diary: { cols: ["agent_id", "job_id", "kind", "entry", "quality", "embedding", "created_at"], key: ["agent_id", "kind", "entry", "created_at"], json: ["embedding"] },
  puglit_metrics: { cols: ["name", "value", "meta", "created_at"], key: ["name", "value", "created_at"], json: ["meta"] },
  verified_exemplars: { cols: ["kind", "task", "code", "embedding", "created_at"], key: ["kind", "code"], json: ["embedding"] },
  puglit_skill_rejects: { cols: ["area", "edit", "before_score", "after_score", "created_at"], key: ["area", "edit", "created_at"], json: [] },
}
const MUTABLE = ["puglit_skills", "puglit_modules"]

/** Snapshot the whole brain (for a git/bucket backup or to hand to another pod). */
export async function exportBrain(): Promise<BrainSnapshot> {
  const snap: BrainSnapshot = {}
  for (const t of [...Object.keys(APPEND), ...MUTABLE]) {
    try { snap[t] = (await query(`SELECT * FROM ${t}`)).rows as Record<string, unknown>[] } catch { snap[t] = [] }
  }
  try { snap.puglit_agents = (await query("SELECT id, xp, level FROM puglit_agents")).rows as Record<string, unknown>[] } catch { snap.puglit_agents = [] }
  return snap
}

async function unionInsert(table: string, def: typeof APPEND[string], rows: Record<string, unknown>[]): Promise<number> {
  let added = 0
  for (const r of rows) {
    const where = def.key.map((k, i) => `${k} IS NOT DISTINCT FROM $${i + 1}`).join(" AND ")
    const exists = (await query(`SELECT 1 FROM ${table} WHERE ${where} LIMIT 1`, def.key.map((k) => r[k])).catch(() => ({ rows: [1] }))).rows.length
    if (exists) continue
    const vals = def.cols.map((c) => (def.json.includes(c) && r[c] != null ? JSON.stringify(r[c]) : r[c]))
    const ph = def.cols.map((c, i) => (def.json.includes(c) ? `$${i + 1}::jsonb` : `$${i + 1}`)).join(",")
    if ((await query(`INSERT INTO ${table} (${def.cols.join(",")}) VALUES (${ph})`, vals).then(() => true).catch(() => false))) added++
  }
  return added
}

/** Merge a snapshot into the live brain WITHOUT losing or clobbering learnings. */
export async function mergeBrain(snap: BrainSnapshot): Promise<Record<string, number>> {
  const report: Record<string, number> = {}
  // 1) APPEND-ONLY → union by content key
  for (const [t, def] of Object.entries(APPEND)) report[t] = await unionInsert(t, def, snap[t] || [])
  // 2) SKILLS → union the versions (archived), then consolidate active = best validated
  let sk = 0
  for (const r of snap.puglit_skills || []) {
    const ex = (await query("SELECT 1 FROM puglit_skills WHERE area=$1 AND version=$2", [r.area, r.version]).catch(() => ({ rows: [1] }))).rows.length
    if (!ex && (await query("INSERT INTO puglit_skills (area, version, doc, val_score, status) VALUES ($1,$2,$3,$4,'archived')", [r.area, r.version, r.doc, r.val_score]).then(() => true).catch(() => false))) sk++
  }
  report.puglit_skills = sk
  // 3) MODULES → keep the higher version (objective, not last-write)
  let md = 0
  for (const r of snap.puglit_modules || []) {
    if (await query(
      `INSERT INTO puglit_modules (name, category, description, when_to_use, env_vars, deps, gateway, version, status)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9)
       ON CONFLICT (name) DO UPDATE SET version=EXCLUDED.version, status=EXCLUDED.status, description=EXCLUDED.description, when_to_use=EXCLUDED.when_to_use
       WHERE EXCLUDED.version > puglit_modules.version`,
      [r.name, r.category, r.description, r.when_to_use ?? null, JSON.stringify(r.env_vars ?? []), JSON.stringify(r.deps ?? {}), r.gateway ?? null, r.version ?? 1, r.status ?? "stable"],
    ).then(() => true).catch(() => false)) md++
  }
  report.puglit_modules = md
  // 4) AGENT XP → bump to the max (never lose levels)
  for (const r of snap.puglit_agents || []) await query("UPDATE puglit_agents SET xp=GREATEST(COALESCE(xp,0),$2), level=GREATEST(COALESCE(level,1),$3) WHERE id=$1", [r.id, Number(r.xp) || 0, Number(r.level) || 1]).catch(() => {})
  await consolidateActiveSkills()
  return report
}

/** For each area, the ACTIVE skill = the highest held-out val_score version (objective arbitration,
 *  not last-write-wins) — the guard against incongruent learnings when pods evolve in parallel. */
export async function consolidateActiveSkills(): Promise<void> {
  await query("UPDATE puglit_skills SET status='archived' WHERE status='active'").catch(() => {})
  await query(`UPDATE puglit_skills s SET status='active'
    FROM (SELECT DISTINCT ON (area) area, id FROM puglit_skills ORDER BY area, val_score DESC NULLS LAST, version DESC) best
    WHERE s.id = best.id`).catch(() => {})
}
