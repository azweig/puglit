"use client"
/**
 * /tournament — the genetic tournament, visualized. Three competing team offices (Lean /
 * Enterprise / Hacker), each with its agents + the blueprint it designed + the judge's score;
 * and a central DECISION ROOM where the 3 Queens meet and the winner is crowned.
 * Reads the latest persisted tournament (or runs a new one) — real data from /api/genetic.
 */
import { useEffect, useState, useCallback } from "react"
import { RpgCard } from "@/components/RpgCard"

interface AgentLite { id: string; team: string; role: string; name: string; queen: boolean }
interface TeamRow { team: string; score: number | null; winner: boolean; notes: string; metrics: { tables: number; routes: number; pages: number } | null; summary: string | null; tables: string[] | null }
const META = {
  A: { tint: "#22c55e", label: "Equipo Lean", sub: "Pragmático · MVP" },
  B: { tint: "#38bdf8", label: "Equipo Enterprise", sub: "Domain-Driven" },
  C: { tint: "#f43f5e", label: "Equipo Hacker", sub: "Performance" },
} as const
type TK = keyof typeof META

const DEMO = { name: "StatusGlass", what: "A public status & incident-history page like status.claude.com: live component statuses, 90-day uptime, incident timeline, scheduled maintenance. No login.", audience: "Users of an online service checking if it is up", benefits: ["Live component status", "90-day uptime history", "Incident timeline"], monetization: "free", price: 0, modules: [], languages: "en", color: "#16A34A", email: "demo@example.com", archetype: "status_monitoring" }

function IsoOffice({ tk, agents, row, sel }: { tk: TK; agents: AgentLite[]; row?: TeamRow; sel: (id: string) => void }) {
  const m = META[tk]
  const win = row?.winner
  const queen = agents.find((a) => a.queen)
  const others = agents.filter((a) => !a.queen).slice(0, 12)
  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border-2 p-3" style={{ borderColor: win ? "#f5c518" : m.tint + "66", background: `${m.tint}0e`, boxShadow: win ? "0 0 30px rgba(245,197,24,.35)" : undefined }}>
      {win && <div className="absolute right-2 top-2 z-10 rounded-md bg-[#f5c518] px-2 py-0.5 text-[10px] font-extrabold text-black">👑 GANADOR</div>}
      <div className="flex items-center justify-between">
        <div><div className="text-sm font-extrabold" style={{ color: m.tint }}>{m.label}</div><div className="text-[10px] uppercase tracking-widest text-white/40">{m.sub}</div></div>
        {row?.score != null && <div className="text-right"><div className="text-2xl font-extrabold tabular-nums" style={{ color: win ? "#f5c518" : "#fff" }}>{row.score}</div><div className="text-[8px] tracking-widest text-white/40">SCORE</div></div>}
      </div>
      {/* iso floor with agents */}
      <div className="relative mt-2 h-[150px] overflow-hidden rounded-xl border border-white/10" style={{ background: "linear-gradient(180deg,#0e1018,#0a0b11)" }}>
        <div className="absolute inset-0 iso-floor opacity-50" />
        {queen && (
          <button onClick={() => sel(queen.id)} className="absolute left-1/2 top-2 -translate-x-1/2" title={queen.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/sprites/agents/${queen.role}.png`} alt="" className="h-12 w-12 object-contain drop-shadow-[0_0_8px_rgba(245,197,24,.6)]" onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")} />
            <span className="absolute -left-1 -top-1 text-xs">👑</span>
          </button>
        )}
        <div className="absolute inset-x-2 bottom-2 grid grid-cols-6 gap-1">
          {others.map((a) => (
            <button key={a.id} onClick={() => sel(a.id)} title={a.name} className="ag-idle" style={{ animationDelay: `${(a.role.length % 6) * 0.2}s` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/sprites/agents/${a.role}.png`} alt="" className="h-8 w-8 object-contain hover:scale-110 transition-transform" onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")} />
            </button>
          ))}
        </div>
      </div>
      {/* the blueprint it designed */}
      {row?.metrics && (
        <div className="mt-2">
          <div className="flex gap-2 text-[10px] font-bold text-white/60">
            <span className="rounded bg-white/10 px-1.5 py-0.5">{row.metrics.tables} tablas</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5">{row.metrics.routes} rutas</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5">{row.metrics.pages} páginas</span>
          </div>
          {row.tables && <p className="mt-1 line-clamp-2 text-[10px] text-white/45">{row.tables.join(", ")}</p>}
          {row.notes && <p className="mt-1 line-clamp-2 text-[10px] italic text-white/40">“{row.notes}”</p>}
        </div>
      )}
    </div>
  )
}

