"use client"
/**
 * OfficeStage — a living "tiny office" sim. Agents WALK continuously around their rooms
 * (requestAnimationFrame: real movement, facing flip, walk-bob), among static furniture
 * (desks / couches / a presentation stage). Choreography by job phase: planning → the
 * Queen walks to the forum to present; building → agents roam/work in their offices
 * (💬 bubble + glow); supervision → the Queen + 5 stakeholders WALK to the common stage to
 * review. Click an agent → one line of what it's doing. Pan + Ctrl/wheel zoom.
 */
import { useEffect, useMemo, useRef, useState } from "react"
import { SWARM_AGENTS, type SwarmAgent } from "@/lib/swarm-agents"

export type Step = { key: string; label: string; status: "pending" | "running" | "done" | "error"; detail?: string }

const W = 1060, H = 680
type Rect = { x: number; y: number; w: number; h: number; label: string; tint: string; emoji: string }
const ROOMS: Record<string, Rect> = {
  ti:         { x: 24,  y: 24,  w: 500, h: 270, label: "TI OFFICE", tint: "rgba(56,110,200,.14)", emoji: "💻" },
  business:   { x: 556, y: 24,  w: 480, h: 270, label: "BUSINESS OFFICE", tint: "rgba(45,200,150,.13)", emoji: "📊" },
  design:     { x: 24,  y: 320, w: 300, h: 336, label: "ESTUDIO DE DISEÑO", tint: "rgba(160,90,255,.14)", emoji: "🎨" },
  stage:      { x: 356, y: 320, w: 340, h: 336, label: "SALA COMÚN · PI PLANNING", tint: "rgba(124,58,237,.17)", emoji: "📽️" },
  management: { x: 728, y: 320, w: 308, h: 336, label: "MANAGEMENT LOUNGE", tint: "rgba(220,70,110,.13)", emoji: "☕" },
}
// static furniture per room (decor the agents walk around)
const FURNITURE: { room: string; x: number; y: number; type: "desk" | "couch" | "table" | "plant" | "stage" | "screen" }[] = [
  { room: "ti", x: 110, y: 120, type: "desk" }, { room: "ti", x: 260, y: 120, type: "desk" }, { room: "ti", x: 410, y: 120, type: "desk" }, { room: "ti", x: 180, y: 215, type: "desk" }, { room: "ti", x: 340, y: 215, type: "desk" }, { room: "ti", x: 470, y: 60, type: "plant" },
  { room: "business", x: 120, y: 130, type: "desk" }, { room: "business", x: 300, y: 130, type: "desk" }, { room: "business", x: 230, y: 220, type: "desk" }, { room: "business", x: 430, y: 210, type: "plant" },
  { room: "design", x: 90, y: 200, type: "desk" }, { room: "design", x: 210, y: 200, type: "desk" },
  { room: "stage", x: 170, y: 90, type: "screen" }, { room: "stage", x: 170, y: 150, type: "stage" },
  { room: "management", x: 90, y: 150, type: "couch" }, { room: "management", x: 220, y: 150, type: "couch" }, { room: "management", x: 155, y: 230, type: "table" }, { room: "management", x: 260, y: 270, type: "plant" },
]

const inner = (r: Rect) => ({ x0: r.x + 30, y0: r.y + 56, x1: r.x + r.w - 30, y1: r.y + r.h - 30 })
const rnd = (a: number, b: number) => a + Math.random() * (b - a)
function randPoint(roomId: string) { const r = ROOMS[roomId]; const b = inner(r); return { x: rnd(b.x0, b.x1), y: rnd(b.y0, b.y1) } }

interface Sim { x: number; y: number; tx: number; ty: number; face: number; nextWander: number; seed: number }

