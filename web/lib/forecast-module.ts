/**
 * forecast-module.ts — time-series forecasting (inspired by google-research/timesfm). Zero-dep
 * baseline: linear trend + seasonal component (good enough for sales/demand/traffic projections).
 * For state-of-the-art accuracy, point FORECAST_URL at a TimesFM gateway (same shape). forecast(series).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const FORECAST = `/** Linear trend + seasonal-naive forecast. series = recent values (oldest→newest). */
export function forecast(series: number[], horizon = 7, season = 7): number[] {
  const n = series.length
  if (n < 2) return Array(horizon).fill(series[n - 1] ?? 0)
  // least-squares linear trend
  let sx = 0, sy = 0, sxy = 0, sxx = 0
  for (let i = 0; i < n; i++) { sx += i; sy += series[i]; sxy += i * series[i]; sxx += i * i }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1)
  const intercept = (sy - slope * sx) / n
  // seasonal residuals (value - trend) averaged per season slot
  const seas = Array(season).fill(0), cnt = Array(season).fill(0)
  for (let i = 0; i < n; i++) { const r = series[i] - (intercept + slope * i); seas[i % season] += r; cnt[i % season]++ }
  for (let s = 0; s < season; s++) seas[s] = cnt[s] ? seas[s] / cnt[s] : 0
  const out: number[] = []
  for (let h = 0; h < horizon; h++) { const i = n + h; out.push(Math.max(0, intercept + slope * i + seas[i % season])) }
  return out.map((v) => Math.round(v * 100) / 100)
}

/** Use a TimesFM (or any) gateway if configured, else the local baseline. */
export async function forecastAI(series: number[], horizon = 7): Promise<number[]> {
  const url = process.env.FORECAST_URL
  if (!url) return forecast(series, horizon)
  try {
    const r = await fetch(url.replace(/\\/$/, "") + "/forecast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ series, horizon }) }).then((x) => x.json())
    return r.forecast || forecast(series, horizon)
  } catch { return forecast(series, horizon) }
}
`

export function deterministicForecast(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /forecast|predic|pron[oó]stic|proyec|project|demand|demanda|ventas|sales|trend|tendenc|time series|serie temporal|analytics|m[eé]tricas|kpi|inventory|inventario|planning|planificaci/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/forecast.ts", content: FORECAST }] }
}
