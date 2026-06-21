/**
 * swarm-metrics.ts — SWARM INFRA (crítica: "medí por evidencia, no por mecanismo"). Records the
 * KPIs that actually validate Puglit instead of XP/levels: first-build-success-rate, runtime
 * smoke-pass-rate, inter-judge agreement, swarm-vs-single ablation outcomes. Postgres-backed.
 */
import { query } from "@/lib/db"

/** Record a metric sample (value 0..1 for rates, or any number). */
export async function recordMetric(name: string, value: number, meta: Record<string, unknown> = {}): Promise<void> {
  await query("INSERT INTO puglit_metrics (name, value, meta) VALUES ($1,$2,$3)", [name, value, JSON.stringify(meta)]).catch(() => {})
}

/** Aggregate rate for a metric over a window (e.g. build_success → 0.0–1.0). */
export async function metricRate(name: string, sinceDays = 30): Promise<{ rate: number; n: number }> {
  try {
    const { rows } = await query<{ rate: string; n: number }>("SELECT AVG(value) AS rate, COUNT(*)::int AS n FROM puglit_metrics WHERE name=$1 AND created_at > NOW() - ($2 || ' days')::interval", [name, String(sinceDays)])
    return { rate: Number(rows[0]?.rate || 0), n: rows[0]?.n || 0 }
  } catch { return { rate: 0, n: 0 } }
}

/** The headline dashboard: the four metrics the critics said would make-or-break the thesis. */
export async function scorecard(): Promise<Record<string, { rate: number; n: number }>> {
  const names = ["build_success", "smoke_pass", "judge_agreement", "ablation_swarm_win"]
  const out: Record<string, { rate: number; n: number }> = {}
  for (const n of names) out[n] = await metricRate(n)
  return out
}
