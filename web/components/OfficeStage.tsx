"use client"
/**
 * OfficeStage — the animated "tiny office" view of the swarm. Pixel-art agent sprites live
 * in rooms (TI / Design / Business / Management Lounge) and a central Common/PI-Planning
 * stage. Choreography follows the job phase: planning → the Queen presents at the forum;
 * building → agents work at their desks (💬 bubble); supervision → the Queen + 5 stakeholders
 * walk to the staging area to review. Click an agent → a one-line of what it's doing.
 * DOM/CSS (no game engine) so it wires straight to live job data and stays dependency-light.
 */
import { useMemo, useRef, useState } from "react"
import { SWARM_AGENTS, STEP_TO_AGENT, type SwarmAgent } from "@/lib/swarm-agents"

export type Step = { key: string; label: string; status: "pending" | "running" | "done" | "error"; detail?: string }

const W = 1040, H = 660
const ROOMS: Record<string, { x: number; y: number; w: number; h: number; label: string; tint: string }> = {
  ti:         { x: 24,  y: 24,  w: 480, h: 250, label: "TI OFFICE", tint: "rgba(56,110,200,.13)" },
  business:   { x: 536, y: 24,  w: 480, h: 250, label: "BUSINESS OFFICE", tint: "rgba(45,200,150,.12)" },
  design:     { x: 24,  y: 300, w: 300, h: 150, label: "ESTUDIO DE DISEÑO", tint: "rgba(160,90,255,.13)" },
  management: { x: 716, y: 300, w: 300, h: 336, label: "MANAGEMENT LOUNGE", tint: "rgba(220,70,110,.12)" },
  stage:      { x: 356, y: 300, w: 330, h: 336, label: "SALA COMÚN · PI PLANNING", tint: "rgba(124,58,237,.16)" },
}

function slot(room: { x: number; y: number; w: number; h: number }, i: number, n: number) {
  const cols = Math.min(n, Math.max(2, Math.ceil(Math.sqrt(n))))
  const rows = Math.ceil(n / cols)
  const cw = room.w / cols, ch = (room.h - 30) / rows
  const c = i % cols, r = Math.floor(i / cols)
  return { x: room.x + cw * c + cw / 2, y: room.y + 34 + ch * r + ch / 2 }
}

