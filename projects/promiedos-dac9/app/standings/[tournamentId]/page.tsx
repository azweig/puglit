"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Standing { id: number; team_name: string; points: number; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; goal_diff: number; }
interface Scorer { id: number; player_name: string; team_name: string; goals: number; }
const BRAND = "#FF5733";

export default function Standings() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) return;
    Promise.all([
      fetch(`/api/standings?tournament_id=${tournamentId}`).then((r) => r.json()),
      fetch(`/api/goal-scorers?tournament_id=${tournamentId}`).then((r) => r.json()),
    ])
      .then(([s, g]) => {
        setStandings(Array.isArray(s) ? s : s.items ?? []);
        setScorers(Array.isArray(g) ? g : g.items ?? []);
      })
      .catch(() => setError("No pudimos cargar la tabla."))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  return (
    <div className="min-h-screen bg-[#0f1419] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0f1419]/95 backdrop-blur">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: BRAND }}>⚽</span>
            Promiedos
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">Partidos</Link>
            <Link href="/tournaments" className="text-slate-400 hover:text-white transition-colors">Torneos</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5">
        <Link href="/tournaments" className="mb-4 inline-block text-sm font-semibold text-slate-400 hover:text-white">‹ Torneos</Link>
        <h1 className="mb-4 text-2xl font-extrabold tracking-tight">Tabla de posiciones</h1>

        {loading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>
        ) : standings.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-slate-400">Sin datos de la tabla.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="w-full text-sm">
              <thead className="text-slate-400">
                <tr className="border-b border-white/10 text-xs uppercase">
                  <th className="px-3 py-2.5 text-left font-bold">#</th>
                  <th className="px-3 py-2.5 text-left font-bold">Equipo</th>
                  <th className="px-2 py-2.5 text-center font-bold">PJ</th>
                  <th className="px-2 py-2.5 text-center font-bold">G</th>
                  <th className="px-2 py-2.5 text-center font-bold">E</th>
                  <th className="px-2 py-2.5 text-center font-bold">P</th>
                  <th className="px-2 py-2.5 text-center font-bold">DG</th>
                  <th className="px-3 py-2.5 text-center font-extrabold text-white">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors">
                    <td className="px-3 py-2.5 text-slate-400">
                      <span className="inline-grid h-6 w-6 place-items-center rounded-md text-xs font-bold" style={i < 4 ? { background: BRAND, color: "#fff" } : { background: "rgba(255,255,255,0.06)" }}>{i + 1}</span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold">{s.team_name}</td>
                    <td className="px-2 py-2.5 text-center text-slate-300">{s.played}</td>
                    <td className="px-2 py-2.5 text-center text-slate-300">{s.won}</td>
                    <td className="px-2 py-2.5 text-center text-slate-300">{s.drawn}</td>
                    <td className="px-2 py-2.5 text-center text-slate-300">{s.lost}</td>
                    <td className="px-2 py-2.5 text-center text-slate-300">{(s.goal_diff ?? 0) > 0 ? `+${s.goal_diff}` : s.goal_diff}</td>
                    <td className="px-3 py-2.5 text-center font-extrabold text-white">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {scorers.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold tracking-tight">⚽ Goleadores</h2>
            <ul className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              {scorers.map((sc, i) => (
                <li key={sc.id} className="flex items-center gap-3 border-b border-white/5 px-4 py-2.5 last:border-0">
                  <span className="w-5 text-center text-sm font-bold text-slate-400">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{sc.player_name}</p>
                    <p className="text-xs text-slate-400">{sc.team_name}</p>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-sm font-extrabold text-white" style={{ background: BRAND }}>{sc.goals}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
