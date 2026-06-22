/** #18 — Brain dashboard: what the swarm has learned (server-rendered from the DB, no build polling). */
import { brainDigest } from "@/lib/brain-insights"

export const dynamic = "force-dynamic"

export default async function BrainPage() {
  const d = await brainDigest().catch(() => null)
  if (!d) return <main className="max-w-3xl mx-auto px-5 py-16 text-white/60">No hay datos del cerebro todavía (¿DB conectada?).</main>
  const Stat = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
    <div className="rounded-2xl border border-white/10 bg-ink2 p-4">
      <div className="text-2xl font-extrabold text-violet-bright">{value}</div>
      <div className="text-xs text-white/50 mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-white/30 mt-0.5">{sub}</div>}
    </div>
  )
  return (
    <main className="max-w-4xl mx-auto px-5 py-12">
      <h1 className="text-2xl font-extrabold mb-1">🧠 Cerebro de Puglit</h1>
      <p className="text-sm text-white/50 mb-6">Lo que el enjambre aprendió, en vivo.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Builds" value={d.builds} />
        <Stat label="Clean rate" value={`${d.cleanRate}%`} sub="builds sin issues high" />
        <Stat label="Módulos" value={d.modules} sub="genoma" />
        <Stat label="Skills activos" value={d.skills.length} sub="SkillOpt" />
      </div>

      <section className="grid sm:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-bold text-white/70 mb-2">Skills evolucionados</h2>
          <div className="rounded-2xl border border-white/10 bg-ink2 p-3 text-sm">
            {d.skills.length ? d.skills.map((s) => <div key={s.area} className="flex justify-between py-1 border-b border-white/5 last:border-0"><span>{s.area} <span className="text-white/40">v{s.version}</span></span><span className="text-violet-bright font-semibold">{s.score}</span></div>) : <span className="text-white/40">aún en el seed (sin evolución validada)</span>}
          </div>
          <h2 className="text-sm font-bold text-white/70 mt-5 mb-2">Top issues (anti-patrones)</h2>
          <div className="rounded-2xl border border-white/10 bg-ink2 p-3 text-sm">
            {d.topIssues.length ? d.topIssues.map((i) => <div key={i.kind} className="flex justify-between py-1 border-b border-white/5 last:border-0"><span>{i.kind}</span><span className="text-amber-400 font-semibold">{i.n}</span></div>) : <span className="text-white/40">sin issues registrados ✓</span>}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white/70 mb-2">Agentes top (XP)</h2>
          <div className="rounded-2xl border border-white/10 bg-ink2 p-3 text-sm">
            {d.agents.map((a) => <div key={a.id} className="flex justify-between py-1 border-b border-white/5 last:border-0"><span className="truncate">{a.id}</span><span className="text-white/50">lvl {a.level} · {a.xp}xp</span></div>)}
          </div>
          <h2 className="text-sm font-bold text-white/70 mt-5 mb-2">Métricas</h2>
          <div className="rounded-2xl border border-white/10 bg-ink2 p-3 text-sm">
            {d.metrics.map((m) => <div key={m.name} className="flex justify-between py-1 border-b border-white/5 last:border-0"><span>{m.name}</span><span className="text-white/50">n={m.n} · μ={m.avg}</span></div>)}
          </div>
        </div>
      </section>
    </main>
  )
}
