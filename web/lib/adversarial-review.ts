/**
 * adversarial-review.ts — pre-delivery multi-persona review (the addyosmani/adverse pattern,
 * Puglit-native). THREE orthogonal lenses (Auditor=logic, Adversary=abuse/security, Pragmatist=
 * design health) review the generated deliverable independently, then a DETERMINISTIC cross-
 * examination groups findings by how many lenses reported them (≥2 = cross-validated/real, 1 = a
 * solo hunch) → a SHIP / SHIP-WITH-CAVEATS / BLOCK verdict. One model, three personas: cheaper than
 * multi-model, and the cross-lens consensus cuts the single-model anchoring bias. Confirmed CRITICAL
 * findings drive one bounded repair pass before delivery. "External eyes before it ships."
 */
import { chatJSON, MODELS } from "@/lib/openai"
import { PLAYBOOK } from "@/lib/playbooks"
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

export type Severity = "critical" | "warning" | "info"
export type Finding = { severity: Severity; file: string | null; title: string; detail: string; fix: string | null; lens: string }
export type LensReview = { persona: string; verdict: "approve" | "conditional" | "reject"; summary: string; findings: Finding[] }
export type ReviewResult = {
  verdict: "SHIP" | "SHIP-WITH-CAVEATS" | "BLOCK"
  crossValidated: Finding[] // reported by ≥2 lenses (the real signal)
  solo: Finding[] // one lens only (a hunch)
  reviews: LensReview[]
  repaired: string[]
}

const LENS = {
  auditor: `You are the AUDITOR. Lens: LOGIC & CORRECTNESS only. Find: wrong domain math (pricing/totals/dates/percentages), unhandled edge cases, off-by-one, naming/schema MISMATCHES (the same concept under two different table or column names), hardcoded magic values, duplicated business rules. STAY IN YOUR LANE — do NOT report security or design-taste issues; the other reviewers own those.`,
  adversary: `You are the ADVERSARY. Lens: ABUSE & SECURITY only, biased to REJECT. Find: SQL injection / string-built queries, missing auth or per-user scoping (IDOR), race conditions, double-booking/double-spend, integer/precision/overflow bugs, unvalidated input reaching the DB, secrets in code. STAY IN YOUR LANE — assume a hostile user; do NOT report pure style or logic-only issues.`,
  pragmatist: `You are the PRAGMATIST. Lens: DESIGN HEALTH & MAINTAINABILITY only. Find: business logic living in route handlers instead of lib/ (no single source of truth), DRY violations (the same rule copy-pasted), dead/unreachable routes, missing tests or low coverage for the domain logic, over-engineering. Ship ONLY if it's correct AND maintainable. STAY IN YOUR LANE — do NOT re-report logic bugs or security holes.`,
} as const

const SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string" }, summary: { type: "string" },
    findings: { type: "array", items: { type: "object", properties: {
      severity: { type: "string" }, file: { type: ["string", "null"] }, title: { type: "string" },
      detail: { type: "string" }, fix: { type: ["string", "null"] },
    }, required: ["severity", "title", "detail"] } },
  }, required: ["verdict", "findings"],
} as const

/** A focused digest of the domain-critical files — local models have small context windows. */
function digest(files: AppFile[]): string {
  const pick = files.filter((f) =>
    (/^lib\/.+\.ts$/.test(f.path) && !/\.(test|spec)\.ts$/.test(f.path)) ||
    /^app\/api\/.+route\.ts$/.test(f.path) || f.path === "sql/app.sql")
  const order = (f: AppFile) => (f.path === "sql/app.sql" ? 0 : f.path.startsWith("lib/") ? 1 : 2)
  pick.sort((a, b) => order(a) - order(b))
  let total = 0; const out: string[] = []
  for (const f of pick) {
    const body = f.content.slice(0, 2200)
    if (total + body.length > 24000) break
    out.push(`// ===== ${f.path} =====\n${body}`); total += body.length
  }
  return out.join("\n\n")
}

const sevRank = (s: Severity) => (s === "critical" ? 3 : s === "warning" ? 2 : 1)
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter((w) => w.length > 3).sort().slice(0, 5).join(" ")
const keyOf = (f: Finding) => `${(f.file || "").replace(/.*\//, "")}|${norm(f.title)}`

async function reviewLens(persona: keyof typeof LENS, product: string, source: string): Promise<LensReview | null> {
  const out = (await chatJSON([
    { role: "system", content: `${LENS[persona]}

Review the deliverable. Return ONLY JSON {"verdict":"approve|conditional|reject","summary":"<one sentence>","findings":[{"severity":"critical|warning|info","file":"<path|null>","title":"<short noun phrase>","detail":"<2-4 sentences with the concrete evidence>","fix":"<concrete remediation|null>"}]}. Report ONLY real issues in YOUR lane; an empty findings array + "approve" is the correct answer if you find nothing. Cite the file for every finding.` },
    { role: "user", content: `Product: ${product}\n\n${source}` },
  ], { model: MODELS.premium, temperature: 0.2, schema: SCHEMA }).catch(() => null)) as { verdict?: string; summary?: string; findings?: unknown[] } | null
  if (!out) return null
  const verdict = (["approve", "conditional", "reject"].includes(String(out.verdict)) ? out.verdict : "conditional") as LensReview["verdict"]
  const findings: Finding[] = (Array.isArray(out.findings) ? out.findings : []).slice(0, 12).map((x) => {
    const f = x as Record<string, unknown>
    return {
      severity: (["critical", "warning", "info"].includes(String(f?.severity)) ? f.severity : "warning") as Severity,
      file: f?.file ? String(f.file).slice(0, 120) : null,
      title: String(f?.title || "").slice(0, 140), detail: String(f?.detail || "").slice(0, 600),
      fix: f?.fix ? String(f.fix).slice(0, 400) : null, lens: persona,
    }
  }).filter((f) => f.title)
  return { persona, verdict, summary: String(out.summary || "").slice(0, 240), findings }
}

