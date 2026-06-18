"use client"
/**
 * OfficeStage — a living 2.5D isometric office (sprites = 2D billboards on an iso world,
 * Prison-Empire / Stardew style). World logic stays in flat (x,y); rendering projects to
 * isometric with depth-sorting + SVG floors/walls. Behaviour:
 *  - building → agents work at their desk (glow + 💬); planning → Queen presents at the
 *    forum, discovery sit; supervision → Queen + stakeholders meet at the boardroom.
 *  - finished agents relax in the rest area; the rest wander their own room.
 *  - each finished task pops a comic "I finished X" card (queues up, skippable).
 * Agents are clamped inside their room (no off-screen). Pan + buttons/Ctrl-wheel zoom.
 */
import { useEffect, useMemo, useRef, useState } from "react"
import { SWARM_AGENTS, STEP_TO_AGENT, type SwarmAgent } from "@/lib/swarm-agents"

export type Step = { key: string; label: string; status: "pending" | "running" | "done" | "error"; detail?: string }

const W = 1420, H = 900
type Rect = { x: number; y: number; w: number; h: number; label: string; tint: string; floor: string; emoji: string }
const ROOMS: Record<string, Rect> = {
  ti:         { x: 30,  y: 30,  w: 650, h: 330, label: "TI OFFICE", tint: "rgba(56,110,200,.28)", floor: "#1b2740", emoji: "💻" },
  business:   { x: 720, y: 30,  w: 670, h: 330, label: "BUSINESS OFFICE", tint: "rgba(45,200,150,.26)", floor: "#16302a", emoji: "📊" },
  design:     { x: 30,  y: 400, w: 360, h: 300, label: "ESTUDIO DE DISEÑO", tint: "rgba(160,90,255,.28)", floor: "#251b40", emoji: "🎨" },
  forum:      { x: 430, y: 400, w: 500, h: 300, label: "PI PLANNING FORUM", tint: "rgba(124,58,237,.30)", floor: "#241a40", emoji: "📽️" },
  management: { x: 970, y: 400, w: 420, h: 300, label: "MANAGEMENT LOUNGE", tint: "rgba(220,70,110,.26)", floor: "#3a1726", emoji: "☕" },
  rest:       { x: 30,  y: 740, w: 1360, h: 130, label: "ÁREA DE DESCANSO", tint: "rgba(120,160,90,.24)", floor: "#23301a", emoji: "🛋️" },
}

// --- isometric projection (2.5D) ---
const ISO_OX = 470, ISO_OY = 70, WALL_H = 46
function iso(x: number, y: number) { return { sx: (x - y) * 0.5 + ISO_OX, sy: (x + y) * 0.25 + ISO_OY } }
const depth = (x: number, y: number) => Math.round(x + y)

function grid(r: Rect, n: number, cols: number) {
  const out: { x: number; y: number }[] = []
  const rows = Math.ceil(n / cols)
  const cw = (r.w - 80) / cols, ch = (r.h - 90) / Math.max(1, rows)
  for (let i = 0; i < n; i++) { const c = i % cols, ro = Math.floor(i / cols); out.push({ x: r.x + 40 + cw * c + cw / 2, y: r.y + 70 + ch * ro + ch / 2 }) }
  return out
}
const rnd = (a: number, b: number) => a + Math.random() * (b - a)
function randPoint(roomId: string) { const r = ROOMS[roomId] || ROOMS.ti; return { x: rnd(r.x + 40, r.x + r.w - 40), y: rnd(r.y + 60, r.y + r.h - 34) } }
const DESKS: Record<string, { x: number; y: number }[]> = {
  ti: grid(ROOMS.ti, 9, 3), business: grid(ROOMS.business, 4, 2), design: grid(ROOMS.design, 2, 1),
}
const MG = ROOMS.management
const MG_TABLE = { x: MG.x + MG.w / 2, y: MG.y + MG.h / 2 + 8 }
const MG_SEATS = [
  { x: MG_TABLE.x - 110, y: MG_TABLE.y, stand: true },
  { x: MG_TABLE.x - 40, y: MG_TABLE.y - 70 }, { x: MG_TABLE.x + 40, y: MG_TABLE.y - 70 }, { x: MG_TABLE.x + 110, y: MG_TABLE.y - 70 },
  { x: MG_TABLE.x - 40, y: MG_TABLE.y + 70 }, { x: MG_TABLE.x + 40, y: MG_TABLE.y + 70 }, { x: MG_TABLE.x + 110, y: MG_TABLE.y + 70 },
] as { x: number; y: number; stand?: boolean }[]
const FO = ROOMS.forum
const FO_SCREEN = { x: FO.x + FO.w / 2, y: FO.y + 70 }
const FO_PODIUM = { x: FO.x + FO.w / 2, y: FO.y + 140, stand: true }
const FO_CHAIRS = [
  { x: FO.x + FO.w / 2 - 90, y: FO.y + 205 }, { x: FO.x + FO.w / 2, y: FO.y + 205 }, { x: FO.x + FO.w / 2 + 90, y: FO.y + 205 },
  { x: FO.x + FO.w / 2 - 50, y: FO.y + 255 }, { x: FO.x + FO.w / 2 + 50, y: FO.y + 255 },
]
const DISCOVERY = ["data-architect", "researcher", "contracts-architect"]
const partySpot = (i: number) => ({ x: ROOMS.forum.x + ROOMS.forum.w / 2 + ((i % 6) - 2.5) * 70, y: ROOMS.forum.y + 70 + Math.floor(i / 6) * 52 })

