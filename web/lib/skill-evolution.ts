/**
 * skill-evolution.ts — SkillOpt-style validation-gated skill training (microsoft/SkillOpt).
 *
 * Treats each role's SKILL DOC as the trainable state of the frozen agents (no weight changes). An
 * optimizer model turns scored rollouts (recent build outcomes) into BOUNDED add/delete/replace edits;
 * a candidate is accepted ONLY IF it strictly improves a HELD-OUT validation score (objectiveScore on
 * a frozen validation set of tasks). A rejected-edit buffer + a per-pass edit budget (the "learning
 * rate") keep it stable. The deployed artifact is the evolved skill doc — used at generation with
 * ZERO extra inference cost. Runs OFFLINE (SkillOpt-Sleep style), never inline per build.
 *
 * Loop: rollout → reflect/aggregate → propose (bounded) → VALIDATE (held-out gate) → select → update.
 */
import { query } from "@/lib/db"
import { chatJSON, MODELS } from "@/lib/openai"
import { objectiveScore } from "@/lib/swarm-fitness"
import { scorecard } from "@/lib/swarm-metrics"
import { PLAYBOOK } from "@/lib/playbooks"

export type SkillArea = "data" | "dev" | "design" | "business" | "test" | "interview"
// The interviewer's STYLE is evolvable too — but it's NOT validated by blueprint rollouts (its quality
// is the founder's 😀/😞), so it lives here for skillFor()/loadActiveSkills() but evolves via
// interview-evolution.ts, NOT evolveAllSkills(). Seed = the current discovery best-practices.
const INTERVIEW_SEED = `INTERVIEW STYLE — warm, sharp, founder-first (grilling discipline).
1) ONE QUESTION AT A TIME, waiting for the answer before the next — asking several at once is bewildering.
   Start each turn with a 1-sentence reflection of what you understood.
2) RECOMMEND AN ANSWER for every question: state YOUR suggested default + a half-line of why, so the
   founder can just confirm. In multiple-choice, mark the recommended option. Never leave them guessing.
3) WALK THE DESIGN TREE: resolve decisions in DEPENDENCY ORDER, one branch at a time — each answer unlocks
   the next relevant question. Don't jump around.
4) INFER, DON'T INTERROGATE: never ask what the idea, the references or prior answers already imply. If a
   reference URL answers it, use that. Aggressively skip the known.
5) FORMAT: prefer 2–4 options (short label + one-line detail, allowOther) for closed questions; a text
   field only for genuinely open ones (data sources, URLs, lists). Don't overload one screen.
6) DEPTH: dig into the NON-OBVIOUS, business-critical decisions THIS idea implies — above all WHERE the
   core data/content comes from and how it stays current. Stop when you can write a real spec.`
const SEED: Record<SkillArea, string> = { data: PLAYBOOK.architect, dev: PLAYBOOK.dev, design: PLAYBOOK.design, business: PLAYBOOK.review, test: PLAYBOOK.test, interview: INTERVIEW_SEED }

// In-memory overlay so the SYNC prompt sites read evolved skills after one async load per build.
const active: Partial<Record<SkillArea, { doc: string; score: number }>> = {}
let loaded = false

/** The skill text an agent of this area uses now: the validated evolved doc, else the seed playbook. */
export function skillFor(area: SkillArea): string { return active[area]?.doc || SEED[area] }

/** Load the active validated skills into the overlay (call once per build, before generation). */
export async function loadActiveSkills(force = false): Promise<void> {
  if (loaded && !force) return
  loaded = true
  try {
    await ensureSkillSchema()
    const { rows } = await query<{ area: string; doc: string; val_score: number }>(
      "SELECT DISTINCT ON (area) area, doc, val_score FROM puglit_skills WHERE status='active' ORDER BY area, version DESC")
    for (const r of rows) if (SEED[r.area as SkillArea] != null) active[r.area as SkillArea] = { doc: r.doc, score: Number(r.val_score) }
  } catch { /* fall back to seeds */ }
}

