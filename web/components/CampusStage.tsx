"use client"
/**
 * CampusStage — the genetic campus: 3 colour-coded isometric office buildings (one per
 * competing team: Lean / Enterprise / Hacker), each with its 25 agents walking & working
 * in department rooms. Click a building to zoom the camera into it for a closer look;
 * click the background to pull back to the campus overview. A side panel shows each team's
 * project progress. 2.5D = 2D sprites as billboards on an SVG isometric world (depth-sorted).
 *
 * Demo-driven by default (progress climbs, agents cycle between working/idle) so it shows
 * the vision without a live build; pass `progress`/`working` to drive it from real data.
 */
import { useEffect, useMemo, useRef, useState } from "react"
import { buildRoster, TEAMS, type TeamId } from "@/lib/roster"
import { RpgCard } from "@/components/RpgCard"
import { spriteFor } from "@/lib/sprite-alias"

const TEAM_COLOR: Record<TeamId, string> = { A: "#22c55e", B: "#38bdf8", C: "#f43f5e" }
const TEAM_FLOOR: Record<TeamId, string> = { A: "#16302a", B: "#15294a", C: "#3a1726" }

// --- isometric projection ---
const ISO_OX = 240, ISO_OY = 60, WALL_H = 40
const iso = (x: number, y: number) => ({ sx: (x - y) * 0.5 + ISO_OX, sy: (x + y) * 0.25 + ISO_OY })
const depth = (x: number, y: number) => Math.round(x + y)

// rooms within a single building (relative to the building origin)
type RoomRel = { x: number; y: number; w: number; h: number; label: string; emoji: string; cols: number }
const ROOMS_REL: Record<string, RoomRel> = {
  ti:         { x: 0,   y: 0,   w: 360, h: 250, label: "INGENIERÍA",  emoji: "💻", cols: 4 },
  business:   { x: 380, y: 0,   w: 250, h: 250, label: "BUSINESS",    emoji: "📊", cols: 2 },
  design:     { x: 0,   y: 270, w: 230, h: 210, label: "DISEÑO",      emoji: "🎨", cols: 2 },
  management: { x: 250, y: 270, w: 380, h: 210, label: "DIRECCIÓN",   emoji: "👑", cols: 1 },
}
const BUILD_W = 630, BUILD_H = 480
const BUILDINGS: { team: TeamId; ox: number; oy: number }[] = [
  { team: "A", ox: 0,   oy: 0 },
  { team: "B", ox: 800, oy: 0 },
  { team: "C", ox: 400, oy: 600 },
]

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
function grid(rx: number, ry: number, rw: number, rh: number, n: number, cols: number) {
  const out: { x: number; y: number }[] = []
  const rows = Math.ceil(n / cols)
  const cw = (rw - 70) / cols, ch = (rh - 90) / Math.max(1, rows)
  for (let i = 0; i < n; i++) { const c = i % cols, ro = Math.floor(i / cols); out.push({ x: rx + 35 + cw * c + cw / 2, y: ry + 70 + ch * ro + ch / 2 }) }
  return out
}

interface Sim { x: number; y: number; wx: number; wy: number; nextWander: number; face: number; seed: number; room: string; bx: number; by: number; home: { x: number; y: number } }