/** Bounded repair of files named in cross-validated CRITICAL findings (minimal, guided fix). */
async function repairFindings(files: AppFile[], findings: Finding[]): Promise<string[]> {
  const fixed: string[] = []
  const targets = findings.filter((f) => f.severity === "critical" && f.file).slice(0, 3)
  for (const f of targets) {
    const file = files.find((x) => x.path === f.file || x.path.endsWith("/" + f.file!.replace(/.*\//, "")))
    if (!file || !/\.(ts|tsx)$/.test(file.path)) continue
    const out = (await chatJSON([
      { role: "system", content: `You are a Backend Engineer fixing ONE confirmed issue in ONE file. Return ONLY JSON {"code":"<the full corrected file>"} — no prose. Make the MINIMAL change that resolves the issue; do NOT rewrite working parts, add deps, or change unrelated behavior.

${PLAYBOOK.dev}` },
      { role: "user", content: `Confirmed issue: ${f.title}\nDetail: ${f.detail}\nSuggested fix: ${f.fix || "(use your judgement)"}\n\n--- ${file.path} ---\n${file.content.slice(0, 14000)}` },
    ], { model: MODELS.code, temperature: 0.1 }).catch(() => null)) as { code?: string } | null
    if (out?.code && out.code.length > 60) { file.content = String(out.code).slice(0, 30000); fixed.push(file.path) }
  }
  return fixed
}

function synthesize(reviews: LensReview[]): { crossValidated: Finding[]; solo: Finding[] } {
  const groups = new Map<string, Finding[]>()
  for (const r of reviews) for (const f of r.findings) {
    const k = keyOf(f); const g = groups.get(k); if (g) g.push(f); else groups.set(k, [f])
  }
  const crossValidated: Finding[] = [], solo: Finding[] = []
  for (const g of groups.values()) {
    const lenses = new Set(g.map((f) => f.lens))
    const top = g.sort((a, b) => sevRank(b.severity) - sevRank(a.severity))[0]
    if (lenses.size >= 2) crossValidated.push({ ...top, detail: `${top.detail} [confirmado por ${[...lenses].join("+")}]` })
    else solo.push(top)
  }
  const bySev = (a: Finding, b: Finding) => sevRank(b.severity) - sevRank(a.severity)
  return { crossValidated: crossValidated.sort(bySev), solo: solo.sort(bySev) }
}

/** Run the 3-lens adversarial review over the final deliverable, cross-examine, repair criticals,
 *  re-check, and return the verdict + findings. Mutates `files` if a repair lands. */
export async function adversarialReview(config: DomainConfig, bp: Blueprint, files: AppFile[]): Promise<ReviewResult | null> {
  const product = `${config.identity.name} — ${bp.summary}`
  const source = digest(files)
  if (source.length < 200) return null
  const reviews = (await Promise.all((Object.keys(LENS) as (keyof typeof LENS)[]).map((p) => reviewLens(p, product, source)))).filter(Boolean) as LensReview[]
  if (reviews.length < 2) return null
  let { crossValidated, solo } = synthesize(reviews)

  // CROSS-EXAMINED CRITICALS → one bounded repair pass, then resynthesize from a fresh review.
  let repaired: string[] = []
  const confirmedCritical = crossValidated.filter((f) => f.severity === "critical")
  if (confirmedCritical.length) {
    repaired = await repairFindings(files, confirmedCritical).catch(() => [])
    if (repaired.length) {
      const reSource = digest(files)
      const reReviews = (await Promise.all((Object.keys(LENS) as (keyof typeof LENS)[]).map((p) => reviewLens(p, product, reSource)))).filter(Boolean) as LensReview[]
      if (reReviews.length >= 2) ({ crossValidated, solo } = synthesize(reReviews))
    }
  }

  const reject = reviews.filter((r) => r.verdict === "reject").length
  const stillCritical = crossValidated.some((f) => f.severity === "critical")
  const verdict: ReviewResult["verdict"] =
    stillCritical || reject >= 2 ? "BLOCK"
    : (crossValidated.length || solo.some((f) => f.severity === "critical") || reviews.some((r) => r.verdict !== "approve")) ? "SHIP-WITH-CAVEATS"
    : "SHIP"
  return { verdict, crossValidated, solo, reviews, repaired }
}
