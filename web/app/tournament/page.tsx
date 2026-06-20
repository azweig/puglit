"use client"
/**
 * /tournament — launch & watch the genetic tournament from the BROWSER (no terminal).
 * Fire a tournament (runs in the background on the server), poll its live phase, then see
 * the 3 teams' designs (model + philosophy + per-area jury scores), the winner, and which
 * agents levelled up. Run it again to watch the teams LEARN.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

const TEAM = {
  A: { tint: "#22c55e", label: "Equipo Lean", sub: "Pragmático · MVP-first" },
  B: { tint: "#38bdf8", label: "Equipo Enterprise", sub: "Domain-Driven · por capas" },
  C: { tint: "#f43f5e", label: "Equipo Hacker", sub: "Performance · ingenio" },
} as const
type TeamId = keyof typeof TEAM
interface Areas { data: number; dev: number; design: number; business: number; critique: string; overall: number }
interface Design { team: TeamId; philosophy: string; model: string; metrics: { tables: number; routes: number; pages: number }; summary: string; areas?: Areas }
interface Result { winner?: TeamId; leveledUp?: { id: string; level: number }[]; designs?: Design[]; error?: string }

const EXAMPLES = [
  { name: "DuelDeck", what: "juego de cartas coleccionables estilo Yu-Gi-Oh: construís mazos, duelás por turnos contra otros jugadores, cartas con ataque/defensa/atributo/tipo/nivel, torneos" },
  { name: "StatusGlass", what: "un status page para un SaaS: componentes con uptime, historial de incidentes, mantenimientos programados, suscripción a avisos" },
  { name: "Reseñas", what: "una app para descubrir y reseñar restaurantes cercanos con fotos, rating y filtros por tipo de cocina" },
]

export default function TournamentPage() {
  const [name, setName] = useState(EXAMPLES[0].name)
  const [what, setWhat] = useState(EXAMPLES[0].what)
  const [phase, setPhase] = useState("")
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [result, setResult] = useState<Result | null>(null)
  const poll = useRef<ReturnType<typeof setInterval> | null>(null)
  const [building, setBuilding] = useState(false)
  const router = useRouter()

  // iteration 3: build the winning team's design into a real app
  async function buildWinner() {
    setBuilding(true)
    try {
      const d = await fetch("/api/genetic/build", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), what: what.trim(), audience: "usuarios", monetization: "free" }) }).then((r) => r.json())
      if (d.ok && d.jobId) router.push(`/build/${d.jobId}`)
      else { setBuilding(false); alert(d.error || "no se pudo crear el build") }
    } catch { setBuilding(false) }
  }

  const loadLatest = useCallback(() => {
    fetch("/api/genetic/tournament").then((r) => r.json()).then((d) => {
      if (d.ok && d.teams?.length) {
        const designs: Design[] = d.teams.map((t: any) => ({ team: t.team, philosophy: "", model: t.model || "", metrics: t.metrics || {}, summary: t.summary || "", areas: t.areas }))
        const winner = d.teams.find((t: any) => t.winner)?.team
        setResult({ winner, designs }); setStatus((s) => (s === "running" ? s : "done"))
      }
    }).catch(() => {})
  }, [])
  useEffect(() => { loadLatest() }, [loadLatest])

  function launch() {
    setStatus("running"); setResult(null); setPhase("Arrancando…")
    fetch("/api/genetic/tournament", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), what: what.trim(), audience: "usuarios", monetization: "free" }) })
      .then((r) => r.json()).then((d) => {
        if (!d.ok || !d.jobId) { setStatus("error"); setPhase(d.error || "no arrancó"); return }
        poll.current && clearInterval(poll.current)
        poll.current = setInterval(() => {
          fetch(`/api/genetic/tournament?status=${d.jobId}`).then((r) => r.json()).then((s) => {
            if (s.phase) setPhase(s.phase)
            if (s.status === "done") { clearInterval(poll.current!); setStatus("done"); setResult(s.result || null) }
            else if (s.status === "error") { clearInterval(poll.current!); setStatus("error"); setPhase(s.error || "error") }
          }).catch(() => {})
        }, 2000)
      }).catch(() => { setStatus("error"); setPhase("network error") })
  }
  useEffect(() => () => { poll.current && clearInterval(poll.current) }, [])

  const designs = (result?.designs || []).slice().sort((a, b) => (b.areas?.overall || 0) - (a.areas?.overall || 0))

  return (
    <main className="min-h-screen bg-[#070a12] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-extrabold">🧬 Torneo genético</h1>
        <p className="mb-5 mt-1 text-sm text-white/50">Los 3 equipos diseñan el mismo producto, cada uno con su modelo (Qwen / DeepSeek / Devstral) y su filosofía. El Gran Jurado puntúa por área y elige ganador. Corré de nuevo y van aprendiendo.</p>

        <div className="rounded-2xl border border-white/10 bg-ink2 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {EXAMPLES.map((e) => <button key={e.name} onClick={() => { setName(e.name); setWhat(e.what) }} className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/70 hover:border-violet/60">{e.name}</button>)}
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del producto" className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
          <textarea value={what} onChange={(e) => setWhat(e.target.value)} rows={2} placeholder="Qué es / qué hace" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
          <button onClick={launch} disabled={status === "running" || !name.trim()} className="mt-3 rounded-xl px-5 py-2.5 font-bold text-white disabled:opacity-40" style={{ background: "var(--violet)" }}>
            {status === "running" ? "Corriendo…" : "🧬 Lanzar torneo"}
          </button>
          <a href="/campus" className="ml-3 text-xs text-white/50 underline">ver el campus →</a>
        </div>

        {status === "running" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-violet/40 bg-violet/10 px-4 py-3">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span className="text-sm font-semibold">{phase}</span>
            <span className="ml-auto text-[11px] text-white/40">corre en el server — podés cerrar esta pestaña</span>
          </div>
        )}
        {status === "error" && <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">Error: {phase}</div>}

        {result && designs.length > 0 && (
          <div className="mt-6">
            {result.leveledUp && result.leveledUp.length > 0 && (
              <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">⬆️ Subieron de nivel: {result.leveledUp.map((l) => `${l.id} (N${l.level})`).join(" · ")}</div>
            )}
            {result.winner && status === "done" && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3">
                <span className="text-sm text-white/80">Ganó <b style={{ color: TEAM[result.winner].tint }}>{TEAM[result.winner].label}</b>. Que construya su diseño:</span>
                <button onClick={buildWinner} disabled={building} className="ml-auto rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black disabled:opacity-50">{building ? "creando build…" : "🔨 Construir el ganador →"}</button>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              {designs.map((d) => {
                const t = TEAM[d.team]; const win = d.team === result.winner
                return (
                  <div key={d.team} className="rounded-2xl border p-4" style={{ borderColor: win ? "#fbbf24" : t.tint + "55", background: t.tint + "0c", boxShadow: win ? "0 0 24px rgba(251,191,36,.25)" : undefined }}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-extrabold" style={{ color: t.tint }}>{t.label}</div>
                      {win && <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-extrabold text-black">👑 GANA</span>}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-white/45">{d.model || "—"}</div>
                    {d.areas && (
                      <div className="mt-2 space-y-1">
                        {([["data", "Datos"], ["dev", "Dev"], ["design", "Diseño"], ["business", "Negocio"]] as const).map(([k, lbl]) => (
                          <div key={k} className="flex items-center gap-2 text-[11px]">
                            <span className="w-12 text-white/45">{lbl}</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${d.areas![k]}%`, background: t.tint }} /></div>
                            <span className="w-6 text-right tabular-nums text-white/70">{d.areas![k]}</span>
                          </div>
                        ))}
                        <div className="pt-1 text-right text-xs font-bold" style={{ color: t.tint }}>overall {d.areas.overall}</div>
                      </div>
                    )}
                    <div className="mt-2 flex gap-3 text-[10px] text-white/45">
                      <span>{d.metrics?.tables ?? "—"} tablas</span><span>{d.metrics?.routes ?? "—"} rutas</span><span>{d.metrics?.pages ?? "—"} pages</span>
                    </div>
                    {d.areas?.critique && <p className="mt-2 text-[11px] italic text-white/50 line-clamp-3">“{d.areas.critique}”</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
