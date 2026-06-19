"use client"
/**
 * CampusStage — the genetic campus: 3 colour-coded isometric office buildings (one per
 * competing team: Lean / Enterprise / Hacker), each with its 25 agents walking & working
 * in furnished department rooms. Click a building to zoom the camera in; click the
 * background to pull back. A side panel shows each team's project progress.
 *
 * All world content (rooms + furniture + agents) lives inside ONE camera-transformed
 * container, so pan/zoom is cheap and the agent RPG modal renders cleanly on top.
 * Demo-driven by default (progress climbs, agents cycle working/idle).
 */
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { buildRoster, TEAMS, type TeamId } from "@/lib/roster"
import { RpgCard } from "@/components/RpgCard"
import { spriteFor } from "@/lib/sprite-alias"

const TEAM_COLOR: Record<TeamId, string> = { A: "#22c55e", B: "#38bdf8", C: "#f43f5e" }
const TEAM_FLOOR: Record<TeamId, string> = { A: "#16302a", B: "#15294a", C: "#3a1726" }

const ISO_OX = 240, ISO_OY = 60, WALL_H = 40
const iso = (x: number, y: number) => ({ sx: (x - y) * 0.5 + ISO_OX, sy: (x + y) * 0.25 + ISO_OY })
const depth = (x: number, y: number) => Math.round(x + y)

type RoomRel = { x: number; y: number; w: number; h: number; label: string; emoji: string; cols: number; furn: string; fw: number }
const ROOMS_REL: Record<string, RoomRel> = {
  ti:         { x: 0,   y: 0,   w: 380, h: 300, label: "INGENIERÍA", emoji: "💻", cols: 4, furn: "it-desk",         fw: 50 },
  business:   { x: 400, y: 0,   w: 270, h: 300, label: "BUSINESS",   emoji: "📊", cols: 2, furn: "cubicle",         fw: 60 },
  design:     { x: 0,   y: 320, w: 250, h: 230, label: "DISEÑO",     emoji: "🎨", cols: 2, furn: "easel",           fw: 54 },
  management: { x: 270, y: 320, w: 400, h: 230, label: "DIRECCIÓN",  emoji: "👑", cols: 1, furn: "boardroom-table", fw: 140 },
}
const BUILD_W = 670, BUILD_H = 550
const BUILDINGS: { team: TeamId; ox: number; oy: number }[] = [
  { team: "A", ox: -180, oy: -120 },
  { team: "B", ox: 1000, oy: -120 },
  { team: "C", ox: 410,  oy: 800 },
]

// central DECISION ROOM (round) — the Stakeholder + 4 advisors wait here for the 3 Queens
// to arrive and present their projects for evaluation. Sits in the gap between the 3 buildings.
const CENTER = { cx: 720, cy: 430, r: 150 }
const STAKEHOLDERS = [
  { id: "stakeholder", name: "Stakeholder", sprite: "sh-fidelity", dx: 0,   dy: -62, boss: true },
  { id: "adv-growth",  name: "Growth",       sprite: "sh-growth",       dx: -78, dy: -12 },
  { id: "adv-arch",    name: "Arquitectura", sprite: "sh-architecture", dx: 78,  dy: -12 },
  { id: "adv-design",  name: "Diseño",       sprite: "sh-design",       dx: -50, dy: 52 },
  { id: "adv-biz",     name: "Negocio",      sprite: "sh-business",     dx: 50,  dy: 52 },
]
function isoCircle(cx: number, cy: number, r: number, n = 44) {
  return Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return iso(cx + Math.cos(a) * r, cy + Math.sin(a) * r) })
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
function grid(rx: number, ry: number, rw: number, rh: number, n: number, cols: number) {
  const out: { x: number; y: number }[] = []
  const rows = Math.ceil(n / cols)
  const cw = (rw - 70) / cols, ch = (rh - 90) / Math.max(1, rows)
  for (let i = 0; i < n; i++) { const c = i % cols, ro = Math.floor(i / cols); out.push({ x: rx + 35 + cw * c + cw / 2, y: ry + 70 + ch * ro + ch / 2 }) }
  return out
}

interface Sim { x: number; y: number; wx: number; wy: number; nextWander: number; face: number; seed: number; home: { x: number; y: number } }

