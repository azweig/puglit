/**
 * interview-evolution.ts — the INTERVIEWER (discovery agent) evolves its STYLE (tone, how many
 * multiple-choice options, depth) from a dead-simple founder signal: 😀 / 😞 per question.
 *
 * Unlike the SkillOpt skills (validated by blueprint rollouts), the interviewer's quality is the
 * FOUNDER'S satisfaction — so the 😀-rate IS the validation gate. An optimizer proposes a bounded edit
 * to the style doc informed by the FROWNED-AT question kinds; it deploys as a new version; and a revert
 * guard rolls back if the new version's 😀-rate underperforms the previous one (closed-loop, bandit-like).
 * The style doc is stored in puglit_skills (area='interview') and overlays the interview prompt via skillFor().
 */
import { query } from "@/lib/db"
import { chatJSON, MODELS } from "@/lib/openai"
import { recordMetric } from "@/lib/swarm-metrics"
import { skillFor, loadActiveSkills } from "@/lib/skill-evolution"

const MIN_FB = Number(process.env.PUGLIT_INTERVIEW_MIN_FB || 15)

/** A founder rated a question 😀 (up) or 😞 (down). Tagged with the style version that produced it. */
export async function recordInterviewFeedback(up: boolean, kind: string, ver: number): Promise<void> {
  await recordMetric("interview_smile", up ? 1 : 0, { kind: String(kind || "").slice(0, 16), ver: Number(ver) || 0 }).catch(() => {})
}

/** The live interview-style version (0 = the seed; N = the Nth evolved version). */
export async function activeInterviewVersion(): Promise<number> {
  try { return (await query<{ v: number }>("SELECT COALESCE(MAX(version),0) v FROM puglit_skills WHERE area='interview' AND status='active'")).rows[0]?.v || 0 } catch { return 0 }
}

async function smileRate(ver: number, limit = 300): Promise<{ rate: number; n: number; frowns: string[] }> {
  try {
    const { rows } = await query<{ value: number; meta: { kind?: string } }>(
      "SELECT value, meta FROM puglit_metrics WHERE name='interview_smile' AND (meta->>'ver')::int = $1 ORDER BY created_at DESC LIMIT $2", [ver, limit])
    if (!rows.length) return { rate: 0, n: 0, frowns: [] }
    const up = rows.filter((r) => Number(r.value) > 0).length
    const frowns = [...new Set(rows.filter((r) => Number(r.value) === 0).map((r) => String(r.meta?.kind || "")).filter(Boolean))]
    return { rate: Math.round((up / rows.length) * 100), n: rows.length, frowns }
  } catch { return { rate: 0, n: 0, frowns: [] } }
}

/** Evolve the interview style from the 😀/😞 signal → deploy a new active version (gated by feedback volume). */
export async function evolveInterviewStyle(): Promise<{ evolved: boolean; from: number; to?: number; rate: number; n: number; edit?: string }> {
  await loadActiveSkills(true)
  const ver = await activeInterviewVersion()
  const { rate, n, frowns } = await smileRate(ver)
  if (n < MIN_FB) return { evolved: false, from: ver, rate, n }
  const current = skillFor("interview")
  const out = (await chatJSON([
    { role: "system", content: `You optimize the founder INTERVIEW STYLE doc for a product-discovery AI. Recent founders rated each question 😀 or 😞. Make a BOUNDED edit (≤3 add/delete/replace changes, ≤400 chars net, final doc ≤1400 chars) that fixes the frowned-at aspects while keeping what works. Stay warm, concise, founder-first. Return ONLY JSON {"doc":"<full revised style>","edit":"<one-line summary>"}.` },
    { role: "user", content: `CURRENT STYLE:\n${current}\n\nSIGNAL: 😀-rate ${rate}% over ${n} ratings. Founders frowned most on these question kinds: ${frowns.join(", ") || "(general tone)"}. Adjust tone / number of options / depth accordingly.` },
  ], { model: MODELS.premium, temperature: 0.4 }).catch(() => null)) as { doc?: string; edit?: string } | null
  const doc = String(out?.doc || "").trim()
  if (doc.length < 100 || doc.length > 2200 || doc === current) return { evolved: false, from: ver, rate, n }
  const nv = ver + 1
  await query("UPDATE puglit_skills SET status='archived' WHERE area='interview' AND status='active'").catch(() => {})
  await query("INSERT INTO puglit_skills (area, version, doc, val_score, status) VALUES ('interview',$1,$2,$3,'active')", [nv, doc, rate]).catch(() => {})
  return { evolved: true, from: ver, to: nv, rate, n, edit: String(out?.edit || "").slice(0, 160) }
}

/** Revert guard: if the live version underperforms the previous one on the 😀-rate (over enough
 *  samples), roll back. The founder's smile IS the gate — a bad edit can't survive. */
export async function consolidateInterviewStyle(): Promise<{ reverted: boolean; cur: number; prev: number }> {
  const ver = await activeInterviewVersion()
  if (ver < 1) return { reverted: false, cur: 0, prev: 0 }
  const cur = await smileRate(ver)
  const prev = await smileRate(ver - 1)
  if (cur.n >= MIN_FB && prev.n >= 5 && cur.rate < prev.rate - 3) {
    await query("UPDATE puglit_skills SET status='archived' WHERE area='interview' AND status='active'").catch(() => {})
    await query("UPDATE puglit_skills SET status='active' WHERE area='interview' AND version=$1", [ver - 1]).catch(() => {})
    return { reverted: true, cur: cur.rate, prev: prev.rate }
  }
  return { reverted: false, cur: cur.rate, prev: prev.rate }
}
