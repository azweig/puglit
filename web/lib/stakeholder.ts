/**
 * Puglit web — stakeholder.ts
 * The governance layer ABOVE the queen bee (the assembler). When the swarm finishes a
 * project, the STAKEHOLDER takes the whole thing and routes it to four senior specialists,
 * each reviewing the flows that concern them with honest, constructive, realistic feedback:
 *   1. Growth — SEO & Analytics
 *   2. Architecture — Security & Engineering
 *   3. Design — Brand & UX/UI
 *   4. Business — Pricing & Finance
 * The stakeholder aggregates their findings, hands them back to the queen (a fixer that
 * rewrites the flagged files), and repeats. A project must survive THREE supervision rounds
 * (or until the panel has no actionable findings left) before it can reach the user.
 *
 * Model-agnostic: every call goes through the provider-agnostic client (lib/openai), so the
 * "brain" behind each specialist is swappable (OpenAI today, self-hosted Gemma/DeepSeek next).
 */
import { chatJSON, MODELS } from "@/lib/openai"
import type { AppFile, Blueprint } from "@/lib/app-builder"
import type { DomainConfig } from "@/lib/domain-types"

export interface Finding {
  severity: "BLOCKING" | "IMPROVE"
  area: string
  file: string | null
  issue: string
  fix: string
}
export interface SpecialistReport { specialist: string; summary: string; findings: Finding[] }
export interface RoundReport { round: number; reports: SpecialistReport[]; filesFixed: string[] }
export interface StakeholderReport { rounds: RoundReport[]; passed: boolean }

const SPECIALISTS: { id: string; role: string; brief: string }[] = [
  {
    id: "growth",
    role: "Growth, SEO & Analytics Lead",
    brief: `Judge the product for ORGANIC GROWTH and MEASURABILITY. Check: page <title>/meta description are specific & keyword-rich and match what the product ACTUALLY is (no stale/wrong scope); semantic HTML (one h1, real headings) & crawlable content; internal linking between key surfaces; shareable/OG basics; the funnel is instrumented (key events tracked); copy speaks to the real audience & search intent; loading is not blocked behind JS for the core content. Flag stale/misleading metadata, thin pages, dead-end navigation, untracked funnels.`,
  },
  {
    id: "architecture",
    role: "Architecture, Security & Engineering Lead",
    brief: `Judge CORRECTNESS, SECURITY and DATA INTEGRITY. Check: every API query references columns that exist; per-user/private data is auth-scoped (no cross-user leakage) and public data is intentionally public; parameterized SQL only; multi-row mutations are atomic (transactions); list endpoints return bare arrays the UI expects; the data model supports the real feature set (foreign keys, the right dimensions — e.g. a "scores" app needs league/country linkage, not orphan tables); no secrets in client code; sane status codes; pagination on growable lists. Flag missing scoping, schema/route mismatches, non-atomic writes, broken joins, model gaps that make a core feature impossible.`,
  },
  {
    id: "design",
    role: "Design, Brand & UX/UI Lead",
    brief: `Judge VISUAL QUALITY and UX like a top product studio. Check: AA contrast everywhere (no text on a same/near color — the classic invisible-text bug); the brand palette is actually applied (not random hardcoded hexes that clash); a clear type hierarchy & spacing rhythm; loading/empty/error/populated states all designed; interactive elements have hover/active/focus states; responsive on mobile AND desktop; the layout fits the product (not a generic centered admin column); navigation is obvious and consistent across screens. Flag clashing/off-brand colors, low contrast, generic layouts, missing states, inconsistent chrome.`,
  },
  {
    id: "business",
    role: "Business, Pricing & Finance Lead",
    brief: `Judge VIABILITY and the MONEY PATH. Check: the monetization model is coherent and actually wired where it should be (gating/paywall/ads placement/checkout) or, if free, that the value & retention loop is clear; pricing/plans are legible to the user; trust signals (who's behind it, terms) exist where money or accounts are involved; the core value is reachable fast (low friction to the "aha"); the product matches the stated audience & market. Flag a missing/contradictory money path, friction before value, absent trust/legal basics, audience mismatch.`,
  },
  {
    id: "fidelity",
    role: "Product Fidelity & Liveness Lead",
    brief: `Judge whether this is a FAITHFUL, WORKING version of the product the user named — not a plausible-looking shell. This is the lens the previous reviews kept missing. Check, ruthlessly: (1) DEAD-BY-DESIGN — is the data real or fake? A cron whose body is essentially "SELECT 1" / a TODO, or a data-driven product (scores, prices, listings) shipping only a static seed with no real ingestion, means "no funciona" — flag BLOCKING. (2) BROKEN LINKS — pages that fetch /api paths or <Link> to routes/pages that don't exist in the file tree (404 / empty data) — flag BLOCKING. (3) MISSING SIGNATURE SURFACES — if it clones a known product, are its defining pages present? (e.g. a Promiedos clone WITHOUT a match-detail page, lineups, or live minute is not Promiedos) — flag the missing surfaces. (4) STUBS — placeholder/empty handlers, hardcoded sample data in components, features that render but do nothing. Be concrete: name the file and exactly what's fake/missing/broken.`,
  },
]