export function CampusStage() {
  const roster = useMemo(() => buildRoster(), [])
  const [sel, setSel] = useState<string | null>(null)
  const [focus, setFocus] = useState<TeamId | null>(null)
  const [progress, setProgress] = useState<Record<TeamId, number>>({ A: 6, B: 4, C: 9 })
  const [, force] = useState(0)

  const soloFurn = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("solo") === "furn"
  const containerRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const wrapRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const sprRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const sim = useRef<Map<string, Sim>>(new Map())
  const working = useRef<Set<string>>(new Set())
  const view = useRef({ s: 0.62, x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null)

  const roomRect = (team: TeamId, room: string) => {
    const b = BUILDINGS.find((x) => x.team === team)!; const r = ROOMS_REL[room]
    return { x: b.ox + r.x, y: b.oy + r.y, w: r.w, h: r.h }
  }
  const buildBox = (team: TeamId) => {
    const b = BUILDINGS.find((x) => x.team === team)!
    const cs = [iso(b.ox, b.oy), iso(b.ox + BUILD_W, b.oy), iso(b.ox + BUILD_W, b.oy + BUILD_H), iso(b.ox, b.oy + BUILD_H)]
    const xs = cs.map((c) => c.sx), ys = cs.map((c) => c.sy)
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys) - WALL_H, maxY: Math.max(...ys) }
  }

  // desks per (team, room) — homes for agents AND furniture positions
  const desks = useMemo(() => {
    const byTeamRoom: Record<string, number> = {}
    for (const a of roster) { const k = a.team + ":" + a.room; byTeamRoom[k] = (byTeamRoom[k] || 0) + 1 }
    const d: Record<string, { x: number; y: number }[]> = {}
    for (const team of ["A", "B", "C"] as TeamId[]) for (const room of Object.keys(ROOMS_REL)) {
      const rr = roomRect(team, room); const r = ROOMS_REL[room]
      const n = byTeamRoom[team + ":" + room] || 1
      d[team + ":" + room] = room === "management" ? [{ x: rr.x + rr.w / 2, y: rr.y + rr.h / 2 }] : grid(rr.x, rr.y, rr.w, rr.h, Math.max(1, n), r.cols)
    }
    return d
  }, [roster])

  // furniture list (static)
  const furniture = useMemo(() => {
    const out: { team: TeamId; x: number; y: number; src: string; w: number }[] = []
    for (const team of ["A", "B", "C"] as TeamId[]) for (const room of Object.keys(ROOMS_REL)) {
      const r = ROOMS_REL[room]
      for (const d of desks[team + ":" + room] || []) out.push({ team, x: d.x, y: d.y, src: r.furn, w: r.fw })
      // a plant in the room corner for life
      const rr = roomRect(team, room)
      out.push({ team, x: rr.x + rr.w - 30, y: rr.y + 36, src: "plant", w: 36 })
    }
    return out
  }, [desks])

  useEffect(() => {
    const idx: Record<string, number> = {}
    roster.forEach((a, i) => {
      const k = a.team + ":" + a.room; const di = (idx[k] = (idx[k] ?? -1) + 1)
      const arr = desks[k]; const d = arr[di] || arr[arr.length - 1]
      // SEATED: queen stands in front of the boardroom table; everyone else sits just BEHIND
      // their desk so the (front) desk occludes their legs via depth-sort → reads as seated.
      const h = a.room === "management" ? { x: d.x, y: d.y + 64 } : { x: d.x, y: d.y - 8 }
      sim.current.set(a.id, { x: h.x, y: h.y, wx: h.x, wy: h.y, nextWander: 0, face: 1, seed: i * 1.3, home: h })
    })
    force((n) => n + 1)
  }, [roster, desks])

  // demo driver: progress climbs; a rotating subset of agents is "working"
  useEffect(() => {
    let alive = true
    const tick = () => {
      if (!alive) return
      setProgress((p) => ({ A: Math.min(100, p.A + rnd(0.3, 1.4)), B: Math.min(100, p.B + rnd(0.2, 1.1)), C: Math.min(100, p.C + rnd(0.4, 1.6)) }))
      const w = new Set<string>(); for (const a of roster) if (Math.random() < 0.4) w.add(a.id)
      working.current = w
    }
    const id = setInterval(tick, 1600)
    return () => { alive = false; clearInterval(id) }
  }, [roster])

  function applyCamera() {
    const el = containerRef.current; if (!el) return
    const cw = el.clientWidth, ch = el.clientHeight
    let bbox: { minX: number; maxX: number; minY: number; maxY: number }; let pad = 0.86
    if (focus) { bbox = buildBox(focus); pad = 0.9 }
    else {
      const cpts = isoCircle(CENTER.cx, CENTER.cy, CENTER.r)
      const boxes = [...(["A", "B", "C"] as TeamId[]).map(buildBox), {
        minX: Math.min(...cpts.map((p) => p.sx)), maxX: Math.max(...cpts.map((p) => p.sx)),
        minY: Math.min(...cpts.map((p) => p.sy)), maxY: Math.max(...cpts.map((p) => p.sy)),
      }]
      bbox = { minX: Math.min(...boxes.map((b) => b.minX)), maxX: Math.max(...boxes.map((b) => b.maxX)), minY: Math.min(...boxes.map((b) => b.minY)), maxY: Math.max(...boxes.map((b) => b.maxY)) }
    }
    const bw = bbox.maxX - bbox.minX, bh = bbox.maxY - bbox.minY
    const s = Math.max(0.28, Math.min(1.5, Math.min(cw / bw, ch / bh) * pad))
    const cx = (bbox.minX + bbox.maxX) / 2, cy = (bbox.minY + bbox.maxY) / 2
    view.current = { s, x: cw / 2 - cx * s, y: ch / 2 - cy * s }
    if (worldRef.current) worldRef.current.style.transform = `translate(${view.current.x}px,${view.current.y}px) scale(${s})`
  }
  useEffect(() => { applyCamera(); force((n) => n + 1) /* eslint-disable-next-line */ }, [focus])
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const t = q.get("team"); if (t === "A" || t === "B" || t === "C") setFocus(t)
    const c = q.get("card"); if (c) setSel(c)
  }, [])

  // rAF walk loop — agents positioned in WORLD (iso) coords; camera handled by the container
  useEffect(() => {
    let raf = 0; const SPEED = 2.0
    const frame = (t: number) => {
      for (const a of roster) {
        const s = sim.current.get(a.id), node = wrapRefs.current.get(a.id), spr = sprRefs.current.get(a.id)
        if (!s || !node || !spr) continue
        const isWorking = working.current.has(a.id) || a.queen
        let tx: number, ty: number
        if (isWorking) { tx = s.home.x; ty = s.home.y }
        else {
          const rr = roomRect(a.team, a.room)
          if (Math.hypot(s.wx - s.x, s.wy - s.y) < 4 && t > s.nextWander) { s.wx = rnd(rr.x + 34, rr.x + rr.w - 34); s.wy = rnd(rr.y + 56, rr.y + rr.h - 28); s.nextWander = t + 1500 + Math.random() * 3200 }
          tx = s.wx; ty = s.wy
        }
        const dx = tx - s.x, dy = ty - s.y, dist = Math.hypot(dx, dy), moving = dist > 1.6
        if (moving) { s.x += (dx / dist) * SPEED; s.y += (dy / dist) * SPEED; if (Math.abs(dx) > 0.6) s.face = dx < 0 ? -1 : 1 }
        const p = iso(s.x, s.y)
        const bob = moving ? Math.abs(Math.sin(t / 95)) * 3 : isWorking ? Math.sin(t / 150 + s.seed) * 1.2 : Math.sin(t / 600 + s.seed) * 0.9
        node.style.transform = `translate(${p.sx}px,${p.sy}px) translate(-50%,-100%)`
        node.style.zIndex = String(depth(s.x, s.y) * 2 + 4001)
        node.style.opacity = focus && a.team !== focus ? "0.08" : "1"
        spr.style.transform = `scaleX(${s.face}) translateY(${-bob}px)`
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf)
  }, [roster, focus])

  function onWheel(e: React.WheelEvent) { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); const s = Math.min(1.8, Math.max(0.24, view.current.s - e.deltaY * 0.0015)); view.current = { ...view.current, s }; if (worldRef.current) worldRef.current.style.transform = `translate(${view.current.x}px,${view.current.y}px) scale(${s})` }
  function onDown(e: React.MouseEvent) { drag.current = { x: e.clientX, y: e.clientY, vx: view.current.x, vy: view.current.y, moved: false } }
  function onMove(e: React.MouseEvent) { const d = drag.current; if (!d) return; if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) d.moved = true; view.current = { ...view.current, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) }; if (worldRef.current) worldRef.current.style.transform = `translate(${view.current.x}px,${view.current.y}px) scale(${view.current.s})` }
  function onUp() { drag.current = null }

  const cam = view.current
  const cnt = (team: TeamId) => roster.filter((a) => a.team === team).length

  // static world (rooms + furniture) — only recomputed when roster/focus change, not on pan
  const worldStatic = useMemo(() => (
    <>
      {BUILDINGS.map((b) => Object.entries(ROOMS_REL).map(([rid, r]) => (
        <RoomIso key={b.team + rid} rr={{ x: b.ox + r.x, y: b.oy + r.y, w: r.w, h: r.h }} label={r.label} emoji={r.emoji}
          color={TEAM_COLOR[b.team]} floor={TEAM_FLOOR[b.team]} dim={!!focus && focus !== b.team}
          onClick={(e) => { e.stopPropagation(); setFocus(b.team) }} />
      )))}
      {/* furniture only appears once you ZOOM into a building (focus) — keeps the overview clean */}
      {focus && furniture.map((f, i) => {
        const p = iso(f.x, f.y)
        return (
          <div key={"f" + i} className="absolute pointer-events-none" style={{ left: p.sx, top: p.sy, transform: "translate(-50%,-100%)", zIndex: depth(f.x, f.y) * 2 + 4000, opacity: f.team !== focus ? 0.1 : 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/sprites/props/${f.src}.png`} alt="" draggable={false} style={{ width: f.w, height: "auto", maxWidth: "none" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden" }} />
          </div>
        )
      })}
    </>
  ), [furniture, focus])

  return (
    <div className="relative rounded-3xl border border-white/10 bg-[#070a12] overflow-hidden select-none" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(80,90,160,.08), transparent 60%)" }}>
      <div className="absolute inset-x-0 top-0 z-40 flex items-center gap-4 border-b border-white/10 bg-black/50 px-4 py-2 backdrop-blur">
        <span className="text-sm font-extrabold tracking-wide text-white">🏛️ CAMPUS · enjambre genético</span>
        <span className="text-xs text-white/55">AGENTES <b className="text-white">{roster.length}/75</b></span>
        {focus && <button onClick={() => setFocus(null)} className="ml-2 rounded-lg bg-violet px-2.5 py-1 text-xs font-bold text-white">← Campus overview</button>}
        <span className="ml-auto text-[10px] text-white/35">click un edificio para zoom · arrastrá · Ctrl+rueda</span>
      </div>

      <div ref={containerRef} className="relative h-[640px] overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onClick={() => { if (!drag.current?.moved && focus) setFocus(null) }}>

        {/* ONE camera-transformed world container */}
        <div ref={worldRef} className="absolute left-0 top-0" style={{ transformOrigin: "0 0", transform: `translate(${cam.x}px,${cam.y}px) scale(${cam.s})` }}>
          {worldStatic}

          {/* central DECISION ROOM (round) + Stakeholder & 4 advisors waiting for the Queens */}
          <CenterRoom queensPresenting={false} />
          {STAKEHOLDERS.map((s) => {
            const wx = CENTER.cx + s.dx, wy = CENTER.cy + s.dy, p = iso(wx, wy)
            return (
              <div key={s.id} className="absolute flex flex-col items-center" style={{ left: p.sx, top: p.sy, transform: "translate(-50%,-100%)", zIndex: depth(wx, wy) * 2 + 4002 }}>
                <span className="mb-0.5 text-sm">{s.boss ? "⚖️" : "⏳"}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/sprites/agents/${s.sprite}.png`} alt={s.name} draggable={false}
                  className={`${s.boss ? "h-[58px] w-[58px]" : "h-[46px] w-[46px]"} object-contain drop-shadow-[0_0_8px_rgba(251,191,36,.5)]`}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden" }} />
                <span className="mt-0.5 whitespace-nowrap rounded bg-black/65 px-1 text-[8px] font-bold text-amber-200">{s.name}</span>
              </div>
            )
          })}

          {!soloFurn && roster.map((a) => {
            const w = working.current.has(a.id) || a.queen
            return (
              <div key={a.id} ref={(el) => { if (el) wrapRefs.current.set(a.id, el) }} className="absolute left-0 top-0 will-change-transform" style={{ transform: "translate(-9999px,-9999px)" }}>
                <button onClick={(e) => { e.stopPropagation(); setSel(a.id) }} className="flex flex-col items-center">
                  {w && !a.queen && <span className="mb-0.5 text-sm animate-bounce">💬</span>}
                  <div ref={(el) => { if (el) sprRefs.current.set(a.id, el) }} className="relative will-change-transform">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/sprites/agents/${spriteFor(a.role)}.png`} alt={a.name} draggable={false}
                      className={`h-[46px] w-[46px] object-contain ${w ? "drop-shadow-[0_0_8px_rgba(255,255,255,.55)]" : ""}`}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden" }} />
                    {a.queen && <span className="absolute -left-1 -top-2 text-xs">👑</span>}
                  </div>
                  {focus === a.team && <span className="mt-0.5 rounded bg-black/60 px-1 text-[7px] font-bold text-white/80 whitespace-nowrap">{a.name.replace(/ · .*/, "")}</span>}
                </button>
              </div>
            )
          })}
        </div>

        {/* building banners (outside world → constant size) */}
        {BUILDINGS.map((b) => {
          const box = buildBox(b.team); const team = TEAMS.find((t) => t.id === b.team)!
          return (
            <button key={"ban" + b.team} onClick={(e) => { e.stopPropagation(); setFocus(focus === b.team ? null : b.team) }}
              className="absolute z-30 -translate-x-1/2 rounded-lg border px-3 py-1 text-center backdrop-blur transition"
              style={{ left: ((box.minX + box.maxX) / 2) * cam.s + cam.x, top: box.minY * cam.s + cam.y - 6, borderColor: TEAM_COLOR[b.team] + "aa", background: TEAM_COLOR[b.team] + "1f", opacity: focus && focus !== b.team ? 0.25 : 1 }}>
              <div className="text-xs font-extrabold" style={{ color: TEAM_COLOR[b.team] }}>{team.label}</div>
              <div className="text-[9px] uppercase tracking-widest text-white/55">{cnt(b.team)} agentes · {Math.round(progress[b.team])}%</div>
            </button>
          )
        })}
      </div>

      {/* projects-in-progress panel */}
      <div className="absolute right-3 top-12 z-40 w-56 rounded-xl border border-white/10 bg-black/60 p-3 backdrop-blur">
        <div className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-white/50">Proyectos en curso</div>
        {(["A", "B", "C"] as TeamId[]).map((t) => {
          const team = TEAMS.find((x) => x.id === t)!
          return (
            <button key={t} onClick={() => setFocus(focus === t ? null : t)} className="mb-2 block w-full text-left">
              <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: TEAM_COLOR[t] }}>
                <span>{team.label}</span><span className="tabular-nums text-white/70">{Math.round(progress[t])}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress[t]}%`, background: TEAM_COLOR[t] }} />
              </div>
            </button>
          )
        })}
      </div>

      {/* agent RPG modal — PORTALED to <body> so no campus sprite/compositing layer can cover it */}
      {sel && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[2147483000] grid place-items-center bg-black/80 p-4" onClick={() => setSel(null)}>
          <div onClick={(e) => e.stopPropagation()}><RpgCard id={sel} onClose={() => setSel(null)} /></div>
        </div>,
        document.body,
      )}
    </div>
  )
}

