"use client"
/**
 * OfficeStage — animated "tiny office". Pixel-art agents live in rooms (TI / Design /
 * Business / Management Lounge) with desks/couches on an iso floor, idle-bobbing so the
 * place feels alive. Choreography by job phase: planning → Queen presents at the forum;
 * building → agents work at desks (💬 bubble + glow); supervision → Queen 👑 + 5 stakeholders
 * walk to the staging area. Click an agent → one line of what it's doing. Zoom via buttons
 * or Ctrl+wheel (normal wheel scrolls the page). DOM/CSS, no game engine.
 */
import { useMemo, useRef, useState } from "react"
import { SWARM_AGENTS, type SwarmAgent } from "@/lib/swarm-agents"

export type Step = { key: string; label: string; status: "pending" | "running" | "done" | "error"; detail?: string }

const W = 1040, H = 660
const ROOMS: Record<string, { x: number; y: number; w: number; h: number; label: string; tint: string; emoji?: string }> = {
  ti:         { x: 24,  y: 24,  w: 480, h: 250, label: "TI OFFICE", tint: "rgba(56,110,200,.14)", emoji: "💻" },
  business:   { x: 536, y: 24,  w: 480, h: 250, label: "BUSINESS OFFICE", tint: "rgba(45,200,150,.13)", emoji: "📊" },
  design:     { x: 24,  y: 300, w: 300, h: 150, label: "ESTUDIO DE DISEÑO", tint: "rgba(160,90,255,.14)", emoji: "🎨" },
  management: { x: 716, y: 300, w: 300, h: 336, label: "MANAGEMENT LOUNGE", tint: "rgba(220,70,110,.13)", emoji: "☕" },
  stage:      { x: 356, y: 300, w: 330, h: 336, label: "SALA COMÚN · PI PLANNING", tint: "rgba(124,58,237,.17)", emoji: "📽️" },
}

function slot(room: { x: number; y: number; w: number; h: number }, i: number, n: number) {
  const cols = Math.min(n, Math.max(2, Math.ceil(Math.sqrt(n))))
  const cw = room.w / cols, ch = (room.h - 38) / Math.ceil(n / cols)
  const c = i % cols, r = Math.floor(i / cols)
  return { x: room.x + cw * c + cw / 2, y: room.y + 46 + ch * r + ch / 2 }
}