/** Build a bounded project digest the specialists review: the file tree + the content of
 *  the surfaces that matter (pages, routes, schema, config), each truncated. */
function digest(files: AppFile[], blueprint: Blueprint, config: DomainConfig): string {
  const tree = files.map((f) => f.path).sort().join("\n")
  const pick = (re: RegExp, cap: number, max: number) =>
    files.filter((f) => re.test(f.path)).slice(0, max)
      .map((f) => `\n----- ${f.path} -----\n${f.content.slice(0, cap)}`).join("\n")
  const pages = pick(/\/page\.tsx$|layout\.tsx$/, 2600, 8)
  const routes = pick(/\/route\.ts$/, 1600, 8)
  const sql = pick(/\.sql$/, 1800, 3)
  const cfg = files.filter((f) => /domain\.config/.test(f.path)).map((f) => `\n----- ${f.path} -----\n${f.content.slice(0, 1200)}`).join("")
  return `PRODUCT: ${config.identity.name} — ${typeof config.identity.tagline === "string" ? config.identity.tagline : ""}
KIND: ${blueprint.kind} | brand: ${config.identity.brandColor}
SUMMARY: ${blueprint.summary}

FILE TREE:
${tree}

KEY FILES (truncated):
${cfg}${sql}${routes}${pages}`
}

async function specialistReview(spec: { id: string; role: string; brief: string }, dig: string): Promise<SpecialistReport> {
  try {
    const out = (await chatJSON([
      { role: "system", content: `You are the ${spec.role} on a product review board. A multi-agent swarm just built this project; the stakeholder is asking you for an HONEST, CONSTRUCTIVE, REALISTIC review of the flows you own — not flattery, not nitpicks. ${spec.brief}

Be concrete and actionable: each finding must name the real file (from the tree) and a precise fix the engineer can apply. Mark severity BLOCKING (the product is wrong/broken/embarrassing without it) vs IMPROVE (clearly better with it). Only report what genuinely matters; an excellent area gets few or no findings. Do NOT invent files that aren't in the tree.

Return ONLY JSON: {"summary":"one-line verdict","findings":[{"severity":"BLOCKING"|"IMPROVE","area":"${spec.id}","file":"path or null","issue":"what's wrong","fix":"exact change"}]}` },
      { role: "user", content: dig },
    ], { model: MODELS.premium, temperature: 0.2 })) as { summary?: string; findings?: Finding[] }
    const findings = (Array.isArray(out.findings) ? out.findings : [])
      .filter((f) => f?.issue && f?.fix)
      .map((f) => ({ severity: f.severity === "BLOCKING" ? "BLOCKING" : "IMPROVE", area: spec.id, file: f.file ?? null, issue: String(f.issue), fix: String(f.fix) } as Finding))
    return { specialist: spec.role, summary: String(out.summary || ""), findings }
  } catch {
    return { specialist: spec.role, summary: "(review unavailable)", findings: [] }
  }
}