interface Sim { x: number; y: number; wx: number; wy: number; nextWander: number; face: number; seed: number }

export function OfficeStage({ steps }: { steps: Step[] }) {
  const [sel, setSel] = useState<string | null>(null)
  const [view, setView] = useState({ s: 0.82, x: 0, y: 0 })
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

  const home = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>()
    const idx: Record<string, number> = { ti: 0, business: 0, design: 0, management: 0 }
    for (const a of SWARM_AGENTS) {
      if (a.room === "management") { const i = idx.management++; const s = MG_SEATS[i] || MG_SEATS[MG_SEATS.length - 1]; m.set(a.id, { x: s.x, y: s.y }) }
      else { const arr = DESKS[a.room]; const s = arr[idx[a.room]++] || arr[arr.length - 1]; m.set(a.id, { x: s.x, y: s.y }) }
    }
    return m
  }, [])

  phaseRef.current = { planning, sh: shRunning, done: allDone }
  const stakeOrder = useMemo(() => SWARM_AGENTS.filter((a) => a.stakeholder), [])

  useEffect(() => {
    SWARM_AGENTS.forEach((a, i) => { const h = home.get(a.id)!; sim.current.set(a.id, { x: h.x, y: h.y, wx: h.x, wy: h.y, nextWander: 0, face: 1, seed: i * 1.7 }) })
  }, [home])

  // rAF walk loop — logic in world (x,y); rendered isometrically (depth-sorted).
  useEffect(() => {
    let raf = 0; const SPEED = 2.1
    const isWorking = (a: SwarmAgent) => (a.steps.map((k) => byStep.get(k)).filter(Boolean) as Step[]).some((x) => x.status === "running")
    const frame = (t: number) => {
      const ph = phaseRef.current
      for (let i = 0; i < SWARM_AGENTS.length; i++) {
        const a = SWARM_AGENTS[i]
        const s = sim.current.get(a.id), node = wrapRefs.current.get(a.id), spr = sprRefs.current.get(a.id)
        if (!s || !node || !spr) continue
        const working = isWorking(a)
        const ss = a.steps.map((k) => byStep.get(k)).filter(Boolean) as Step[]
        const doneAll = ss.length > 0 && ss.every((x) => x.status === "done")
        let tx: number, ty: number, roomId = a.room as string
        if (ph.done) { const p = partySpot(i); tx = p.x; ty = p.y; roomId = "forum" }
        else if (ph.planning && a.queen) { tx = FO_PODIUM.x; ty = FO_PODIUM.y; roomId = "forum" }
        else if (ph.planning && DISCOVERY.includes(a.id)) { const c = FO_CHAIRS[DISCOVERY.indexOf(a.id)]; tx = c.x; ty = c.y; roomId = "forum" }
        else if (ph.sh && a.queen) { tx = MG_SEATS[0].x; ty = MG_SEATS[0].y; roomId = "management" }
        else if (ph.sh && a.stakeholder) { const m = MG_SEATS[stakeOrder.indexOf(a) + 1] || MG_SEATS[1]; tx = m.x; ty = m.y; roomId = "management" }
        else if (working) { const h = home.get(a.id)!; tx = h.x; ty = h.y }
        else {
          roomId = doneAll ? "rest" : a.room
          if (Math.hypot(s.wx - s.x, s.wy - s.y) < 4 && t > s.nextWander) { const p = randPoint(roomId); s.wx = p.x; s.wy = p.y; s.nextWander = t + 1800 + Math.random() * 3500 }
          tx = s.wx; ty = s.wy
        }
        const dx = tx - s.x, dy = ty - s.y, dist = Math.hypot(dx, dy), moving = dist > 1.6
        if (moving) { s.x += (dx / dist) * SPEED; s.y += (dy / dist) * SPEED; if (Math.abs(dx) > 0.6) s.face = dx < 0 ? -1 : 1 }
        if (!moving) { const r = ROOMS[roomId]; if (r) { s.x = Math.max(r.x + 22, Math.min(r.x + r.w - 22, s.x)); s.y = Math.max(r.y + 44, Math.min(r.y + r.h - 22, s.y)) } }
        const p = iso(s.x, s.y)
        const bob = ph.done ? Math.abs(Math.sin(t / 120 + s.seed)) * 9 : moving ? Math.abs(Math.sin(t / 95)) * 3 : working ? Math.sin(t / 160 + s.seed) * 1.1 : Math.sin(t / 600 + s.seed) * 1
        node.style.transform = `translate(${p.sx}px,${p.sy}px) translate(-50%,-100%)`
        node.style.zIndex = String(depth(s.x, s.y) + 1000)
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
  useEffect(() => {
    if (!reports.length) return
    const t = setTimeout(() => setReports((q) => q.slice(1)), 7000)
    return () => clearTimeout(t)
  }, [reports])
  const report = reports[0]

  function onWheel(e: React.WheelEvent) { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); setView((v) => ({ ...v, s: Math.min(1.7, Math.max(0.45, v.s - e.deltaY * 0.0015)) })) }
  function onDown(e: React.MouseEvent) { drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y } }
  function onMove(e: React.MouseEvent) { const d = drag.current; if (!d) return; setView((v) => ({ ...v, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) })) }
  function onUp() { drag.current = null }
  const zoom = (d: number) => setView((v) => ({ ...v, s: Math.min(1.7, Math.max(0.45, v.s + d)) }))

  return (
    <div className="relative rounded-3xl border border-white/10 bg-[#0a0d14] overflow-hidden select-none">
      <div className="relative h-[600px] overflow-hidden cursor-grab active:cursor-grabbing" onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
        <div className="absolute left-1/2 top-3 origin-top" style={{ transform: `translate(-50%,0) translate(${view.x}px,${view.y}px) scale(${view.s})` }}>
          <div className="relative" style={{ width: 1240, height: 700 }}>
            {/* iso rooms (floor + back walls + grid) */}
            {Object.entries(ROOMS).map(([id, r]) => (
              <RoomIso key={id} r={r} hot={(id === "forum" && planning) || (id === "management" && shRunning)} />
            ))}

            {/* furniture (iso-projected, depth-sorted) */}
            {DESKS.ti.map((d, i) => <Prop key={"td" + i} src="it-desk" x={d.x} y={d.y} w={78} />)}
            {DESKS.business.map((d, i) => <Prop key={"bc" + i} src="cubicle" x={d.x} y={d.y} w={84} />)}
            {DESKS.design.map((d, i) => <Prop key={"es" + i} src="easel" x={d.x} y={d.y} w={72} />)}
            <Prop src="boardroom-table" x={MG_TABLE.x} y={MG_TABLE.y} w={150} />
            <Prop src="projector-screen" x={FO_SCREEN.x} y={FO_SCREEN.y} w={120} roadmap />
            {FO_CHAIRS.map((c, i) => <Prop key={"fc" + i} src="chair" x={c.x} y={c.y} w={34} />)}
            <Prop src="sofa" x={ROOMS.rest.x + 160} y={ROOMS.rest.y + 70} w={96} />
            <Prop src="sofa" x={ROOMS.rest.x + 360} y={ROOMS.rest.y + 70} w={96} />
            <Prop src="coffee-station" x={ROOMS.rest.x + 540} y={ROOMS.rest.y + 65} w={54} />
            <Prop src="plant" x={ROOMS.ti.x + ROOMS.ti.w - 50} y={ROOMS.ti.y + 70} w={44} />
            <Prop src="plant" x={ROOMS.business.x + ROOMS.business.w - 50} y={ROOMS.business.y + 240} w={44} />
            <Prop src="plant" x={ROOMS.rest.x + ROOMS.rest.w - 70} y={ROOMS.rest.y + 70} w={44} />

            {/* agents — 2D billboards, positioned/depth-sorted via rAF */}
            {SWARM_AGENTS.map((a) => {
              const st = agentState(a), working = st.status === "running"
              return (
                <div key={a.id} ref={(el) => { if (el) wrapRefs.current.set(a.id, el) }} className="absolute left-0 top-0 will-change-transform" style={{ transform: "translate(-9999px,-9999px)" }}>
                  <button onClick={(e) => { e.stopPropagation(); setSel(a.id === sel ? null : a.id) }} className="flex flex-col items-center">
                    {working && <span className="mb-0.5 text-base animate-bounce">💬</span>}
                    <div ref={(el) => { if (el) sprRefs.current.set(a.id, el) }} className="relative will-change-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/sprites/agents/${a.id}.png`} alt={a.name} draggable={false}
                        className={`w-[52px] h-[52px] object-contain ${st.status === "pending" ? "opacity-85" : ""} ${working ? "drop-shadow-[0_0_9px_rgba(124,58,237,.8)]" : ""}`} />
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
          <button onClick={() => setView({ s: 0.82, x: 0, y: 0 })} className="h-7 px-2 rounded-lg bg-black/60 text-white text-[10px] font-bold">reset</button>
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

/* iso room: floor diamond + two back walls + tile grid, drawn as one SVG */
function RoomIso({ r, hot }: { r: Rect; hot: boolean }) {
  const A = iso(r.x, r.y), B = iso(r.x + r.w, r.y), C = iso(r.x + r.w, r.y + r.h), D = iso(r.x, r.y + r.h)
  const pts = [A, B, C, D]
  const minX = Math.min(...pts.map((p) => p.sx)), minY = Math.min(...pts.map((p) => p.sy)) - WALL_H
  const maxX = Math.max(...pts.map((p) => p.sx)), maxY = Math.max(...pts.map((p) => p.sy))
  const L = (p: { sx: number; sy: number }) => `${(p.sx - minX).toFixed(1)},${(p.sy - minY).toFixed(1)}`
  const U = (p: { sx: number; sy: number }) => `${(p.sx - minX).toFixed(1)},${(p.sy - minY - WALL_H).toFixed(1)}`
  const lines: string[] = []
  for (let t = 64; t < r.w; t += 64) { const p1 = iso(r.x + t, r.y), p2 = iso(r.x + t, r.y + r.h); lines.push(`M${L(p1)} L${L(p2)}`) }
  for (let t = 64; t < r.h; t += 64) { const p1 = iso(r.x, r.y + t), p2 = iso(r.x + r.w, r.y + t); lines.push(`M${L(p1)} L${L(p2)}`) }
  const labelP = iso(r.x + 8, r.y + 8)
  return (
    <>
      <svg style={{ position: "absolute", left: minX, top: minY, width: maxX - minX, height: maxY - minY, overflow: "visible", zIndex: Math.round((r.x + r.y) / 6) }}>
        <polygon points={`${L(A)} ${L(B)} ${U(B)} ${U(A)}`} fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.10)" strokeWidth="1" />
        <polygon points={`${L(A)} ${L(D)} ${U(D)} ${U(A)}`} fill="rgba(0,0,0,.28)" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
        <polygon points={`${L(A)} ${L(B)} ${L(C)} ${L(D)}`} fill={r.floor} />
        <polygon points={`${L(A)} ${L(B)} ${L(C)} ${L(D)}`} fill={r.tint} />
        <path d={lines.join(" ")} stroke="rgba(255,255,255,.06)" fill="none" strokeWidth="1" />
        <polygon points={`${L(A)} ${L(B)} ${L(C)} ${L(D)}`} fill="none" stroke={hot ? "rgba(159,103,255,.9)" : "rgba(255,255,255,.16)"} strokeWidth={hot ? 2.5 : 1.2} />
      </svg>
      <div className="absolute" style={{ left: labelP.sx, top: labelP.sy - WALL_H - 14, zIndex: 900 }}>
        <span className="rounded bg-black/45 px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-white/70 whitespace-nowrap">{r.emoji} {r.label}</span>
      </div>
    </>
  )
}

function Prop({ src, x, y, w, roadmap }: { src: string; x: number; y: number; w: number; roadmap?: boolean }) {
  const p = iso(x, y)
  return (
    <div className="absolute pointer-events-none" style={{ left: p.sx, top: p.sy, transform: "translate(-50%,-100%)", zIndex: depth(x, y) + 1000 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/sprites/props/${src}.png`} alt="" draggable={false} className="object-contain" style={{ width: w }} />
      {roadmap && <span className="absolute left-1/2 -translate-x-1/2 top-1 text-[7px] font-extrabold tracking-wider text-white/70 whitespace-nowrap">STAKEHOLDER ROADMAP</span>}
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