export function OfficeStage({ steps }: { steps: Step[] }) {
  const [sel, setSel] = useState<string | null>(null)
  const [view, setView] = useState({ s: 0.9, x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const wrapRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const sprRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const sim = useRef<Map<string, Sim>>(new Map())
  const intent = useRef<Map<string, { room: string; gather: boolean; gx?: number; gy?: number }>>(new Map())

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
  const gathering = useMemo(() => SWARM_AGENTS.filter((a) => a.stakeholder || a.queen), [])

  // init positions once
  useEffect(() => {
    SWARM_AGENTS.forEach((a, i) => {
      const p = randPoint(a.room)
      sim.current.set(a.id, { x: p.x, y: p.y, tx: p.x, ty: p.y, face: 1, nextWander: 0, seed: i * 1.7 })
    })
  }, [])

  // recompute intent (where each agent wants to be) whenever the phase changes
  const phaseKey = `${shRunning}|${planning}|${allDone}`
  useEffect(() => {
    SWARM_AGENTS.forEach((a) => {
      if (shRunning && (a.stakeholder || a.queen)) {
        const i = gathering.indexOf(a); const cols = 3
        const sx = ROOMS.stage.x + 60 + (i % cols) * ((ROOMS.stage.w - 120) / (cols - 1))
        const sy = ROOMS.stage.y + 200 + Math.floor(i / cols) * 80
        intent.current.set(a.id, { room: "stage", gather: true, gx: sx, gy: sy })
      } else if (planning && a.queen) {
        intent.current.set(a.id, { room: "stage", gather: true, gx: ROOMS.stage.x + ROOMS.stage.w / 2, gy: ROOMS.stage.y + 210 })
      } else {
        intent.current.set(a.id, { room: a.room, gather: false })
      }
    })
    // force re-target immediately
    SWARM_AGENTS.forEach((a) => { const s = sim.current.get(a.id); const it = intent.current.get(a.id); if (s && it?.gather) { s.tx = it.gx!; s.ty = it.gy! } })
  }, [phaseKey, gathering])

  // rAF walk loop — real movement, facing, walk-bob
  useEffect(() => {
    let raf = 0
    const SPEED = 1.0
    const frame = (t: number) => {
      for (const a of SWARM_AGENTS) {
        const s = sim.current.get(a.id); const node = wrapRefs.current.get(a.id); const spr = sprRefs.current.get(a.id)
        if (!s || !node || !spr) continue
        const it = intent.current.get(a.id)
        if (!it?.gather) {
          const reached = Math.hypot(s.tx - s.x, s.ty - s.y) < 2
          if (reached && t > s.nextWander) { const p = randPoint(it?.room || a.room); s.tx = p.x; s.ty = p.y; s.nextWander = t + rnd(1400, 4200) }
        }
        const dx = s.tx - s.x, dy = s.ty - s.y, dist = Math.hypot(dx, dy)
        const moving = dist > 1.6
        if (moving) { s.x += (dx / dist) * SPEED; s.y += (dy / dist) * SPEED; if (Math.abs(dx) > 0.6) s.face = dx < 0 ? -1 : 1 }
        const bob = moving ? Math.abs(Math.sin(t / 95)) * 3 : Math.sin(t / 620 + s.seed) * 1.4
        node.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%)`
        node.style.zIndex = String(Math.round(s.y))
        spr.style.transform = `scaleX(${s.face}) translateY(${-bob}px)`
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

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
        <div className="absolute left-1/2 top-5 origin-top" style={{ transform: `translate(-50%,0) translate(${view.x}px,${view.y}px) scale(${view.s})` }}>
          <div className="relative" style={{ width: W, height: H }}>
            {/* rooms */}
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
            {/* static furniture */}
            {FURNITURE.map((f, i) => {
              const r = ROOMS[f.room]; const x = r.x + f.x, y = r.y + f.y
              return <Furniture key={i} type={f.type} x={x} y={y} />
            })}
            {/* agents (positions animated via rAF on refs) */}
            {SWARM_AGENTS.map((a) => {
              const st = agentState(a), working = st.status === "running"
              return (
                <div key={a.id} ref={(el) => { if (el) wrapRefs.current.set(a.id, el) }} className="absolute left-0 top-0 will-change-transform" style={{ transform: "translate(-9999px,-9999px)" }}>
                  <button onClick={(e) => { e.stopPropagation(); setSel(a.id === sel ? null : a.id) }} className="flex flex-col items-center -translate-x-1/2 -translate-y-full">
                    {working && <span className="mb-0.5 text-base animate-bounce">💬</span>}
                    <div ref={(el) => { if (el) sprRefs.current.set(a.id, el) }} className="relative will-change-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/sprites/agents/${a.id}.png`} alt={a.name} draggable={false}
                        className={`w-[56px] h-[56px] object-contain ${st.status === "pending" ? "opacity-85" : ""} ${working ? "drop-shadow-[0_0_9px_rgba(124,58,237,.8)]" : ""}`} />
                      {st.status === "done" && <span className="absolute -right-1 -top-1 text-xs">✅</span>}
                      {a.queen && <span className="absolute -left-1 -top-2 text-xs">👑</span>}
                    </div>
                    <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap ${working ? "bg-violet text-white" : "bg-black/55 text-white/80"} ${sel === a.id ? "ring-1 ring-violet-bright" : ""}`}>{a.name}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="absolute left-4 top-3 rounded-lg bg-black/60 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white/90">{scene}</div>
        <div className="absolute right-4 top-3 flex items-center gap-1">
          <button onClick={() => zoom(-0.15)} className="w-7 h-7 rounded-lg bg-black/60 text-white font-bold">−</button>
          <button onClick={() => zoom(0.15)} className="w-7 h-7 rounded-lg bg-black/60 text-white font-bold">+</button>
          <button onClick={() => setView({ s: 0.9, x: 0, y: 0 })} className="h-7 px-2 rounded-lg bg-black/60 text-white text-[10px] font-bold">reset</button>
        </div>
        <div className="absolute right-4 bottom-14 text-[10px] text-white/35">arrastrá para mover · Ctrl+rueda para zoom</div>

        {selAgent && selState && (
          <div className="absolute left-4 bottom-4 max-w-md rounded-xl border border-violet/40 bg-ink2/95 backdrop-blur px-4 py-3 shadow-xl">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/sprites/agents/${selAgent.id}.png`} alt="" className="w-9 h-9 object-contain" />
              <div>
                <div className="text-sm font-bold text-white">{selAgent.queen ? "👑 " : ""}{selAgent.name}</div>
                <div className="text-xs text-white/65">{selState.status === "running" ? selState.detail : selState.status === "done" ? "Terminó su parte ✓" : "Esperando su turno…"}</div>
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

function Furniture({ type, x, y }: { type: string; x: number; y: number }) {
  const base = "absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
  if (type === "desk") return (
    <div className={base} style={{ left: x, top: y, zIndex: Math.round(y) - 50 }}>
      <div className="w-[52px] h-[26px] rounded-[5px] bg-gradient-to-b from-[#6b513a] to-[#46342433] border border-black/30 relative">
        <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-6 h-4 rounded-[2px] bg-[#10141f] border border-white/15" />
      </div>
    </div>
  )
  if (type === "couch") return <div className={base} style={{ left: x, top: y, zIndex: Math.round(y) - 50 }}><div className="w-[62px] h-[24px] rounded-lg bg-[#4a2334] border border-black/30" /></div>
  if (type === "table") return <div className={base} style={{ left: x, top: y, zIndex: Math.round(y) - 50 }}><div className="w-9 h-9 rounded-full bg-[#3a2230] border border-black/30 grid place-items-center text-xs">☕</div></div>
  if (type === "plant") return <div className={base} style={{ left: x, top: y, zIndex: Math.round(y) - 50 }}><div className="text-2xl">🪴</div></div>
  if (type === "stage") return <div className={base} style={{ left: x, top: y, zIndex: 1 }}><div className="w-[230px] h-[70px] rounded-xl bg-violet/15 border border-violet/30" /></div>
  if (type === "screen") return <div className={base} style={{ left: x, top: y, zIndex: 1 }}><div className="w-[180px] h-[64px] rounded-md bg-[#0e1322] border border-white/15 grid place-items-center text-[9px] font-bold text-white/50 tracking-widest">STAKEHOLDER ROADMAP</div></div>
  return null
}
