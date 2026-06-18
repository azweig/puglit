"use client"
/**
 * OfficeStage — a living office that behaves like a real workplace.
 * RULES: every agent belongs to its room and never leaves it, except for meetings.
 * BEHAVIOUR (not constant walking — they WORK):
 *  - building → agents SIT at their desks; the running one works (glow + 💬 + typing bob).
 *  - planning → the Queen STANDS at the projector in the PI Planning forum and the
 *    discovery agents SIT in the chairs to listen.
 *  - supervision → the Queen STANDS at the head of the Management boardroom table and the
 *    5 stakeholders SIT around it to review.
 * Agents only WALK when their seat changes (phase transition); otherwise they stay put.
 * Movement is animated via requestAnimationFrame (facing flip + walk-bob), clamped to the
 * canvas so nobody leaves the frame. Furniture is drawn per room. Pan + Ctrl/wheel zoom.
 */
import { useEffect, useMemo, useRef, useState } from "react"
import { SWARM_AGENTS, STEP_TO_AGENT, type SwarmAgent } from "@/lib/swarm-agents"

export type Step = { key: string; label: string; status: "pending" | "running" | "done" | "error"; detail?: string }

const W = 1420, H = 900
type Rect = { x: number; y: number; w: number; h: number; label: string; tint: string; emoji: string }
const ROOMS: Record<string, Rect> = {
  ti:         { x: 30,  y: 30,  w: 650, h: 330, label: "TI OFFICE", tint: "rgba(56,110,200,.13)", emoji: "💻" },
  business:   { x: 720, y: 30,  w: 670, h: 330, label: "BUSINESS OFFICE", tint: "rgba(45,200,150,.12)", emoji: "📊" },
  design:     { x: 30,  y: 400, w: 360, h: 300, label: "ESTUDIO DE DISEÑO", tint: "rgba(160,90,255,.13)", emoji: "🎨" },
  forum:      { x: 430, y: 400, w: 500, h: 300, label: "PI PLANNING FORUM", tint: "rgba(124,58,237,.16)", emoji: "📽️" },
  management: { x: 970, y: 400, w: 420, h: 300, label: "MANAGEMENT LOUNGE", tint: "rgba(220,70,110,.12)", emoji: "☕" },
  rest:       { x: 30,  y: 740, w: 1360, h: 130, label: "ÁREA DE DESCANSO", tint: "rgba(120,160,90,.10)", emoji: "🛋️" },
}

// grid of desk anchors inside a room (absolute coords)
function grid(r: Rect, n: number, cols: number) {
  const out: { x: number; y: number }[] = []
  const rows = Math.ceil(n / cols)
  const cw = (r.w - 80) / cols, ch = (r.h - 90) / Math.max(1, rows)
  for (let i = 0; i < n; i++) { const c = i % cols, ro = Math.floor(i / cols); out.push({ x: r.x + 40 + cw * c + cw / 2, y: r.y + 70 + ch * ro + ch / 2 }) }
  return out
}
const rnd = (a: number, b: number) => a + Math.random() * (b - a)
function randPoint(roomId: string) { const r = ROOMS[roomId] || ROOMS.ti; return { x: rnd(r.x + 40, r.x + r.w - 40), y: rnd(r.y + 60, r.y + r.h - 34) } }
// home desks per office (agents listed in SWARM_AGENTS order within each room)
const DESKS: Record<string, { x: number; y: number }[]> = {
  ti: grid(ROOMS.ti, 9, 3), business: grid(ROOMS.business, 4, 2), design: grid(ROOMS.design, 2, 1),
}
// Management boardroom: long table centered, 6 seats around it, head = queen
const MG = ROOMS.management
const MG_TABLE = { x: MG.x + MG.w / 2, y: MG.y + MG.h / 2 + 8 }
const MG_SEATS = [
  { x: MG_TABLE.x - 110, y: MG_TABLE.y, stand: true },             // head (queen, stands)
  { x: MG_TABLE.x - 40, y: MG_TABLE.y - 70 }, { x: MG_TABLE.x + 40, y: MG_TABLE.y - 70 }, { x: MG_TABLE.x + 110, y: MG_TABLE.y - 70 },
  { x: MG_TABLE.x - 40, y: MG_TABLE.y + 70 }, { x: MG_TABLE.x + 40, y: MG_TABLE.y + 70 }, { x: MG_TABLE.x + 110, y: MG_TABLE.y + 70 },
] as { x: number; y: number; stand?: boolean }[]
// PI Planning forum: screen at top, podium (speaker stands), chairs facing it
const FO = ROOMS.forum
const FO_SCREEN = { x: FO.x + FO.w / 2, y: FO.y + 80 }
const FO_PODIUM = { x: FO.x + FO.w / 2, y: FO.y + 150, stand: true }
const FO_CHAIRS = [
  { x: FO.x + FO.w / 2 - 90, y: FO.y + 210 }, { x: FO.x + FO.w / 2, y: FO.y + 210 }, { x: FO.x + FO.w / 2 + 90, y: FO.y + 210 },
  { x: FO.x + FO.w / 2 - 50, y: FO.y + 255 }, { x: FO.x + FO.w / 2 + 50, y: FO.y + 255 },
]

