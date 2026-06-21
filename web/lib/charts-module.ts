/**
 * charts-module.ts — charts for dashboards, zero npm dep. A <Chart> React component (Chart.js via
 * CDN, like the Leaflet map) for line/bar/pie/doughnut/radar, PLUS quickChartUrl() that returns a
 * static chart IMAGE URL (QuickChart) — perfect for emails, PDFs and server-rendered reports where
 * you can't run React. Plus seriesFromRows() to shape DB rows into chart data.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const CHART = `"use client"
import { useEffect, useRef } from "react"
type Data = { labels: (string | number)[]; datasets: { label?: string; data: number[]; backgroundColor?: any; borderColor?: any }[] }
export function Chart({ type = "line", data, options, height = 320 }: { type?: "line" | "bar" | "pie" | "doughnut" | "radar"; data: Data; options?: any; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const inst = useRef<any>(null)
  useEffect(() => {
    const draw = () => {
      const C = (window as any).Chart
      if (!C || !ref.current) return
      inst.current?.destroy()
      inst.current = new C(ref.current, { type, data, options: { responsive: true, maintainAspectRatio: false, ...options } })
    }
    if (!(window as any).Chart) {
      const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/chart.js@4"; s.onload = draw; document.body.appendChild(s)
    } else draw()
    return () => inst.current?.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), type])
  return <div style={{ height }}><canvas ref={ref} /></div>
}
`

const HELPERS = `type Data = { labels: (string | number)[]; datasets: { label?: string; data: number[] }[] }
/** Shape DB rows into Chart.js data: one dataset, labels from labelKey, values from valueKey. */
export function seriesFromRows<T extends Record<string, any>>(rows: T[], labelKey: keyof T, valueKey: keyof T, label = ""): Data {
  return { labels: rows.map((r) => r[labelKey]), datasets: [{ label, data: rows.map((r) => Number(r[valueKey]) || 0) }] }
}
/** A static chart IMAGE url (QuickChart) — for emails / PDFs / server reports, no React needed. */
export function quickChartUrl(config: { type: string; data: Data; options?: any }, opts?: { w?: number; h?: number }): string {
  const c = encodeURIComponent(JSON.stringify(config))
  return \`https://quickchart.io/chart?w=\${opts?.w || 500}&h=\${opts?.h || 300}&c=\${c}\`
}
`

export function deterministicCharts(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /chart|gr[aá]fic|graph|dashboard|analytic|m[eé]trica|metric|kpi|report|reporte|visualiz|estad[ií]stic|plot|stats|trend|insight|operac|panel/.test(hay)
  if (!wants) return null
  return { files: [{ path: "components/Chart.tsx", content: CHART }, { path: "lib/charts.ts", content: HELPERS }] }
}