/* central round DECISION ROOM — floor disc + round table + caption */
function CenterRoom({ queensPresenting }: { queensPresenting: boolean }) {
  const pts = isoCircle(CENTER.cx, CENTER.cy, CENTER.r)
  const minX = Math.min(...pts.map((p) => p.sx)), minY = Math.min(...pts.map((p) => p.sy)) - 26
  const maxX = Math.max(...pts.map((p) => p.sx)), maxY = Math.max(...pts.map((p) => p.sy))
  const poly = (arr: { sx: number; sy: number }[]) => arr.map((p) => `${(p.sx - minX).toFixed(1)},${(p.sy - minY).toFixed(1)}`).join(" ")
  const labelP = iso(CENTER.cx, CENTER.cy - CENTER.r)
  return (
    <>
      <div className="absolute pointer-events-none" style={{ left: minX, top: minY, zIndex: Math.round(CENTER.cx + CENTER.cy) }}>
        <svg style={{ overflow: "visible", width: maxX - minX, height: maxY - minY }}>
          <polygon points={poly(pts)} fill="#241d0c" />
          <polygon points={poly(pts)} fill="rgba(251,191,36,.12)" stroke="rgba(251,191,36,.55)" strokeWidth="2.5" />
          <polygon points={poly(isoCircle(CENTER.cx, CENTER.cy, 58, 40))} fill="#5a4332" stroke="rgba(0,0,0,.45)" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: labelP.sx, top: labelP.sy - 24, zIndex: 9500 }}>
        <div className="whitespace-nowrap rounded-lg border border-amber-400/50 bg-amber-500/15 px-3 py-1 text-center backdrop-blur">
          <div className="text-[11px] font-extrabold tracking-wider text-amber-300">⚖️ SALA DE DECISIÓN</div>
          <div className="text-[8px] uppercase tracking-widest text-white/55">{queensPresenting ? "las reinas presentan sus proyectos" : "esperando a las 3 reinas…"}</div>
        </div>
      </div>
    </>
  )
}