const DISCOVERY = ["data-architect", "researcher", "contracts-architect"]

interface Sim { x: number; y: number; wx: number; wy: number; nextWander: number; face: number; seed: number }
const partySpot = (i: number) => ({ x: ROOMS.forum.x + ROOMS.forum.w / 2 + ((i % 6) - 2.5) * 70, y: ROOMS.forum.y + 70 + Math.floor(i / 6) * 52 })

export function OfficeStage({ steps }: { steps: Step[] }) {
  const [sel, setSel] = useState<string | null>(null)
  const [view, setView] = useState({ s: 0.6, x: 0, y: 0 })
  // queue of "I finished a task" comic reports (image-30 style), one per step completion
  const [reports, setReports] = useState<{ agent: string; name: string; label: string; detail: string }[]>([])
  const prevDone = useRef<Set<string>>(new Set())
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const wrapRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const sprRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const sim = useRef<Map<string, Sim>>(new Map())
  const phaseRef = useRef({ planning: false, sh: false, done: false })

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

  // home seat per agent (assigned once by room order)
  const home = useMemo(() => {
    const m = new Map<string, { x: number; y: number; stand: boolean }>()
    const idx: Record<string, number> = { ti: 0, business: 0, design: 0, management: 0 }
    for (const a of SWARM_AGENTS) {
      if (a.room === "management") { const i = idx.management++; const s = MG_SEATS[i] || MG_SEATS[MG_SEATS.length - 1]; m.set(a.id, { x: s.x, y: s.y, stand: !!(s.stand && a.queen) }) }
      else { const arr = DESKS[a.room]; const s = arr[idx[a.room]++] || arr[arr.length - 1]; m.set(a.id, { x: s.x, y: s.y, stand: false }) }
    }
    return m
  }, [])

  // live phase read by the rAF loop (avoids effect-ordering pitfalls)
  phaseRef.current = { planning, sh: shRunning, done: allDone }
  const stakeOrder = useMemo(() => SWARM_AGENTS.filter((a) => a.stakeholder), [])

  // init positions at home
  useEffect(() => {
    SWARM_AGENTS.forEach((a, i) => { const h = home.get(a.id)!; sim.current.set(a.id, { x: h.x, y: h.y, wx: h.x, wy: h.y, nextWander: 0, face: 1, seed: i * 1.7 }) })
  }, [home])

  // rAF walk loop. RULE: a WORKING agent stays at its desk; everyone else has LIFE —
  // they wander around their own room. Meetings (planning/supervision) pull the relevant
  // agents to the forum/boardroom. When ALL are done → everyone parties in the forum.
  useEffect(() => {
    let raf = 0; const SPEED = 2.1
    const isWorking = (a: SwarmAgent) => (a.steps.map((k) => byStep.get(k)).filter(Boolean) as Step[]).some((x) => x.status === "running")
    const frame = (t: number) => {
      const ph = phaseRef.current
      for (let idx = 0; idx < SWARM_AGENTS.length; idx++) {
        const a = SWARM_AGENTS[idx]
        const s = sim.current.get(a.id), node = wrapRefs.current.get(a.id), spr = sprRefs.current.get(a.id)
        if (!s || !node || !spr) continue
        const working = isWorking(a)
        const ss = a.steps.map((k) => byStep.get(k)).filter(Boolean) as Step[]
        const doneAll = ss.length > 0 && ss.every((x) => x.status === "done")
        let tx: number, ty: number, roomId = a.room as string
        if (ph.done) { const p = partySpot(idx); tx = p.x; ty = p.y; roomId = "forum" }
        else if (ph.planning && a.queen) { tx = FO_PODIUM.x; ty = FO_PODIUM.y; roomId = "forum" }
        else if (ph.planning && DISCOVERY.includes(a.id)) { const c = FO_CHAIRS[DISCOVERY.indexOf(a.id)]; tx = c.x; ty = c.y; roomId = "forum" }
        else if (ph.sh && a.queen) { tx = MG_SEATS[0].x; ty = MG_SEATS[0].y; roomId = "management" }
        else if (ph.sh && a.stakeholder) { const sm = MG_SEATS[stakeOrder.indexOf(a) + 1] || MG_SEATS[1]; tx = sm.x; ty = sm.y; roomId = "management" }
        else if (working) { const h = home.get(a.id)!; tx = h.x; ty = h.y } // at the desk, working
        else { // not working: finished agents relax in the rest area; the rest wander their own room
          roomId = doneAll ? "rest" : a.room
          if (Math.hypot(s.wx - s.x, s.wy - s.y) < 4 && t > s.nextWander) { const p = randPoint(roomId); s.wx = p.x; s.wy = p.y; s.nextWander = t + 1800 + Math.random() * 3500 }
          tx = s.wx; ty = s.wy
        }
        const dx = tx - s.x, dy = ty - s.y, dist = Math.hypot(dx, dy), moving = dist > 1.6
        if (moving) { s.x += (dx / dist) * SPEED; s.y += (dy / dist) * SPEED; if (Math.abs(dx) > 0.6) s.face = dx < 0 ? -1 : 1 }
        // COLLISION: once arrived (not transiting), keep the agent strictly inside its room so it never drifts off-screen.
        if (!moving) { const r = ROOMS[roomId]; if (r) { s.x = Math.max(r.x + 22, Math.min(r.x + r.w - 22, s.x)); s.y = Math.max(r.y + 44, Math.min(r.y + r.h - 22, s.y)) } }
        s.x = Math.max(16, Math.min(W - 16, s.x)); s.y = Math.max(16, Math.min(H - 12, s.y))
        const bob = ph.done ? Math.abs(Math.sin(t / 120 + s.seed)) * 9 : moving ? Math.abs(Math.sin(t / 95)) * 3 : working ? Math.sin(t / 160 + s.seed) * 1.1 : Math.sin(t / 600 + s.seed) * 1
        node.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%)`
        node.style.zIndex = String(Math.round(s.y) + 200)
        spr.style.transform = `scaleX(${s.face}) translateY(${-bob}px)`
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf)
  }, [byStep, home, stakeOrder])

  const counts = SWARM_AGENTS.reduce((acc, a) => { const st = agentState(a).status; acc[st] = (acc[st] || 0) + 1; return acc }, {} as Record<string, number>)
  const selAgent = SWARM_AGENTS.find((a) => a.id === sel)
  const selState = selAgent ? agentState(selAgent) : null
  const scene = shRunning ? "Reunión de revisión — los stakeholders evalúan en la sala de directorio" : planning ? "PI Planning — la reina presenta el roadmap; el equipo escucha" : allDone ? "¡Listo! 🎉 entrega completa" : running ? `Trabajando en: ${running.label}` : "En cola…"

  // enqueue a comic "I finished X" report whenever a step newly completes
  useEffect(() => {
    const add: { agent: string; name: string; label: string; detail: string }[] = []
    for (const st of steps) {
      if (st.status === "done" && !prevDone.current.has(st.key)) {
        const a = SWARM_AGENTS.find((x) => x.id === STEP_TO_AGENT[st.key])
        if (a) add.push({ agent: a.id, name: a.name, label: st.label.replace(/^[^·]*·\s*/, ""), detail: st.detail && st.detail !== "—" ? st.detail : "Tarea completada." })
      }
    }
    prevDone.current = new Set(steps.filter((s) => s.status === "done").map((s) => s.key))
    if (add.length) setReports((q) => [...q, ...add])
  }, [steps])
  // auto-advance the current report after a few seconds (still skippable by hand)
  useEffect(() => {
    if (!reports.length) return
    const t = setTimeout(() => setReports((q) => q.slice(1)), 7000)
    return () => clearTimeout(t)
  }, [reports])
  const report = reports[0]

  function onWheel(e: React.WheelEvent) { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); setView((v) => ({ ...v, s: Math.min(1.6, Math.max(0.45, v.s - e.deltaY * 0.0015)) })) }
  function onDown(e: React.MouseEvent) { drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y } }
  function onMove(e: React.MouseEvent) { const d = drag.current; if (!d) return; setView((v) => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) })) }
  function onUp() { drag.current = null }
  const zoom = (d: number) => setView((v) => ({ ...v, s: Math.min(1.6, Math.max(0.45, v.s + d)) }))

  return (
    <div className="relative rounded-3xl border border-white/10 bg-[#0b0e16] overflow-hidden select-none">
      <div className="relative h-[600px] overflow-hidden cursor-grab active:cursor-grabbing" onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
        <div className="absolute left-1/2 top-4 origin-top" style={{ transform: `translate(-50%,0) translate(${view.x}px,${view.y}px) scale(${view.s})` }}>
          <div className="relative" style={{ width: W, height: H }}>
            {Object.entries(ROOMS).map(([id, r]) => {
              const hot = (id === "forum" && planning) || (id === "management" && shRunning)
              return (
                <div key={id} className={`absolute rounded-2xl border overflow-hidden ${hot ? "border-violet/60 shadow-[0_0_26px_rgba(124,58,237,.32)]" : "border-white/10"}`} style={{ left: r.x, top: r.y, width: r.w, height: r.h, background: r.tint }}>
                  <div className="absolute inset-0 iso-floor opacity-70" />
                  <div className="absolute inset-x-0 top-0 h-9 bg-black/30 border-b border-white/10 flex items-center px-3">
                    <span className="text-[11px] font-extrabold tracking-widest text-white/65">{r.label}</span>
                    <span className="ml-auto text-base">{r.emoji}</span>
                  </div>
                </div>
              )
            })}

            {/* furniture (CSS) */}
            {DESKS.ti.map((d, i) => <ItDesk key={"td" + i} x={d.x} y={d.y} />)}
            {DESKS.business.map((d, i) => <Cubicle key={"bc" + i} x={d.x} y={d.y} />)}
            {DESKS.design.map((d, i) => <Easel key={"es" + i} x={d.x} y={d.y} />)}
            <BoardTable x={MG_TABLE.x} y={MG_TABLE.y} />
            <Screen x={FO_SCREEN.x} y={FO_SCREEN.y} />
            {FO_CHAIRS.map((c, i) => <Chair key={"fc" + i} x={c.x} y={c.y} />)}
            <Sofa x={ROOMS.rest.x + 120} y={ROOMS.rest.y + 70} />
            <Sofa x={ROOMS.rest.x + 300} y={ROOMS.rest.y + 70} />
            <Coffee x={ROOMS.rest.x + 470} y={ROOMS.rest.y + 70} />
            <Plant x={ROOMS.ti.x + ROOMS.ti.w - 40} y={ROOMS.ti.y + 60} />
            <Plant x={ROOMS.business.x + ROOMS.business.w - 40} y={ROOMS.business.y + ROOMS.business.h - 50} />
            <Plant x={ROOMS.rest.x + ROOMS.rest.w - 60} y={ROOMS.rest.y + 70} />

            {/* agents (animated via refs) */}
            {SWARM_AGENTS.map((a) => {
              const st = agentState(a), working = st.status === "running"
              return (
                <div key={a.id} ref={(el) => { if (el) wrapRefs.current.set(a.id, el) }} className="absolute left-0 top-0 will-change-transform" style={{ transform: "translate(-9999px,-9999px)" }}>
                  <button onClick={(e) => { e.stopPropagation(); setSel(a.id === sel ? null : a.id) }} className="flex flex-col items-center -translate-x-1/2 -translate-y-full">
                    {working && <span className="mb-0.5 text-base animate-bounce">💬</span>}
                    <div ref={(el) => { if (el) sprRefs.current.set(a.id, el) }} className="relative will-change-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/sprites/agents/${a.id}.png`} alt={a.name} draggable={false}
                        className={`w-[54px] h-[54px] object-contain ${st.status === "pending" ? "opacity-85" : ""} ${working ? "drop-shadow-[0_0_9px_rgba(124,58,237,.8)]" : ""}`} />
                      {st.status === "done" && !allDone && <span className="absolute -right-1 -top-1 text-xs">✅</span>}
                      {a.queen && <span className="absolute -left-1 -top-2 text-xs">👑</span>}
                      {allDone && (
                        <span className="absolute left-1/2 -translate-x-1/2 -top-3 w-0 h-0" style={{ borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: `15px solid ${["#f43f5e", "#f59e0b", "#22c55e", "#38bdf8", "#a855f7"][a.name.length % 5]}` }}>
                          <span className="absolute left-1/2 -translate-x-1/2 -top-[3px] w-1.5 h-1.5 rounded-full bg-white" />
                        </span>
                      )}
                    </div>
                    <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap ${working ? "bg-violet text-white" : "bg-black/55 text-white/80"} ${sel === a.id ? "ring-1 ring-violet-bright" : ""}`}>{a.name}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {allDone && <Confetti />}
        <div className="absolute left-4 top-3 rounded-lg bg-black/60 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white/90 max-w-[70%]">{scene}</div>
        <div className="absolute right-4 top-3 flex items-center gap-1">
          <button onClick={() => zoom(-0.12)} className="w-7 h-7 rounded-lg bg-black/60 text-white font-bold">−</button>
          <button onClick={() => zoom(0.12)} className="w-7 h-7 rounded-lg bg-black/60 text-white font-bold">+</button>
          <button onClick={() => setView({ s: 0.78, x: 0, y: 0 })} className="h-7 px-2 rounded-lg bg-black/60 text-white text-[10px] font-bold">reset</button>
        </div>
        <div className="absolute right-4 bottom-14 text-[10px] text-white/35">arrastrá para mover · Ctrl+rueda para zoom</div>

        {selAgent && selState && (
          <div className="absolute left-4 bottom-4 max-w-md rounded-xl border border-violet/40 bg-ink2/95 backdrop-blur px-4 py-3 shadow-xl">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/sprites/agents/${selAgent.id}.png`} alt="" className="w-9 h-9 object-contain" />
              <div><div className="text-sm font-bold text-white">{selAgent.queen ? "👑 " : ""}{selAgent.name}</div>
                <div className="text-xs text-white/65">{selState.status === "running" ? selState.detail : selState.status === "done" ? "Terminó su parte ✓" : "Esperando su turno…"}</div></div>
            </div>
          </div>
        )}

        {/* comic "I finished a task" report — big portrait, queues up, skippable */}
        {report && (
          <div className="absolute inset-x-0 bottom-0 z-[70] flex justify-center pb-2 pointer-events-none">
            <div className="pointer-events-auto relative w-[min(560px,94%)] rounded-2xl border border-white/15 bg-[#11131c]/[0.97] backdrop-blur shadow-2xl px-5 pt-4 pb-3 ag-pop">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/sprites/agents/${report.agent}.png`} alt="" className="absolute -top-24 right-3 w-32 h-32 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,.55)]" />
              <div className="flex items-center justify-between">
                <span className="inline-block bg-emerald-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md tracking-wide">✅ TAREA COMPLETADA</span>
                <button onClick={() => setReports((q) => q.slice(1))} className="text-white/70 hover:text-white text-xs font-bold">{reports.length > 1 ? `Siguiente (${reports.length}) ` : ""}Skip ›</button>
              </div>
              <div className="mt-2 pr-28">
                <div className="text-base font-extrabold text-white">{report.name}</div>
                <div className="text-sm font-semibold text-violet-bright">Terminé: {report.label}</div>
                <p className="mt-1 text-xs text-white/70 leading-snug line-clamp-3">{report.detail}</p>
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

function Confetti() {
  const C = ["#f43f5e", "#f59e0b", "#22c55e", "#38bdf8", "#a855f7", "#ffffff"]
  return <div className="absolute inset-0 pointer-events-none overflow-hidden z-[60]">
    {Array.from({ length: 38 }).map((_, i) => (
      <span key={i} className="absolute w-2 h-3 rounded-[1px]" style={{ left: `${(i * 53) % 100}%`, top: "-24px", background: C[i % C.length], animation: `confetti-fall ${2.4 + (i % 5) * 0.4}s linear ${(i % 12) * 0.25}s infinite` }} />
    ))}
  </div>
}

/* ---- furniture (generated pixel-art sprites) ---- */
const z = (y: number) => Math.round(y) + 10
function Prop({ src, x, y, w, zi }: { src: string; x: number; y: number; w: number; zi?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/sprites/props/${src}.png`} alt="" draggable={false} className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none object-contain" style={{ left: x, top: y, width: w, zIndex: zi ?? z(y) }} />
}
function ItDesk({ x, y }: { x: number; y: number }) { return <Prop src="it-desk" x={x} y={y + 6} w={78} /> }
function Cubicle({ x, y }: { x: number; y: number }) { return <Prop src="cubicle" x={x} y={y + 4} w={84} /> }
function Easel({ x, y }: { x: number; y: number }) { return <Prop src="easel" x={x} y={y} w={72} /> }
function BoardTable({ x, y }: { x: number; y: number }) { return <Prop src="boardroom-table" x={x} y={y} w={248} zi={6} /> }
function Screen({ x, y }: { x: number; y: number }) {
  return <div className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: x, top: y, width: 150, zIndex: 4 }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/sprites/props/projector-screen.png" alt="" draggable={false} className="w-full object-contain" />
    <span className="absolute left-1/2 top-[2px] -translate-x-1/2 text-[8px] font-extrabold tracking-widest text-white/60 whitespace-nowrap">STAKEHOLDER ROADMAP</span>
  </div>
}
function Chair({ x, y }: { x: number; y: number }) { return <Prop src="chair" x={x} y={y + 4} w={34} /> }
function Sofa({ x, y }: { x: number; y: number }) { return <Prop src="sofa" x={x} y={y} w={96} /> }
function Coffee({ x, y }: { x: number; y: number }) { return <Prop src="coffee-station" x={x} y={y} w={54} /> }
function Plant({ x, y }: { x: number; y: number }) { return <Prop src="plant" x={x} y={y} w={46} /> }