// DIVERSE task POOL. We do NOT validate against a fixed 5 (the optimizer would "study for the exam"
// and overfit it). Each epoch samples a random GATE subset + a disjoint held-out TEST subset, so an
// accepted edit must generalize across rotating, unseen tasks — not game a frozen set.
const VAL_POOL = [
  "A booking marketplace for vacation rentals: host listings, availability calendar, reservations and reviews.",
  "A used-goods marketplace with a swipe feed, mutual matches and per-match chat.",
  "A live football scores site with competitions, matches, minute events, lineups and standings.",
  "A team task manager with projects, tasks, assignees, statuses and comments.",
  "A subscription box service with products, plans, orders, billing and shipping.",
  "A dental clinic system: patients, appointments with statuses, treatments and reminders.",
  "A personal accounting app: accounts, transactions, transfers, monthly balance and reports.",
  "An online store with products, cart, checkout payments, orders and stock.",
  "A blog/CMS with markdown posts, categories, tags, drafts and a public listing.",
  "A help desk: tickets with status, priority, assignees, comments and SLA tracking.",
  "A fitness tracker: workouts, exercises, sets, progress charts and goals.",
  "A recipe site: recipes with ingredients and steps, categories, search and favorites.",
  "A real-estate listings site: properties with geo, filters, search by distance and inquiries.",
  "An events platform: events, ticket types with quota, purchases and QR check-in.",
  "A CRM: contacts, companies, deals with pipeline stages, activities and notes.",
]
const VAL_N = Number(process.env.PUGLIT_SKILL_VAL_N || 6)
const TEST_N = Number(process.env.PUGLIT_SKILL_TEST_N || 4)
function sampleTasks(n: number, exclude: string[] = []): string[] {
  const a = VAL_POOL.filter((t) => !exclude.includes(t))
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a.slice(0, n)
}
const BP_SCHEMA = {
  type: "object",
  properties: {
    tables: { type: "array", items: { type: "object", properties: { name: { type: "string" }, columns: { type: "array", items: { type: "string" } } }, required: ["name", "columns"] } },
    routes: { type: "array", items: { type: "object", properties: { path: { type: "string" }, purpose: { type: "string" } } } },
    pages: { type: "array", items: { type: "object", properties: { route: { type: "string" }, title: { type: "string" } } } },
    summary: { type: "string" },
  }, required: ["tables", "routes", "pages"],
} as const

/** A cheap rollout: design a compact blueprint for a task USING a given skill doc, score it objectively. */
async function rolloutScore(skillDoc: string, task: string): Promise<number> {
  const bp = (await chatJSON([
    { role: "system", content: `You are a domain architect. Design a COMPACT but complete blueprint for the product.\n\n${skillDoc}\n\nReturn ONLY JSON {"tables":[{"name","columns":["col1","col2",...]}],"routes":[{"path","purpose"}],"pages":[{"route","title"}],"summary":""}.` },
    { role: "user", content: task },
  ], { model: MODELS.premium, temperature: 0.3, schema: BP_SCHEMA }).catch(() => null)) as { tables?: unknown[]; routes?: unknown[]; pages?: unknown[] } | null
  return bp ? objectiveScore(bp as never) : 0
}
async function validate(skillDoc: string, tasks: string[]): Promise<number> {
  if (!tasks.length) return 0
  const scores = await Promise.all(tasks.map((t) => rolloutScore(skillDoc, t)))
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
}

async function rejectedEdits(area: SkillArea): Promise<string[]> {
  try { return (await query<{ edit: string }>("SELECT edit FROM puglit_skill_rejects WHERE area=$1 ORDER BY id DESC LIMIT 12", [area])).rows.map((r) => r.edit) } catch { return [] }
}

/** Aggregate the recent scored signal (the swarm's metric scorecard) into optimizer feedback. */
async function feedback(): Promise<string> {
  try {
    const sc = await scorecard()
    return Object.entries(sc).map(([k, v]) => `${k}: ${Math.round(v.rate * 100)}% over ${v.n}`).join("\n") || "(no metrics yet)"
  } catch { return "(no metrics yet)" }
}

/** One SkillOpt epoch for an area: propose BOUNDED edits → VALIDATE held-out → accept (strictly
 *  better) or push to the rejected-edit buffer. Returns the before/after held-out scores. */
