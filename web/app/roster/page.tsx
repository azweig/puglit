"use client"
/**
 * /roster — the 75-agent genetic roster as 3 competing teams (offices). Click any agent to
 * open its RPG character sheet. This is the data view behind the 3-office visual (F4).
 */
import { useEffect, useState } from "react"
import { RpgCard } from "@/components/RpgCard"
import { spriteFor } from "@/lib/sprite-alias"

interface A { id: string; team: string; role: string; name: string; queen: boolean; level: number; quality: number; temperature: number }
const TEAM = {
  A: { tint: "#22c55e", label: "Equipo Lean", sub: "Pragmático · MVP-first" },
  B: { tint: "#38bdf8", label: "Equipo Enterprise", sub: "Domain-Driven · por capas" },
  C: { tint: "#f43f5e", label: "Equipo Hacker", sub: "Performance · ingenio" },
} as const

export default function RosterPage() {
  const [agents, setAgents] = useState<A[]>([])
  const [sel, setSel] = useState<string | null>(null)
  useEffect(() => { fetch("/api/genetic/agents").then((r) => r.json()).then((d) => d.ok && setAgents(d.agents)).catch(() => {}) }, [])
  // deep-link a card: /roster?agent=A:backend-engineer
  useEffect(() => { const a = new URLSearchParams(window.location.search).get("agent"); if (a) setSel(a) }, [])

  return (
    <main className="min-h-screen bg-[#0a0911] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-extrabold">Roster genético · 75 agentes</h1>
        <p className="mt-1 text-sm text-white/50">3 equipos compiten con filosofías distintas. Click en un agente para ver su ficha RPG (nivel, stats que manejan su temperatura, proyectos y reputación).</p>
        {agents.length === 0 && <p className="mt-8 text-white/40">No hay roster — corré <code className="rounded bg-white/10 px-1">POST /api/genetic/seed</code>.</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {(["A", "B", "C"] as const).map((t) => {
            const team = agents.filter((a) => a.team === t)
            return (
              <div key={t} className="rounded-2xl border p-3" style={{ borderColor: TEAM[t].tint + "55", background: TEAM[t].tint + "0c" }}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-extrabold" style={{ color: TEAM[t].tint }}>{TEAM[t].label}</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40">{TEAM[t].sub}</div>
                  </div>
                  <span className="text-[10px] text-white/40">{team.length} agentes</span>
                </div>
                <div className="space-y-1">
                  {team.map((a) => (
                    <button key={a.id} onClick={() => setSel(a.id)}
                      className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-left transition-colors hover:border-white/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/sprites/agents/${spriteFor(a.role)}.png`} alt="" className="h-7 w-7 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden" }} />
                      <span className="flex-1 truncate text-xs font-semibold">{a.queen ? "👑 " : ""}{a.name.replace(/ · .*/, "")}</span>
                      <span className="text-[9px] text-white/35">L{a.level}</span>
                      <span className="rounded bg-white/10 px-1 text-[9px] tabular-nums text-white/55">t{a.temperature.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {sel && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setSel(null)}>
          <div onClick={(e) => e.stopPropagation()}><RpgCard id={sel} onClose={() => setSel(null)} /></div>
        </div>
      )}
    </main>
  )
}