/* one iso room (floor + back walls + grid) — positioned in WORLD coords (camera is on the parent) */
function RoomIso({ rr, label, emoji, color, floor, dim, onClick }:
  { rr: { x: number; y: number; w: number; h: number }; label: string; emoji: string; color: string; floor: string; dim: boolean; onClick: (e: React.MouseEvent) => void }) {
  const A = iso(rr.x, rr.y), B = iso(rr.x + rr.w, rr.y), C = iso(rr.x + rr.w, rr.y + rr.h), D = iso(rr.x, rr.y + rr.h)
  const pts = [A, B, C, D]
  const minX = Math.min(...pts.map((p) => p.sx)), minY = Math.min(...pts.map((p) => p.sy)) - WALL_H
  const maxX = Math.max(...pts.map((p) => p.sx)), maxY = Math.max(...pts.map((p) => p.sy))
  const L = (p: { sx: number; sy: number }) => `${(p.sx - minX).toFixed(1)},${(p.sy - minY).toFixed(1)}`
  const U = (p: { sx: number; sy: number }) => `${(p.sx - minX).toFixed(1)},${(p.sy - minY - WALL_H).toFixed(1)}`
  const lines: string[] = []
  for (let t = 64; t < rr.w; t += 64) { const p1 = iso(rr.x + t, rr.y), p2 = iso(rr.x + t, rr.y + rr.h); lines.push(`M${L(p1)} L${L(p2)}`) }
  for (let t = 64; t < rr.h; t += 64) { const p1 = iso(rr.x, rr.y + t), p2 = iso(rr.x + rr.w, rr.y + t); lines.push(`M${L(p1)} L${L(p2)}`) }
  const labelP = iso(rr.x + 8, rr.y + 8)
  return (
    <div className="absolute" style={{ left: minX, top: minY, zIndex: Math.round((rr.x + rr.y)), opacity: dim ? 0.32 : 1 }} onClick={onClick}>
      <svg style={{ overflow: "visible", width: maxX - minX, height: maxY - minY, cursor: "zoom-in" }}>
        <polygon points={`${L(A)} ${L(B)} ${U(B)} ${U(A)}`} fill={color + "26"} stroke={color + "40"} strokeWidth="1" />
        <polygon points={`${L(A)} ${L(D)} ${U(D)} ${U(A)}`} fill="rgba(0,0,0,.32)" stroke={color + "30"} strokeWidth="1" />
        <polygon points={`${L(A)} ${L(B)} ${L(C)} ${L(D)}`} fill={floor} />
        <polygon points={`${L(A)} ${L(B)} ${L(C)} ${L(D)}`} fill={color + "22"} />
        <path d={lines.join(" ")} stroke="rgba(255,255,255,.06)" fill="none" strokeWidth="1" />
        <polygon points={`${L(A)} ${L(B)} ${L(C)} ${L(D)}`} fill="none" stroke={color + "70"} strokeWidth="1.2" />
      </svg>
      <span className="absolute whitespace-nowrap rounded bg-black/45 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-white/70" style={{ left: labelP.sx - minX, top: labelP.sy - minY - WALL_H - 12 }}>{emoji} {label}</span>
    </div>
  )
}
