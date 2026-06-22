/**
 * swarm-profile.ts — "Lighthouse for the swarm" (the addyosmani/agent-house idea, Puglit-native).
 * Scores a build's LLM-call trace on four categories — Cost, Latency, Reliability, Context — and
 * returns ranked, code-level fixes with estimated time saved. On a local A40 the $ is ~0, so "cost"
 * is wasted GPU-time: a premium model on a trivial step, or the same prompt sent twice. The point is
 * the same as agent-house's: make each run faster + cheaper, and feed that signal back to selection.
 */
import { traceSpans, type Span } from "@/lib/run-trace"

const TOK = (chars: number) => Math.ceil(chars / 4)
const CONTEXT_BLOAT_TOK = Number(process.env.PUGLIT_CONTEXT_BLOAT_TOK || 12000)
const TRIVIAL_TOK = 400 // a step whose whole prompt is tiny doesn't need the premium model

export type Audit = { id: string; category: "cost" | "latency" | "reliability" | "context"; score: number; findings: number; savingsMs: number; hint: string }
export type RunScore = {
  score: number
  categories: { cost: number; latency: number; reliability: number; context: number }
  audits: Audit[]
  run: { calls: number; totalMs: number; tokensIn: number; tokensOut: number; byTier: Record<string, number> }
  savingsMs: number
}

const WEIGHTS = { cost: 0.3, latency: 0.3, reliability: 0.2, context: 0.2 }
const pct = (x: number) => Math.max(0, Math.min(100, Math.round(100 * x)))

export function scoreRun(spans: Span[] = traceSpans()): RunScore | null {
  if (!spans.length) return null
  const calls = spans.length
  const totalMs = spans.reduce((s, x) => s + x.ms, 0)
  const avgMs = totalMs / calls
  const tokensIn = spans.reduce((s, x) => s + TOK(x.promptChars), 0)
  const tokensOut = spans.reduce((s, x) => s + TOK(x.outChars), 0)
  const byTier: Record<string, number> = {}
  for (const s of spans) byTier[s.tier] = (byTier[s.tier] || 0) + 1

  // ── audits (each 0..1, with a rough ms saving + a fix hint) ──
  const tierMismatch = spans.filter((s) => s.tier === "premium" && TOK(s.promptChars) < TRIVIAL_TOK)
  const bloat = spans.filter((s) => TOK(s.promptChars) > CONTEXT_BLOAT_TOK)
  const seen = new Map<string, number>(); let dups = 0
  for (const s of spans) { const k = `${s.tier}:${Math.round(s.promptChars / 50)}`; const n = (seen.get(k) || 0) + 1; seen.set(k, n); if (n > 1) dups++ }
  const errors = spans.filter((s) => !s.ok).length

  const audits: Audit[] = [
    { id: "model-tier-mismatch", category: "cost", score: 1 - tierMismatch.length / calls, findings: tierMismatch.length, savingsMs: Math.round(tierMismatch.reduce((s, x) => s + x.ms * 0.5, 0)), hint: "Usar MODELS.balanced/cheap para pasos triviales (prompt corto) en vez de premium." },
    { id: "duplicate-calls", category: "latency", score: 1 - dups / calls, findings: dups, savingsMs: Math.round(dups * avgMs), hint: "Cachear/dedupe prompts idénticos (mismo tier + tamaño) repetidos en el run." },
    { id: "context-bloat", category: "context", score: 1 - bloat.length / calls, findings: bloat.length, savingsMs: Math.round(bloat.reduce((s, x) => s + x.ms * 0.3, 0)), hint: `Recortar el contexto (>${CONTEXT_BLOAT_TOK} tok): mandar solo los archivos/tramos relevantes, no todo.` },
    { id: "errors-retries", category: "reliability", score: 1 - errors / calls, findings: errors, savingsMs: Math.round(errors * avgMs), hint: "Errores/reintentos: validar inputs antes de la llamada; bajar temperatura en JSON estructurado." },
  ]

  const cat = (c: Audit["category"]) => pct(audits.filter((a) => a.category === c).reduce((s, a) => s + a.score, 0) / Math.max(1, audits.filter((a) => a.category === c).length))
  const categories = { cost: cat("cost"), latency: cat("latency"), reliability: cat("reliability"), context: cat("context") }
  const score = Math.round(categories.cost * WEIGHTS.cost + categories.latency * WEIGHTS.latency + categories.reliability * WEIGHTS.reliability + categories.context * WEIGHTS.context)
  const savingsMs = audits.reduce((s, a) => s + a.savingsMs, 0)
  return { score, categories, audits: audits.sort((a, b) => b.savingsMs - a.savingsMs), run: { calls, totalMs: Math.round(totalMs), tokensIn, tokensOut, byTier }, savingsMs }
}

/** One-line human summary + the top fixes, for the build log. */
export function summarizeRun(rs: RunScore): string {
  const top = rs.audits.filter((a) => a.findings > 0).slice(0, 3).map((a) => `${a.id}×${a.findings} (~${Math.round(a.savingsMs / 1000)}s)`).join(", ")
  return `RUN SCORE ${rs.score}/100 · cost ${rs.categories.cost} · latency ${rs.categories.latency} · reliab ${rs.categories.reliability} · context ${rs.categories.context} · ${rs.run.calls} llamadas, ${Math.round(rs.run.totalMs / 1000)}s${top ? ` · fixes: ${top}` : " · sin desperdicio"}`
}