export default function TournamentPage() {
  const [agents, setAgents] = useState<AgentLite[]>([])
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [msg, setMsg] = useState("")

  const load = useCallback(() => {
    fetch("/api/genetic/agents").then((r) => r.json()).then((d) => d.ok && setAgents(d.agents)).catch(() => {})
    fetch("/api/genetic/tournament").then((r) => r.json()).then((d) => d.ok && setTeams(d.teams || [])).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const run = async () => {
    setRunning(true); setMsg("Las 3 oficinas están diseñando en paralelo… (qwen local, ~6-8 min)")
    try {
      const d = await fetch("/api/genetic/tournament", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(DEMO) }).then((r) => r.json())
      if (d.ok) { setMsg(`El panel eligió Equipo ${d.winner}.`); load() } else setMsg("Error: " + (d.error || "?"))
    } catch { setMsg("Error de red.") } finally { setRunning(false) }
  }

  const byTeam = (t: string) => teams.find((x) => x.team === t)
  const winner = teams.find((t) => t.winner)?.team
  const decided = teams.length > 0

  return (
    <main className="min-h-screen bg-[#0a0911] px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Torneo genético · 3 equipos compiten</h1>
            <p className="mt-1 text-sm text-white/50">Cada equipo diseña con su filosofía. El panel de reinas/stakeholders elige el mejor. {decided ? "Último torneo:" : "Sin torneos aún."}</p>
          </div>
          <button onClick={run} disabled={running} className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-40" style={{ background: "#7c3aed" }}>{running ? "Corriendo…" : "Correr torneo"}</button>
        </div>
        {msg && <p className="mt-2 text-xs text-violet-300">{msg}</p>}

        {/* 3 competing offices */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          {(["A", "B", "C"] as TK[]).map((t) => (
            <IsoOffice key={t} tk={t} agents={agents.filter((a) => a.team === t)} row={byTeam(t)} sel={setSel} />
          ))}
        </div>

        {/* central decision room */}
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-violet/40 p-4" style={{ background: "linear-gradient(180deg,rgba(124,58,237,.14),rgba(124,58,237,.04))" }}>
          <div className="absolute inset-0 iso-floor opacity-40" />
          <div className="relative flex items-center justify-between">
            <div className="text-xs font-extrabold tracking-widest text-violet-200">🏛️ SALA DE DECISIÓN · las 3 reinas + stakeholders</div>
            {decided && winner && <div className="text-xs font-bold text-[#f5c518]">Veredicto: gana {META[winner as TK].label}</div>}
          </div>
          <div className="relative mt-3 flex items-end justify-center gap-8">
            {(["A", "B", "C"] as TK[]).map((t) => {
              const q = agents.find((a) => a.team === t && a.queen)
              const w = byTeam(t)?.winner
              return (
                <div key={t} className="flex flex-col items-center">
                  {q && (
                    <button onClick={() => setSel(q.id)} className={w ? "scale-125" : "opacity-80"} title={`Reina ${META[t].label}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/sprites/agents/${q.role}.png`} alt="" className="h-14 w-14 object-contain" style={{ filter: w ? "drop-shadow(0 0 12px #f5c518)" : undefined }} onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")} />
                    </button>
                  )}
                  <span className="text-[10px] font-bold" style={{ color: w ? "#f5c518" : META[t].tint }}>{w ? "👑 " : ""}{META[t].label.replace("Equipo ", "")}</span>
                  {byTeam(t)?.score != null && <span className="text-[10px] tabular-nums text-white/50">{byTeam(t)!.score}</span>}
                </div>
              )
            })}
          </div>
          {decided && winner && <Confetti />}
        </div>
        <p className="mt-3 text-center text-[11px] text-white/35">Click en cualquier agente o reina → su ficha RPG. Iteración 1 (divergencia). Próximo: optimización cruzada + convergencia con los perdedores como QA.</p>
      </div>

      {sel && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setSel(null)}>
          <div onClick={(e) => e.stopPropagation()}><RpgCard id={sel} onClose={() => setSel(null)} /></div>
        </div>
      )}
    </main>
  )
}

function Confetti() {
  const C = ["#f5c518", "#22c55e", "#38bdf8", "#f43f5e", "#a855f7", "#fff"]
  return <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {Array.from({ length: 26 }).map((_, i) => (
      <span key={i} className="absolute h-2 w-1.5 rounded-[1px]" style={{ left: `${(i * 67) % 100}%`, top: "-20px", background: C[i % C.length], animation: `confetti-fall ${2 + (i % 5) * 0.4}s linear ${(i % 10) * 0.2}s infinite` }} />
    ))}
  </div>
}