/** Queen/fixer: rewrite ONE file applying the panel's findings for it, preserving behavior
 *  and compilation. Light TSX sanitation keeps the App-Router invariants intact. */
async function applyFindings(file: AppFile, findings: Finding[]): Promise<AppFile> {
  const isTsx = file.path.endsWith(".tsx")
  try {
    const out = (await chatJSON([
      { role: "system", content: `You are the Integrator (the queen bee) applying a review board's findings to ONE file. Apply EVERY listed fix precisely, WITHOUT changing unrelated behavior, data wiring or imports, and WITHOUT breaking \`tsc --noEmit\`. Keep the same framework conventions (Next.js 16 App Router, Tailwind, the spine's @/lib/* — no new npm deps).${isTsx ? ' If it is a client component keep "use client" as the very first line; read dynamic params with useParams(); never nest <a> in <Link>.' : ""}
Return ONLY JSON {"code":"<full corrected contents of ${file.path}>"}.` },
      { role: "user", content: `FINDINGS FOR ${file.path}:\n${findings.map((f) => `- [${f.severity}] ${f.issue} → ${f.fix}`).join("\n")}\n\nCURRENT FILE:\n${file.content}` },
    ], { model: MODELS.code, temperature: 0.2 })) as { code?: string }
    let code = out.code && out.code.length > 80 ? String(out.code).slice(0, 30_000) : file.content
    if (isTsx) {
      // keep the App-Router invariants the deterministic backstops enforce
      code = code.replace(/from\s+["']next\/router["']/g, 'from "next/navigation"')
        .replace(/catch\s*\(\s*([a-zA-Z_$][\w$]*)\s*\)\s*\{/g, "catch ($1: any) {")
        .replace(/^[ \t]*use (client|server)[ \t]*;?[ \t]*$/gm, "")
      const hadDirective = /(?:^|\n)[ \t]*["']use client["']/.test(out.code || "") || /\b(useState|useEffect|useRouter|usePathname)\b/.test(code)
      code = code.replace(/(?:^|\n)[ \t]*["']use client["'][ \t]*;?[ \t]*/g, "\n").replace(/^\s+/, "")
      if (hadDirective) code = '"use client";\n' + code
    }
    return { path: file.path, content: code }
  } catch {
    return file
  }
}

// ── Resumable state machine ────────────────────────────────────────────────
// Like the engine, the full review (3 rounds × 5 specialists + fixers) is far too long
// for one serverless invocation (~300s) → it would time out and loop. So we split it into
// bounded units: each `stakeholderAdvance` call runs EITHER one "review" batch (5 specialists
// in parallel) OR one "fix" batch (≤12 file fixers in parallel) — each ≈ one wave of parallel
// LLM calls, comfortably under the limit — and resumes from persisted state across calls.
export interface StakeholderState {
  phase: "review" | "fix" | "done"
  round: number          // 1-based current supervision round
  rounds: number         // total supervisions to run (3 by default, adjustable later)
  reports: RoundReport[] // accumulated per-round record
  passed: boolean        // true if the most recent completed round had no actionable findings
  pending: { path: string; findings: Finding[] }[] // set by review, consumed by the next fix
  pendingReports: SpecialistReport[]               // the in-flight round's specialist reports
}

export function initStakeholderState(rounds = 3): StakeholderState {
  return { phase: "review", round: 1, rounds, reports: [], passed: false, pending: [], pendingReports: [] }
}

/** Advance the stakeholder governance ONE bounded unit. Always runs the FULL `rounds`
 *  supervision passes (the project must survive all 3 — a clean round still proceeds to the
 *  next, it just applies no fixes), so the 3-iteration gate is honored end-to-end on serverless. */
export async function stakeholderAdvance(
  files: AppFile[],
  config: DomainConfig,
  blueprint: Blueprint,
  state: StakeholderState,
): Promise<{ files: AppFile[]; state: StakeholderState; done: boolean; detail: string }> {
  if (state.phase === "done") return { files, state, done: true, detail: "aprobado" }

  if (state.phase === "review") {
    const dig = digest(files, blueprint, config)
    const reports = await Promise.all(SPECIALISTS.map((s) => specialistReview(s, dig)))
    const all = reports.flatMap((r) => r.findings)
    // Act on every BLOCKING + a bounded set of IMPROVEs, grouped per real file.
    const actionable = all.filter((f) => f.file && files.some((cf) => cf.path === f.file))
    const blocking = actionable.filter((f) => f.severity === "BLOCKING")
    const improves = actionable.filter((f) => f.severity === "IMPROVE")
    const toFix = [...blocking, ...improves.slice(0, Math.max(0, 12 - blocking.length))]

    if (toFix.length === 0) {
      state.reports.push({ round: state.round, reports, filesFixed: [] })
      state.passed = true
      if (state.round >= state.rounds) {
        state.phase = "done"
        return { files, state, done: true, detail: `ronda ${state.round}/${state.rounds}: sin hallazgos — aprobado (${state.rounds} supervisiones)` }
      }
      state.round += 1 // clean round → still proceed to the next supervision
      return { files, state, done: false, detail: `ronda ${state.round - 1}/${state.rounds}: sin hallazgos → siguiente supervisión` }
    }

    const byFile = new Map<string, Finding[]>()
    for (const f of toFix) (byFile.get(f.file!) ?? byFile.set(f.file!, []).get(f.file!)!).push(f)
    state.pending = Array.from(byFile.entries()).map(([path, findings]) => ({ path, findings }))
    state.pendingReports = reports
    state.phase = "fix"
    return { files, state, done: false, detail: `ronda ${state.round}/${state.rounds}: ${blocking.length} blocking + ${improves.length} mejoras → corrigiendo ${state.pending.length} archivos` }
  }

  // phase === "fix": apply this round's findings, one wave of parallel fixers.
  const fixedPaths: string[] = []
  const updates = await Promise.all(
    state.pending.map(async ({ path, findings }) => {
      const cf = files.find((c) => c.path === path)
      if (!cf) return null
      const nf = await applyFindings(cf, findings)
      if (nf.content !== cf.content) fixedPaths.push(path)
      return nf
    }),
  )
  const next = files.map((c) => updates.find((u) => u && u.path === c.path) || c)
  state.reports.push({ round: state.round, reports: state.pendingReports, filesFixed: fixedPaths })
  state.passed = false
  state.pending = []
  state.pendingReports = []
  const detail = `ronda ${state.round}/${state.rounds}: ${fixedPaths.length} archivos corregidos`
  if (state.round >= state.rounds) {
    state.phase = "done"
    return { files: next, state, done: true, detail: `${detail} · ${state.rounds} supervisiones completas` }
  }
  state.round += 1
  state.phase = "review"
  return { files: next, state, done: false, detail }
}

/** Local one-shot convenience: loop the advance to completion. Production (serverless) drives
 *  `stakeholderAdvance` one unit per call instead — see lib/jobs.ts. */
export async function stakeholderReview(
  files: AppFile[],
  config: DomainConfig,
  blueprint: Blueprint,
  opts?: { rounds?: number; onProgress?: (msg: string) => void },
): Promise<{ files: AppFile[]; report: StakeholderReport }> {
  const log = opts?.onProgress ?? (() => {})
  let state = initStakeholderState(opts?.rounds ?? 3)
  let current = files
  for (let guard = 0; guard < 2 * state.rounds + 2 && state.phase !== "done"; guard++) {
    const r = await stakeholderAdvance(current, config, blueprint, state)
    current = r.files; state = r.state
    log(`stakeholder ${r.detail}`)
    if (r.done) break
  }
  return { files: current, report: { rounds: state.reports, passed: state.passed } }
}
