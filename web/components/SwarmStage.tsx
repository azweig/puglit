"use client"
/**
 * SwarmStage — the live, visual representation of the agent swarm building a project.
 * Maps the job's steps to agent nodes grouped into phase clusters, animates them by
 * status (pending / working / done), and renders a dedicated Stakeholder panel (the
 * queen + 5 specialists) that activates during the supervision step.
 */
import { Mark } from "@/components/Mark"

export type Step = { key: string; label: string; status: "pending" | "running" | "done" | "error"; detail?: string }

type Agent = { key: string; icon: string; name: string }
type Cluster = { id: string; title: string; icon: string; agents: Agent[] }

// Phase clusters → the agents (job steps) inside each. Order follows the pipeline.
const CLUSTERS: Cluster[] = [
  { id: "discover", title: "Descubrir", icon: "🧭", agents: [
    { key: "data-model", icon: "🧠", name: "Arquitecto de datos" },
    { key: "research", icon: "🔎", name: "Researcher" },
    { key: "contracts", icon: "📐", name: "Contratos" },
  ] },
  { id: "design", title: "Marca y diseño", icon: "🎨", agents: [
    { key: "brand", icon: "🎨", name: "Marca / logo" },
    { key: "design", icon: "🖼️", name: "Diseño" },
  ] },
  { id: "data", title: "Datos", icon: "🗄️", agents: [
    { key: "schema", icon: "🗄️", name: "Esquema SQL" },
    { key: "seed", icon: "🌱", name: "Seed" },
    { key: "erd", icon: "🔗", name: "Diagrama ER" },
  ] },
  { id: "platform", title: "Plataforma", icon: "🧱", agents: [
    { key: "auth", icon: "🔐", name: "Auth" },
    { key: "payments", icon: "💳", name: "Pagos" },
    { key: "email", icon: "✉️", name: "Email" },
    { key: "crons", icon: "⏰", name: "Crons" },
    { key: "admin", icon: "🛠️", name: "Admin" },
    { key: "dashboard", icon: "📊", name: "Dashboard" },
    { key: "analytics", icon: "📈", name: "Analytics" },
    { key: "seo", icon: "🔍", name: "SEO" },
    { key: "security", icon: "🛡️", name: "Seguridad" },
  ] },
  { id: "product", title: "Producto", icon: "⚙️", agents: [
    { key: "engine", icon: "⚙️", name: "Engine — lógica única" },
  ] },
  { id: "deliver", title: "Entrega", icon: "🚀", agents: [
    { key: "docs-tech", icon: "📄", name: "Docs técnicos" },
    { key: "docs-biz", icon: "📈", name: "Docs de negocio" },
    { key: "env", icon: "🔧", name: "DevOps env" },
    { key: "deliver", icon: "🚀", name: "Deploy GitHub" },
    { key: "ci-verify", icon: "✅", name: "QA / CI" },
  ] },
]

const SPECIALISTS = [
  { icon: "📣", name: "Growth · SEO" },
  { icon: "🏗️", name: "Arquitectura · Seguridad" },
  { icon: "✨", name: "Diseño · Marca · UX" },
  { icon: "💼", name: "Negocio · Pricing" },
  { icon: "🎯", name: "Fidelidad · Liveness" },
]

function dot(status: Step["status"]) {
  if (status === "done") return "bg-emerald-400"
  if (status === "running") return "bg-violet-bright"
  if (status === "error") return "bg-amber-400"
  return "bg-white/15"
}

export function SwarmStage({ steps }: { steps: Step[] }) {
  const byKey = new Map(steps.map((s) => [s.key, s]))
  const running = steps.find((s) => s.status === "running")
  const sh = byKey.get("stakeholder")
  const shActive = sh?.status === "running"
  const shDone = sh?.status === "done"

  const clusterState = (c: Cluster) => {
    const ss = c.agents.map((a) => byKey.get(a.key)?.status).filter(Boolean) as Step["status"][]
    if (ss.some((s) => s === "running")) return "working"
    if (ss.length && ss.every((s) => s === "done")) return "done"
    if (ss.some((s) => s === "done")) return "partial"
    return "pending"
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-violet/10 to-transparent p-5 sm:p-7">
      {/* hive header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`grid place-items-center w-12 h-12 rounded-2xl bg-violet/20 border border-violet/30 ${running ? "ag-working" : ""}`}>
          <Mark size={26} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white">El enjambre está trabajando</div>
          <div className="text-xs text-white/55 truncate">
            {running ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-bright align-middle mr-1.5 glow-bar" />Ahora: <span className="text-violet-bright font-semibold">{running.label}</span>{running.detail ? ` — ${running.detail}` : ""}</> : "En cola…"}
          </div>
        </div>
      </div>

      {/* phase clusters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CLUSTERS.map((c) => {
          const st = clusterState(c)
          const working = st === "working"
          return (
            <div key={c.id} className={`rounded-2xl border p-3 transition-colors ${working ? "border-violet/50 bg-violet/10" : st === "done" ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-ink2"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">{c.icon} {c.title}</span>
                {st === "done" && <span className="text-emerald-400 text-xs">✓</span>}
                {working && <span className="text-violet-bright text-[10px] font-bold animate-pulse">activo</span>}
              </div>
              <div className={`flex flex-wrap gap-1.5 ${working ? "ag-working" : ""}`}>
                {c.agents.map((a) => {
                  const s = byKey.get(a.key)
                  const status = s?.status || "pending"
                  return (
                    <span key={a.key} title={`${a.name}${s?.detail ? ` — ${s.detail}` : ""}`}
                      className={`relative inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold border ${status === "done" ? "border-emerald-500/30 text-emerald-300" : status === "running" ? "border-violet/50 text-white" : status === "error" ? "border-amber-500/40 text-amber-300" : "border-white/10 text-white/40"}`}>
                      <span className={`ag-dot w-1.5 h-1.5 rounded-full ${dot(status)}`} />
                      <span>{a.icon}</span>
                      <span className="hidden sm:inline">{a.name}</span>
                      {status === "done" && <span className="ml-0.5">✓</span>}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* stakeholder supervision panel */}
      <div className={`mt-4 rounded-2xl border p-4 transition-colors ${shActive ? "border-violet/50 bg-violet/10" : shDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-ink2"}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className={`grid place-items-center w-9 h-9 rounded-xl text-lg bg-violet/20 border border-violet/30 ${shActive ? "ag-working" : ""}`}>🐝</span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white">Stakeholder · supervisión</div>
            <div className="text-xs text-white/55 truncate">
              {shDone ? "Feedback aplicado — proyecto aprobado ✓" : shActive ? (sh?.detail || "Repartiendo el proyecto a los 4 especialistas…") : "En espera — corre cuando el enjambre termina de construir"}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SPECIALISTS.map((sp, i) => (
            <div key={i} className={`rounded-xl border p-2.5 text-center ${shActive ? "border-violet/40 ag-working" : shDone ? "border-emerald-500/30" : "border-white/10"}`} style={{ animationDelay: `${i * 120}ms` }}>
              <div className="text-lg">{sp.icon}</div>
              <div className="text-[10px] font-semibold text-white/70 leading-tight mt-1">{sp.name}</div>
              <div className={`text-[9px] font-bold mt-1 ${shDone ? "text-emerald-400" : shActive ? "text-violet-bright animate-pulse" : "text-white/30"}`}>
                {shDone ? "✓ feedback" : shActive ? "revisando…" : "en espera"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