export async function evolveSkill(area: SkillArea): Promise<{ accepted: boolean; before: number; after: number; edit?: string }> {
  await ensureSkillSchema()
  await loadActiveSkills(true)
  const current = skillFor(area)
  // TRAIN/VAL/TEST split, re-sampled THIS epoch: a GATE set (improve by margin) + a DISJOINT held-out
  // TEST set (must not regress). Random rotation each epoch → an edit can't overfit a fixed task set.
  const gateTasks = sampleTasks(VAL_N)
  const testTasks = sampleTasks(TEST_N, gateTasks)
  const before = await validate(current, gateTasks) // computed on THIS epoch's gate set (fair before/after)
  const [fb, rejects] = await Promise.all([feedback(), rejectedEdits(area)])
  // PROPOSE — bounded add/delete/replace within a char budget (the textual "learning rate").
  const out = (await chatJSON([
    { role: "system", content: `You are a skill OPTIMIZER (SkillOpt). Improve the agent SKILL document using the feedback. Make BOUNDED edits: at MOST 3 add/delete/replace changes, net change <= 500 characters, final doc <= 1900 characters. Keep it imperative, concrete, non-redundant. Do NOT re-introduce any rejected edit. Sharpen what demonstrably helps the scored outcomes. Return ONLY JSON {"doc":"<full revised skill>","edit":"<one-line summary of the single most important change>"}.` },
    { role: "user", content: `CURRENT SKILL:\n${current}\n\nSCORED ROLLOUT FEEDBACK:\n${fb}\n\nREJECTED EDITS (do NOT repeat):\n${rejects.join("\n") || "(none)"}` },
  ], { model: MODELS.premium, temperature: 0.4 }).catch(() => null)) as { doc?: string; edit?: string } | null
  const candidate = String(out?.doc || "").trim()
  const edit = String(out?.edit || "edit").slice(0, 200)
  if (candidate.length < 120 || candidate.length > 2600 || candidate === current) return { accepted: false, before, after: before }
  // GATE: strictly better on the sampled gate set by a margin (avoids noise-chasing) AND no regression
  // on the disjoint held-out TEST set (the anti-overfitting check — generalizes, not memorizes).
  const after = await validate(candidate, gateTasks)
  const MARGIN = Number(process.env.PUGLIT_SKILL_MARGIN || 1.5)
  const [testBefore, testAfter] = await Promise.all([validate(current, testTasks), validate(candidate, testTasks)])
  const generalizes = testAfter >= testBefore - 1 // tolerate 1pt noise; reject edits that only help the gate
  if (after > before + MARGIN && generalizes) {
    const ver = (await query<{ v: number }>("SELECT COALESCE(MAX(version),0)+1 AS v FROM puglit_skills WHERE area=$1", [area])).rows[0].v
    await query("UPDATE puglit_skills SET status='archived' WHERE area=$1 AND status='active'", [area])
    await query("INSERT INTO puglit_skills (area, version, doc, val_score, status) VALUES ($1,$2,$3,$4,'active')", [area, ver, candidate, after])
    active[area] = { doc: candidate, score: after }
    return { accepted: true, before, after, edit }
  }
  await query("INSERT INTO puglit_skill_rejects (area, edit, before_score, after_score) VALUES ($1,$2,$3,$4)", [area, edit, before, after]).catch(() => {})
  return { accepted: false, before, after, edit }
}

/** Run one evolution epoch across all areas (the offline SkillOpt-Sleep pass). */
export async function evolveAllSkills(): Promise<Record<SkillArea, { accepted: boolean; before: number; after: number; edit?: string }>> {
  const areas: SkillArea[] = ["data", "dev", "test", "design", "business"]
  const out = {} as Record<SkillArea, { accepted: boolean; before: number; after: number; edit?: string }>
  for (const a of areas) out[a] = await evolveSkill(a).catch(() => ({ accepted: false, before: 0, after: 0 }))
  return out
}

let schemaReady = false
async function ensureSkillSchema(): Promise<void> {
  if (schemaReady) return
  schemaReady = true
  await query(`CREATE TABLE IF NOT EXISTS puglit_skills (
    id BIGSERIAL PRIMARY KEY, area VARCHAR(16) NOT NULL, version INT NOT NULL, doc TEXT NOT NULL,
    val_score DOUBLE PRECISION DEFAULT 0, status VARCHAR(12) NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE INDEX IF NOT EXISTS idx_puglit_skills_area ON puglit_skills(area, version DESC);
    CREATE TABLE IF NOT EXISTS puglit_skill_rejects (
    id BIGSERIAL PRIMARY KEY, area VARCHAR(16) NOT NULL, edit TEXT NOT NULL,
    before_score DOUBLE PRECISION, after_score DOUBLE PRECISION, created_at TIMESTAMPTZ DEFAULT NOW());`).catch(() => {})
}
