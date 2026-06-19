"use client"
/**
 * RpgCard — a game-style character sheet for a Puglit agent (à la the pixel RPG cards).
 * Shows the sprite portrait, RPG stat bars (which drive the agent's Ollama temperature),
 * level/xp, projects/wins, the Queen's quality reputation, and the agent's learning diary.
 */
import { useEffect, useState } from "react"
import { spriteFor } from "@/lib/sprite-alias"

interface Stats { creativity: number; rigor: number; security: number; speed: number; depth: number }
interface Agent {
  id: string; team: string; role: string; name: string; room: string; queen: boolean; stakeholder: boolean
  stats: Stats; temperature: number; level: number; xp: number; projects: number; wins: number; quality: number
}
interface Diary { kind: string; entry: string; quality: number | null; created_at: string }

const TEAM_TINT: Record<string, string> = { A: "#22c55e", B: "#38bdf8", C: "#f43f5e" }
const TEAM_LABEL: Record<string, string> = { A: "LEAN", B: "ENTERPRISE", C: "HACKER" }
const STAT_COLOR: Record<keyof Stats, string> = { creativity: "#f59e0b", rigor: "#38bdf8", security: "#a855f7", speed: "#22c55e", depth: "#f43f5e" }
const STAT_ES: Record<keyof Stats, string> = { creativity: "CREATIVIDAD", rigor: "RIGOR", security: "SEGURIDAD", speed: "VELOCIDAD", depth: "PROFUNDIDAD" }

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-[78px] shrink-0 text-[9px] font-bold tracking-wider text-white/55">{label}</span>
      <div className="flex gap-[2px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="h-3 w-[6px] rounded-[1px]" style={{ background: i < value ? color : "rgba(255,255,255,.08)" }} />
        ))}
      </div>
      <span className="ml-1 w-3 shrink-0 text-right text-[10px] font-extrabold tabular-nums" style={{ color }}>{value}</span>
    </div>
  )
}

export function RpgCard({ id, onClose }: { id: string; onClose?: () => void }) {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [diary, setDiary] = useState<Diary[]>([])
  const [err, setErr] = useState(false)
  useEffect(() => {
    setAgent(null); setErr(false)
    fetch(`/api/genetic/agents?id=${encodeURIComponent(id)}`).then((r) => r.json())
      .then((d) => { if (d.ok) { setAgent(d.agent); setDiary(d.diary || []) } else setErr(true) }).catch(() => setErr(true))
  }, [id])

  const tint = agent ? TEAM_TINT[agent.team] || "#a855f7" : "#a855f7"
  return (
    <div className="relative w-[348px] rounded-2xl border-2 p-4 shadow-2xl" style={{ borderColor: tint, background: "linear-gradient(180deg,#15131d,#0c0b12)" }}>
      {onClose && <button onClick={onClose} className="absolute right-2 top-2 z-10 h-6 w-6 rounded-md bg-black/50 text-white/70 hover:text-white">✕</button>}
      {!agent && !err && <div className="py-16 text-center text-sm text-white/40">cargando ficha…</div>}
      {err && <div className="py-16 text-center text-sm text-red-400">no se pudo cargar la ficha</div>}
      {agent && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white">{agent.queen ? "👑 " : ""}{agent.name}</h3>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest" style={{ background: tint, color: "#0b0b10" }}>{TEAM_LABEL[agent.team]}</span>
          </div>
          <p className="mt-0.5 text-[11px] uppercase tracking-widest text-white/40">{agent.role.replace(/-/g, " ")} · {agent.room}</p>

          <div className="mt-3 flex gap-3">
            <div className="relative grid h-[104px] w-[104px] shrink-0 place-items-center overflow-hidden rounded-xl border" style={{ borderColor: tint + "66", background: "#0a0911" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/sprites/agents/${spriteFor(agent.role)}.png`} alt={agent.name} className="h-[92px] w-[92px] object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-extrabold" style={{ color: tint }}>LVL {agent.level}</span>
            </div>
            <div className="flex-1 space-y-[5px] pt-0.5">
              {(Object.keys(agent.stats) as (keyof Stats)[]).map((k) => <Bar key={k} label={STAT_ES[k]} value={agent.stats[k]} color={STAT_COLOR[k]} />)}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
            {[["PROYECTOS", agent.projects], ["WINS", agent.wins], ["CALIDAD", agent.quality ? agent.quality.toFixed(1) : "—"], ["TEMP", agent.temperature.toFixed(2)]].map(([l, v]) => (
              <div key={l as string} className="rounded-lg border border-white/10 bg-white/[.03] py-1.5">
                <div className="text-sm font-extrabold text-white tabular-nums">{v as any}</div>
                <div className="text-[8px] font-bold tracking-wider text-white/40">{l as string}</div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <div className="mb-1 text-[10px] font-extrabold tracking-widest text-white/45">DIARIO DE VIDA</div>
            {diary.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-white/[.02] px-2.5 py-2 text-[11px] text-white/40">Sin proyectos aún — la reputación se acumula con cada build.</p>
            ) : (
              <ul className="max-h-28 space-y-1 overflow-auto pr-1">
                {diary.map((d, i) => (
                  <li key={i} className="rounded-lg border border-white/10 bg-white/[.03] px-2.5 py-1.5 text-[11px] text-white/75">
                    <span className="mr-1 font-bold" style={{ color: tint }}>{d.kind}{d.quality != null ? ` ${d.quality}/10` : ""}:</span>{d.entry}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-2 text-center text-[9px] text-white/30">temp {agent.temperature} ← deriva de los stats RPG</p>
        </>
      )}
    </div>
  )
}
