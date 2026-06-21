/**
 * stats-module.ts — statistics & math for dashboards/operations, zero-dep. Descriptive stats
 * (mean/median/stddev/percentile), correlation, linear regression, growth rates, grouping &
 * aggregation, histograms, moving averages. The math layer every dashboard needs.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const STATS = `const num = (a: number[]) => a.filter((x) => typeof x === "number" && !isNaN(x))
export const sum = (a: number[]) => num(a).reduce((s, x) => s + x, 0)
export const mean = (a: number[]) => (num(a).length ? sum(a) / num(a).length : 0)
export function median(a: number[]) { const s = num(a).slice().sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0 }
export function stddev(a: number[]) { const m = mean(a); const v = mean(num(a).map((x) => (x - m) ** 2)); return Math.sqrt(v) }
export function percentile(a: number[], p: number) { const s = num(a).slice().sort((x, y) => x - y); if (!s.length) return 0; const i = (p / 100) * (s.length - 1); const lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo) }
export const min = (a: number[]) => Math.min(...num(a))
export const max = (a: number[]) => Math.max(...num(a))
/** Pearson correlation between two series. */
export function correlation(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length); if (n < 2) return 0
  const mx = mean(x.slice(0, n)), my = mean(y.slice(0, n))
  let sxy = 0, sx = 0, sy = 0
  for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; sxy += dx * dy; sx += dx * dx; sy += dy * dy }
  return sx && sy ? sxy / Math.sqrt(sx * sy) : 0
}
/** Simple linear regression → { slope, intercept, predict(x) }. */
export function linreg(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length); const mx = mean(x.slice(0, n)), my = mean(y.slice(0, n))
  let num2 = 0, den = 0; for (let i = 0; i < n; i++) { num2 += (x[i] - mx) * (y[i] - my); den += (x[i] - mx) ** 2 }
  const slope = den ? num2 / den : 0, intercept = my - slope * mx
  return { slope, intercept, predict: (xv: number) => intercept + slope * xv }
}
/** % growth between two values. */
export const growth = (from: number, to: number) => (from === 0 ? 0 : ((to - from) / Math.abs(from)) * 100)
/** Group rows + aggregate a field (sum|avg|count|min|max). */
export function groupBy<T extends Record<string, any>>(rows: T[], key: keyof T, field: keyof T, agg: "sum" | "avg" | "count" | "min" | "max" = "sum") {
  const m = new Map<any, number[]>()
  for (const r of rows) { const k = r[key]; if (!m.has(k)) m.set(k, []); m.get(k)!.push(Number(r[field]) || 0) }
  const out: Record<string, number> = {}
  for (const [k, vals] of m) out[String(k)] = agg === "count" ? vals.length : agg === "avg" ? mean(vals) : agg === "min" ? min(vals) : agg === "max" ? max(vals) : sum(vals)
  return out
}
/** Histogram into n buckets. */
export function histogram(a: number[], buckets = 10) {
  const lo = min(a), hi = max(a), w = (hi - lo) / buckets || 1
  const bins = Array(buckets).fill(0)
  for (const x of num(a)) bins[Math.min(buckets - 1, Math.floor((x - lo) / w))]++
  return bins.map((count, i) => ({ from: lo + i * w, to: lo + (i + 1) * w, count }))
}
/** Moving average over a window. */
export function movingAvg(a: number[], window = 7) { return a.map((_, i) => mean(a.slice(Math.max(0, i - window + 1), i + 1))) }
`

export function deterministicStats(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /stat|estad[ií]stic|m[eé]trica|metric|dashboard|analytic|kpi|report|reporte|chart|gr[aá]fico|aggregat|average|promedio|sum|correlat|trend|insight|operac|finance|datos/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/stats.ts", content: STATS }] }
}