export function OfficeStage({ steps }: { steps: Step[] }) {
  const [sel, setSel] = useState<string | null>(null)
  const [view, setView] = useState({ s: 1, x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)

  const byStep = useMemo(() => new Map(steps.map((s) => [s.key, s])), [steps])
  const running = steps.find((s) => s.status === "running")
  const shRunning = byStep.get("stakeholder")?.status === "running"
  const planning = !!running && ["data-model", "research", "contracts"].includes(running.key)
  const allDone = steps.length > 0 && steps.every((s) => s.status === "done")

  // status of an agent = the "best" status across its steps (running > done > pending)
  function agentState(a: SwarmAgent): { status: Step["status"]; detail?: string } {
    const ss = a.steps.map((k) => byStep.get(k)).filter(Boolean) as Step[]
    const run = ss.find((s) => s.status === "running")
    if (run) return { status: "running", detail: run.detail || run.label }
    if (ss.length && ss.every((s) => s.status === "done")) return { status: "done" }
    if (ss.some((s) => s.status === "done")) return { status: "running", detail: "trabajando…" }
    return { status: "pending" }
  }

  // grouped homes
  const byRoom = useMemo(() => {
    const g: Record<string, SwarmAgent[]> = {}
    for (const a of SWARM_AGENTS) (g[a.room] ||= []).push(a)
    return g
  }, [])
  const stakeholders = SWARM_AGENTS.filter((a) => a.stakeholder || a.queen)

  function pos(a: SwarmAgent) {
    // supervision: queen + stakeholders gather at the central stage
    if (shRunning && (a.stakeholder || a.queen)) {
      const i = stakeholders.indexOf(a)
      return slot(ROOMS.stage, i, stakeholders.length)
    }
    // planning: the queen takes the stage to present the roadmap
    if (planning && a.queen) return { x: ROOMS.stage.x + ROOMS.stage.w / 2, y: ROOMS.stage.y + ROOMS.stage.h / 2 }
    // otherwise: home desk
    const peers = byRoom[a.room] || []
    return slot(ROOMS[a.room], peers.indexOf(a), peers.length)
  }

  const counts = SWARM_AGENTS.reduce((acc, a) => { const st = agentState(a).status; acc[st] = (acc[st] || 0) + 1; return acc }, {} as Record<string, number>)
  const selAgent = SWARM_AGENTS.find((a) => a.id === sel)
  const selState = selAgent ? agentState(selAgent) : null

  // pan/zoom handlers
  function onWheel(e: React.WheelEvent) { const s = Math.min(1.8, Math.max(0.5, view.s - e.deltaY * 0.001)); setView((v) => ({ ...v, s })) }
  function onDown(e: React.MouseEvent) { drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y } }
  function onMove(e: React.MouseEvent) { const d = drag.current; if (!d) return; setView((v) => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) })) }
  function onUp() { drag.current = null }

  const stageScene = shRunning ? "Revisión con stakeholders — presentando avances" : planning ? "PI Planning — la reina explica el roadmap" : allDone ? "¡Listo! 🎉" : running ? `Construyendo: ${running.label}` : "En cola…"

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0d1018] overflow-hidden select-none">
      <div className="relative h-[520px] overflow-hidden cursor-grab active:cursor-grabbing grid-bg" onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
        <div className="absolute left-1/2 top-6 origin-top" style={{ transform: `translate(-50%,0) translate(${view.x}px,${view.y}px) scale(${view.s})` }}>
          <div className="relative" style={{ width: W, height: H }}>
            {/* rooms */}
            {Object.entries(ROOMS).map(([id, r]) => (
              <div key={id} className={`absolute rounded-2xl border ${id === "stage" && (planning || shRunning) ? "border-violet/60" : "border-white/10"}`}
                style={{ left: r.x, top: r.y, width: r.w, height: r.h, background: r.tint }}>
                <span className="absolute left-3 top-2 text-[10px] font-extrabold tracking-widest text-white/55">{r.label}</span>
                {id === "stage" && <span className="absolute right-3 top-2 text-base">📽️</span>}
                {id === "management" && !shRunning && <span className="absolute right-3 top-2 text-base">☕</span>}
              </div>
            ))}

            {/* agents */}
            {SWARM_AGENTS.map((a) => {
              const p = pos(a), st = agentState(a)
              const working = st.status === "running"
              return (
                <button key={a.id} onClick={(e) => { e.stopPropagation(); setSel(a.id === sel ? null : a.id) }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-[1200ms] ease-in-out"
                  style={{ left: p.x, top: p.y, zIndex: Math.round(p.y) }}>
                  {working && <span className="mb-0.5 text-sm animate-bounce">💬</span>}
                  <div className={`relative ${working ? "ag-working" : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/sprites/agents/${a.id}.png`} alt={a.name} draggable={false}
                      className={`w-[60px] h-[60px] object-contain ${st.status === "pending" ? "opacity-50 grayscale" : ""} ${working ? "drop-shadow-[0_0_10px_rgba(124,58,237,.7)]" : ""}`} />
                    {st.status === "done" && <span className="absolute -right-1 -top-1 text-xs">✅</span>}
                    {a.queen && <span className="absolute -left-1 -top-2 text-xs">👑</span>}
                  </div>
                  <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap ${working ? "bg-violet text-white" : "bg-black/55 text-white/80"} ${sel === a.id ? "ring-1 ring-violet-bright" : ""}`}>{a.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* scene caption */}
        <div className="absolute left-4 top-3 rounded-lg bg-black/55 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white/90">{stageScene}</div>
        {/* zoom hint */}
        <div className="absolute right-4 top-3 text-[10px] text-white/40">arrastrá para mover · rueda para zoom</div>

        {/* selected agent popover */}
        {selAgent && selState && (
          <div className="absolute left-4 bottom-4 max-w-md rounded-xl border border-violet/40 bg-ink2/95 backdrop-blur px-4 py-3 shadow-xl">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/sprites/agents/${selAgent.id}.png`} alt="" className="w-9 h-9 object-contain" />
              <div>
                <div className="text-sm font-bold text-white">{selAgent.queen ? "👑 " : ""}{selAgent.name}</div>
                <div className="text-xs text-white/65">{selState.status === "running" ? selState.detail : selState.status === "done" ? "Terminó su parte ✓" : "En espera"}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* bottom status bar */}
      <div className="flex items-center gap-5 border-t border-white/10 px-4 py-2 text-xs font-semibold">
        <span className="text-violet-bright">● {counts.running || 0} trabajando</span>
        <span className="text-white/45">○ {counts.pending || 0} en espera</span>
        <span className="text-emerald-400">✓ {counts.done || 0} listos</span>
        <span className="ml-auto text-white/40">{SWARM_AGENTS.length} agentes en la oficina</span>
      </div>
    </div>
  )
}