export function OfficeStage({ steps }: { steps: Step[] }) {
  const [sel, setSel] = useState<string | null>(null)
  const [view, setView] = useState({ s: 0.92, x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)

  const byStep = useMemo(() => new Map(steps.map((s) => [s.key, s])), [steps])
  const running = steps.find((s) => s.status === "running")
  const shRunning = byStep.get("stakeholder")?.status === "running"
  const planning = !!running && ["data-model", "research", "contracts"].includes(running.key)
  const allDone = steps.length > 0 && steps.every((s) => s.status === "done")

  function agentState(a: SwarmAgent): { status: Step["status"]; detail?: string } {
    const ss = a.steps.map((k) => byStep.get(k)).filter(Boolean) as Step[]
    const run = ss.find((s) => s.status === "running")
    if (run) return { status: "running", detail: run.detail || run.label }
    if (ss.length && ss.every((s) => s.status === "done")) return { status: "done" }
    if (ss.some((s) => s.status === "done")) return { status: "running", detail: "trabajando…" }
    return { status: "pending" }
  }

  const byRoom = useMemo(() => { const g: Record<string, SwarmAgent[]> = {}; for (const a of SWARM_AGENTS) (g[a.room] ||= []).push(a); return g }, [])
  const gathering = SWARM_AGENTS.filter((a) => a.stakeholder || a.queen)

  function place(a: SwarmAgent): { x: number; y: number; home: boolean } {
    if (shRunning && (a.stakeholder || a.queen)) { const p = slot(ROOMS.stage, gathering.indexOf(a), gathering.length); return { ...p, home: false } }
    if (planning && a.queen) return { x: ROOMS.stage.x + ROOMS.stage.w / 2, y: ROOMS.stage.y + ROOMS.stage.h / 2, home: false }
    const peers = byRoom[a.room] || []; const p = slot(ROOMS[a.room], peers.indexOf(a), peers.length); return { ...p, home: true }
  }

  const counts = SWARM_AGENTS.reduce((acc, a) => { const st = agentState(a).status; acc[st] = (acc[st] || 0) + 1; return acc }, {} as Record<string, number>)
  const selAgent = SWARM_AGENTS.find((a) => a.id === sel)
  const selState = selAgent ? agentState(selAgent) : null
  const scene = shRunning ? "Revisión con stakeholders — presentando avances" : planning ? "PI Planning — la reina explica el roadmap" : allDone ? "¡Listo! 🎉" : running ? `Construyendo: ${running.label}` : "En cola…"

  function onWheel(e: React.WheelEvent) { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); setView((v) => ({ ...v, s: Math.min(1.8, Math.max(0.5, v.s - e.deltaY * 0.0015)) })) }
  function onDown(e: React.MouseEvent) { drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y } }
  function onMove(e: React.MouseEvent) { const d = drag.current; if (!d) return; setView((v) => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) })) }
  function onUp() { drag.current = null }
  const zoom = (d: number) => setView((v) => ({ ...v, s: Math.min(1.8, Math.max(0.5, v.s + d)) }))

  return (
    <div className="relative rounded-3xl border border-white/10 bg-[#0c0f17] overflow-hidden select-none">
      <div className="relative h-[560px] overflow-hidden cursor-grab active:cursor-grabbing" onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
        <div className="absolute left-1/2 top-6 origin-top" style={{ transform: `translate(-50%,0) translate(${view.x}px,${view.y}px) scale(${view.s})` }}>
          <div className="relative" style={{ width: W, height: H }}>
            {/* rooms with floor + wall */}
            {Object.entries(ROOMS).map(([id, r]) => {
              const hot = id === "stage" && (planning || shRunning)
              return (
                <div key={id} className={`absolute rounded-2xl border overflow-hidden ${hot ? "border-violet/60 shadow-[0_0_24px_rgba(124,58,237,.3)]" : "border-white/10"}`} style={{ left: r.x, top: r.y, width: r.w, height: r.h, background: r.tint }}>
                  <div className="absolute inset-0 iso-floor opacity-70" />
                  <div className="absolute inset-x-0 top-0 h-9 bg-black/30 border-b border-white/10 flex items-center px-3">
                    <span className="text-[10px] font-extrabold tracking-widest text-white/60">{r.label}</span>
                    <span className="ml-auto text-sm">{id === "management" && !shRunning ? "☕" : r.emoji}</span>
                  </div>
                </div>
              )
            })}

            {/* agents */}
            {SWARM_AGENTS.map((a) => {
              const p = place(a), st = agentState(a), working = st.status === "running"
              const furniture = p.home ? a.room : null
              return (
                <button key={a.id} onClick={(e) => { e.stopPropagation(); setSel(a.id === sel ? null : a.id) }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-[1100ms] ease-in-out"
                  style={{ left: p.x, top: p.y, zIndex: Math.round(p.y) }}>
                  {working && <span className="mb-0.5 text-sm animate-bounce">💬</span>}
                  <div className={`relative ${working ? "ag-working" : "ag-idle"}`} style={{ animationDelay: `${(a.name.length % 7) * 0.2}s` }}>
                    {/* furniture behind the sprite */}
                    {furniture && (
                      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-0 z-0">
                        {furniture === "management"
                          ? <span className="block w-16 h-3.5 rounded-md bg-[#4a2334] border border-black/30" />
                          : <>
                              <span className="absolute left-1/2 -translate-x-1/2 -top-7 w-6 h-4 rounded-[2px] bg-[#10141f] border border-white/15" />
                              <span className="block w-16 h-3 rounded-[3px] bg-gradient-to-b from-[#6b513a] to-[#4a3829] border border-black/30" />
                            </>}
                      </span>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/sprites/agents/${a.id}.png`} alt={a.name} draggable={false}
                      className={`relative z-10 w-[58px] h-[58px] object-contain ${st.status === "pending" ? "opacity-80" : ""} ${working ? "drop-shadow-[0_0_10px_rgba(124,58,237,.75)]" : ""}`} />
                    {st.status === "done" && <span className="absolute -right-1 -top-1 z-20 text-xs">✅</span>}
                    {a.queen && <span className="absolute -left-1 -top-2 z-20 text-xs">👑</span>}
                  </div>
                  <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap ${working ? "bg-violet text-white" : "bg-black/55 text-white/80"} ${sel === a.id ? "ring-1 ring-violet-bright" : ""}`}>{a.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="absolute left-4 top-3 rounded-lg bg-black/60 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white/90">{scene}</div>
        {/* zoom controls */}
        <div className="absolute right-4 top-3 flex items-center gap-1">
          <button onClick={() => zoom(-0.15)} className="w-7 h-7 rounded-lg bg-black/60 text-white font-bold">−</button>
          <button onClick={() => zoom(0.15)} className="w-7 h-7 rounded-lg bg-black/60 text-white font-bold">+</button>
          <button onClick={() => setView({ s: 0.92, x: 0, y: 0 })} className="h-7 px-2 rounded-lg bg-black/60 text-white text-[10px] font-bold">reset</button>
        </div>
        <div className="absolute right-4 bottom-14 text-[10px] text-white/35">arrastrá para mover · Ctrl+rueda para zoom</div>

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

      <div className="flex items-center gap-5 border-t border-white/10 px-4 py-2 text-xs font-semibold">
        <span className="text-violet-bright">● {counts.running || 0} trabajando</span>
        <span className="text-white/45">○ {counts.pending || 0} en espera</span>
        <span className="text-emerald-400">✓ {counts.done || 0} listos</span>
        <span className="ml-auto text-white/40">{SWARM_AGENTS.length} agentes en la oficina</span>
      </div>
    </div>
  )
}