export function CampusStage() {
  const roster = useMemo(() => buildRoster(), [])
  const [sel, setSel] = useState<string | null>(null)
  const [focus, setFocus] = useState<TeamId | null>(null)
  const [progress, setProgress] = useState<Record<TeamId, number>>({ A: 6, B: 4, C: 9 })
  const [, force] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const wrapRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const sprRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const sim = useRef<Map<string, Sim>>(new Map())
  const working = useRef<Set<string>>(new Set())
  const view = useRef({ s: 0.62, x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null)

  // absolute world rect of a room in a given building
  const roomRect = (team: TeamId, room: string) => {
    const b = BUILDINGS.find((x) => x.team === team)!; const r = ROOMS_REL[room]
    return { x: b.ox + r.x, y: b.oy + r.y, w: r.w, h: r.h }
  }
  // building screen bbox (for camera + click overlay)
  const buildBox = (team: TeamId) => {
    const b = BUILDINGS.find((x) => x.team === team)!
    const cs = [iso(b.ox, b.oy), iso(b.ox + BUILD_W, b.oy), iso(b.ox + BUILD_W, b.oy + BUILD_H), iso(b.ox, b.oy + BUILD_H)]
    const xs = cs.map((c) => c.sx), ys = cs.map((c) => c.sy)
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys) - WALL_H, maxY: Math.max(...ys) }
  }

  // assign each agent a home desk + initial sim
  useEffect(() => {
    const byTeamRoom: Record<string, string[]> = {}
    for (const a of roster) { const k = a.team + ":" + a.room; (byTeamRoom[k] ||= []).push(a.id) }
    const desks: Record<string, { x: number; y: number }[]> = {}
    for (const team of ["A", "B", "C"] as TeamId[]) for (const room of Object.keys(ROOMS_REL)) {
      const rr = roomRect(team, room); const r = ROOMS_REL[room]
      const n = (byTeamRoom[team + ":" + room] || []).length
      desks[team + ":" + room] = room === "management"
        ? [{ x: rr.x + rr.w / 2, y: rr.y + rr.h / 2 }]
        : grid(rr.x, rr.y, rr.w, rr.h, Math.max(1, n), r.cols)
    }
    const idx: Record<string, number> = {}
    roster.forEach((a, i) => {
      const k = a.team + ":" + a.room; const di = (idx[k] = (idx[k] ?? -1) + 1)
      const d = desks[k][di] || desks[k][desks[k].length - 1]
      sim.current.set(a.id, { x: d.x, y: d.y, wx: d.x, wy: d.y, nextWander: 0, face: 1, seed: i * 1.3, room: a.room, bx: 0, by: 0, home: d })
    })
    force((n) => n + 1)
  }, [roster])

  // demo driver: progress climbs; a rotating subset of agents is "working"
  useEffect(() => {
    let alive = true
    const tick = () => {
      if (!alive) return
      setProgress((p) => ({ A: Math.min(100, p.A + rnd(0.3, 1.4)), B: Math.min(100, p.B + rnd(0.2, 1.1)), C: Math.min(100, p.C + rnd(0.4, 1.6)) }))
      // refresh the working set (~40% busy), more as progress rises
      const w = new Set<string>()
      for (const a of roster) { if (Math.random() < 0.4) w.add(a.id) }
      working.current = w
    }
    const id = setInterval(tick, 1600)
    return () => { alive = false; clearInterval(id) }
  }, [roster])

  // camera: fit overview, or focus a building, computed from the live container size
  function applyCamera() {
    const el = containerRef.current; if (!el) return
    const cw = el.clientWidth, ch = el.clientHeight
    let bbox: { minX: number; maxX: number; minY: number; maxY: number }
    let pad = 0.86
    if (focus) { bbox = buildBox(focus); pad = 0.92 }
    else {
      const all = (["A", "B", "C"] as TeamId[]).map(buildBox)
      bbox = { minX: Math.min(...all.map((b) => b.minX)), maxX: Math.max(...all.map((b) => b.maxX)), minY: Math.min(...all.map((b) => b.minY)), maxY: Math.max(...all.map((b) => b.maxY)) }
    }
    const bw = bbox.maxX - bbox.minX, bh = bbox.maxY - bbox.minY
    const s = Math.max(0.3, Math.min(1.6, Math.min(cw / bw, ch / bh) * pad))
    const cx = (bbox.minX + bbox.maxX) / 2, cy = (bbox.minY + bbox.maxY) / 2
    view.current = { s, x: cw / 2 - cx * s, y: ch / 2 - cy * s }
  }
  useEffect(() => { applyCamera(); force((n) => n + 1) /* eslint-disable-next-line */ }, [focus])
  // deep-link a building: /campus?team=A|B|C
  useEffect(() => { const t = new URLSearchParams(window.location.search).get("team"); if (t === "A" || t === "B" || t === "C") setFocus(t) }, [])

  // rAF walk loop
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
        const cam = view.current
        node.style.transform = `translate(${p.sx * cam.s + cam.x}px,${p.sy * cam.s + cam.y}px) translate(-50%,-100%) scale(${cam.s})`
        node.style.zIndex = String(depth(s.x, s.y) + 1000)
        spr.style.transform = `scaleX(${s.face}) translateY(${-bob}px)`
        // hide agents not in the focused building
        node.style.opacity = focus && a.team !== focus ? "0" : "1"
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf)
  }, [roster, focus])

  // pan + wheel zoom (manual)
  function onWheel(e: React.WheelEvent) { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); const s = Math.min(1.8, Math.max(0.28, view.current.s - e.deltaY * 0.0015)); view.current = { ...view.current, s }; force((n) => n + 1) }
  function onDown(e: React.MouseEvent) { drag.current = { x: e.clientX, y: e.clientY, vx: view.current.x, vy: view.current.y, moved: false } }
  function onMove(e: React.MouseEvent) { const d = drag.current; if (!d) return; if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) d.moved = true; view.current = { ...view.current, x: d.vx + (e.clientX - d.x), y: d.vy + (e.clientY - d.y) }; force((n) => n + 1) }
  function onUp() { drag.current = null }

  const cam = view.current
  const cnt = (team: TeamId) => roster.filter((a) => a.team === team).length

  return (
    <div className="relative rounded-3xl border border-white/10 bg-[#070a12] overflow-hidden select-none" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(80,90,160,.08), transparent 60%)" }}>
      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-40 flex items-center gap-4 border-b border-white/10 bg-black/50 px-4 py-2 backdrop-blur">
        <span className="text-sm font-extrabold tracking-wide text-white">🏛️ CAMPUS · enjambre genético</span>
        <span className="text-xs text-white/55">AGENTES <b className="text-white">{roster.length}/75</b></span>
        {focus && <button onClick={() => setFocus(null)} className="ml-2 rounded-lg bg-violet px-2.5 py-1 text-xs font-bold text-white">← Campus overview</button>}
        <span className="ml-auto text-[10px] text-white/35">click un edificio para zoom · arrastrá · Ctrl+rueda</span>
      </div>

      <div ref={containerRef} className="relative h-[640px] overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onClick={() => { if (!drag.current?.moved && focus) setFocus(null) }}>

        {/* rooms (SVG iso) — drawn with the camera transform baked into coords */}
        {BUILDINGS.map((b) => Object.entries(ROOMS_REL).map(([rid, r]) => (
          <RoomIso key={b.team + rid} team={b.team} rid={rid} rr={{ x: b.ox + r.x, y: b.oy + r.y, w: r.w, h: r.h }} label={r.label} emoji={r.emoji}
            color={TEAM_COLOR[b.team]} floor={TEAM_FLOOR[b.team]} cam={cam} dim={!!focus && focus !== b.team}
            onClick={(e) => { e.stopPropagation(); setFocus(b.team) }} />
        )))}

        {/* building name banners (clickable) */}
        {BUILDINGS.map((b) => {
          const box = buildBox(b.team); const team = TEAMS.find((t) => t.id === b.team)!
          return (
            <button key={"ban" + b.team} onClick={(e) => { e.stopPropagation(); setFocus(focus === b.team ? null : b.team) }}
              className="absolute z-[1500] -translate-x-1/2 rounded-lg border px-3 py-1 text-center backdrop-blur transition"
              style={{ left: ((box.minX + box.maxX) / 2) * cam.s + cam.x, top: box.minY * cam.s + cam.y - 8, borderColor: TEAM_COLOR[b.team] + "aa", background: TEAM_COLOR[b.team] + "1f", opacity: focus && focus !== b.team ? 0.25 : 1 }}>
              <div className="text-xs font-extrabold" style={{ color: TEAM_COLOR[b.team] }}>{team.label}</div>
              <div className="text-[9px] uppercase tracking-widest text-white/55">{cnt(b.team)} agentes · {Math.round(progress[b.team])}%</div>
            </button>
          )
        })}

        {/* agents */}
        {roster.map((a) => {
          const w = working.current.has(a.id) || a.queen
          return (
            <div key={a.id} ref={(el) => { if (el) wrapRefs.current.set(a.id, el) }} className="absolute left-0 top-0 will-change-transform transition-opacity duration-300" style={{ transform: "translate(-9999px,-9999px)" }}>
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

      {sel && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/70 p-4" onClick={() => setSel(null)}>
          <div onClick={(e) => e.stopPropagation()}><RpgCard id={sel} onClose={() => setSel(null)} /></div>
        </div>
      )}
    </div>
  )
}

/* one iso room (floor + back walls + grid), positioned with the camera transform */
function RoomIso({ team, rid, rr, label, emoji, color, floor, cam, dim, onClick }:
  { team: TeamId; rid: string; rr: { x: number; y: number; w: number; h: number }; label: string; emoji: string; color: string; floor: string; cam: { s: number; x: number; y: number }; dim: boolean; onClick: (e: React.MouseEvent) => void }) {
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
    <div className="absolute" style={{ left: minX * cam.s + cam.x, top: minY * cam.s + cam.y, transformOrigin: "0 0", transform: `scale(${cam.s})`, zIndex: Math.round((rr.x + rr.y) / 6), opacity: dim ? 0.32 : 1 }} onClick={onClick}>
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
