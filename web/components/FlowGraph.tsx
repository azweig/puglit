"use client"
/**
 * FlowGraph — n8n-style horizontal flow of the build pipeline. Nodes (steps) are wired
 * left→right; the wire INTO the running node animates with flowing dots and the node glows.
 * Done = emerald, pending = dim. Click a node → its live detail.
 */
import { useState } from "react"

export type Step = { key: string; label: string; status: "pending" | "running" | "done" | "error"; detail?: string }

const ICON: Record<string, string> = {
  "data-model": "🧠", research: "🔎", contracts: "📐", brand: "🎨", design: "🖼️",
  schema: "🗄️", seed: "🌱", erd: "🔗", auth: "🔐", payments: "💳", email: "✉️",
  crons: "⏰", admin: "🛠️", dashboard: "📊", analytics: "📈", seo: "🔍", security: "🛡️",
  engine: "⚙️", stakeholder: "🐝", "docs-tech": "📄", "docs-biz": "💼", env: "🔧",
  deliver: "🚀", "ci-verify": "✅",
}
const PHASE_OF: Record<string, string> = {
  "data-model": "Descubrir", research: "Descubrir", contracts: "Descubrir",
  brand: "Diseño", design: "Diseño",
  schema: "Datos", seed: "Datos", erd: "Datos",
  auth: "Plataforma", payments: "Plataforma", email: "Plataforma", crons: "Plataforma",
  admin: "Plataforma", dashboard: "Plataforma", analytics: "Plataforma", seo: "Plataforma", security: "Plataforma",
  engine: "Producto", stakeholder: "Supervisión",
  "docs-tech": "Entrega", "docs-biz": "Entrega", env: "Entrega", deliver: "Entrega", "ci-verify": "Entrega",
}

export function FlowGraph({ steps }: { steps: Step[] }) {
  const [sel, setSel] = useState<string | null>(null)
  const selStep = steps.find((s) => s.key === sel)
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-violet/10 to-transparent p-4 sm:p-5">
      <div className="overflow-x-auto pb-3">
        <div className="flex items-stretch gap-0 min-w-max px-1 py-6">
          {steps.map((s, i) => {
            const prev = steps[i - 1]
            const flowing = s.status === "running" || (s.status === "done" && prev?.status === "done" && steps[i + 1]?.status !== "done")
            const phaseStart = i === 0 || PHASE_OF[s.key] !== PHASE_OF[prev?.key]
            return (
              <div key={s.key} className="flex items-center">
                {i > 0 && (
                  <div className="relative w-8 h-0.5 mx-0.5 shrink-0">
                    <div className={`absolute inset-0 rounded-full ${s.status !== "pending" ? "bg-violet/40" : "bg-white/10"}`} />
                    {flowing && <div className="absolute inset-0 rounded-full dash-flow" />}
                  </div>
                )}
                <button onClick={() => setSel(s.key)} title={s.detail || s.label}
                  className={`relative shrink-0 w-[112px] rounded-xl border px-2.5 py-2 text-left transition-all ${
                    s.status === "running" ? "border-violet/70 bg-violet/15 shadow-[0_0_18px_rgba(124,58,237,.45)] ag-working"
                    : s.status === "done" ? "border-emerald-500/40 bg-emerald-500/5"
                    : s.status === "error" ? "border-amber-500/50 bg-amber-500/10"
                    : "border-white/10 bg-ink2 opacity-60"} ${sel === s.key ? "ring-2 ring-violet-bright" : ""}`}>
                  {phaseStart && <span className="absolute -top-5 left-0 text-[9px] font-bold uppercase tracking-wider text-violet-bright/80 whitespace-nowrap">{PHASE_OF[s.key]}</span>}
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{ICON[s.key] || "•"}</span>
                    <span className={`ag-dot w-1.5 h-1.5 rounded-full ${s.status === "done" ? "bg-emerald-400" : s.status === "running" ? "bg-violet-bright" : s.status === "error" ? "bg-amber-400" : "bg-white/20"}`} />
                    {s.status === "done" && <span className="ml-auto text-emerald-400 text-xs">✓</span>}
                  </div>
                  <div className={`mt-1 text-[11px] font-semibold leading-tight line-clamp-2 ${s.status === "pending" ? "text-white/40" : "text-white"}`}>{s.label.replace(/^[^·]*·\s*/, "")}</div>
                </button>
              </div>
            )
          })}
        </div>
      </div>
      {selStep && (
        <div className="mt-1 rounded-xl border border-violet/30 bg-violet/10 px-4 py-2.5 text-sm">
          <span className="font-bold text-white">{ICON[selStep.key]} {selStep.label}</span>
          <span className="text-white/70"> — {selStep.detail || (selStep.status === "pending" ? "en espera" : selStep.status === "running" ? "trabajando…" : selStep.status)}</span>
        </div>
      )}
    </div>
  )
}
