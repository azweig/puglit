"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Ev { minute: number | null; extra: number | null; team_name: string; player_name: string; assist_name: string | null; type: string; detail: string }
interface Pl { team_name: string; formation: string; player_name: string; number: number | null; pos: string | null; grid: string | null; is_starter: boolean }
interface St { team_name: string; stat_type: string; stat_value: string }
interface Match { id: number; team_home: string; team_away: string; score_home: number; score_away: number; status: string; minute: number | null; tournament_name: string; country: string; flag: string; venue: string | null; referee: string | null; date: string }
const BRAND = "#FF5733";

function evIcon(e: Ev) {
  if (e.type === "Goal") return "⚽";
  if (e.type === "Card") return /Red/.test(e.detail) ? "🟥" : "🟨";
  if (e.type === "subst") return "🔁";
  if (e.type === "Var") return "📺";
  return "•";
}

export default function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [data, setData] = useState<{ match: Match; events: Ev[]; lineups: Pl[]; stats: St[] } | null>(null);
  const [tab, setTab] = useState<"resumen" | "alineacion">("resumen");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    let alive = true;
    const load = () => fetch(`/api/match/${matchId}`).then((r) => r.json()).then((d) => { if (alive && !d.error) setData(d); }).catch(() => {}).finally(() => { if (alive) setLoading(false); });
    load();
    const id = setInterval(load, 5000);
    return () => { alive = false; clearInterval(id); };
  }, [matchId]);

  const m = data?.match;
  const live = m?.status === "live";
  const teams = m ? [m.team_home, m.team_away] : [];
  const statByTeam = (team: string) => (data?.stats || []).filter((s) => s.team_name === team);
  const statTypes = Array.from(new Set((data?.stats || []).map((s) => s.stat_type)));
  const lineupByTeam = (team: string) => (data?.lineups || []).filter((l) => l.team_name === team);

  return (
    <div className="min-h-screen bg-[#0f1419] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0f1419]/95 backdrop-blur">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: BRAND }}>⚽</span>Promiedos
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">Partidos</Link>
            <Link href="/tournaments" className="text-slate-400 hover:text-white transition-colors">Torneos</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">
        {loading && !m ? (
          <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
        ) : !m ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">Partido no encontrado.</div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-400">{m.flag} {m.tournament_name} · {m.country}</p>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center font-bold">{m.team_home}</div>
                <div className="px-4 text-center">
                  <div className="text-3xl font-extrabold tabular-nums">{m.score_home} <span className="text-slate-500">-</span> {m.score_away}</div>
                  <div className={`mt-1 text-xs font-bold ${live ? "text-emerald-400" : "text-slate-400"}`}>
                    {live ? `${m.minute ?? ""}' EN VIVO` : m.status === "finished" ? "Finalizado" : new Date(m.date).toLocaleString("es")}
                  </div>
                </div>
                <div className="flex-1 text-center font-bold">{m.team_away}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 border-b border-white/10">
              {(["resumen", "alineacion"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${tab === t ? "text-white" : "text-slate-400 hover:text-white"}`} style={tab === t ? { borderBottom: `2px solid ${BRAND}` } : undefined}>
                  {t === "resumen" ? "Resumen" : "Alineación"}
                </button>
              ))}
            </div>

            {tab === "resumen" ? (
              <div className="mt-4 space-y-6">
                {/* minute by minute */}
                <section>
                  <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Minuto a minuto</h2>
                  {data!.events.length === 0 ? (
                    <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Sin eventos registrados.</p>
                  ) : (
                    <ul className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                      {data!.events.map((e, i) => {
                        const home = e.team_name === m.team_home;
                        return (
                          <li key={i} className={`flex items-center gap-3 border-b border-white/5 px-4 py-2.5 last:border-0 ${home ? "" : "flex-row-reverse text-right"}`}>
                            <span className="w-10 shrink-0 text-center text-xs font-bold text-slate-400">{e.minute}{e.extra ? `+${e.extra}` : ""}'</span>
                            <span className="text-base">{evIcon(e)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold">{e.player_name}</p>
                              {e.assist_name && <p className="truncate text-xs text-slate-400">{e.type === "subst" ? "sale " : "asist. "}{e.assist_name}</p>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                {/* stats */}
                {statTypes.length > 0 && (
                  <section>
                    <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Estadísticas</h2>
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      {statTypes.map((type) => {
                        const h = statByTeam(m.team_home).find((s) => s.stat_type === type)?.stat_value ?? "0";
                        const a = statByTeam(m.team_away).find((s) => s.stat_type === type)?.stat_value ?? "0";
                        const hn = parseFloat(String(h)) || 0, an = parseFloat(String(a)) || 0, tot = hn + an || 1;
                        return (
                          <div key={type}>
                            <div className="flex justify-between text-xs font-semibold"><span>{h}</span><span className="text-slate-400">{type}</span><span>{a}</span></div>
                            <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div style={{ width: `${(hn / tot) * 100}%`, background: BRAND }} />
                              <div style={{ width: `${(an / tot) * 100}%`, background: "#38bdf8" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {(m.venue || m.referee) && (
                  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                    {m.venue && <p className="flex justify-between"><span className="text-slate-400">Estadio</span><span className="font-semibold">{m.venue}</span></p>}
                    {m.referee && <p className="mt-2 flex justify-between"><span className="text-slate-400">Árbitro</span><span className="font-semibold">{m.referee}</span></p>}
                  </section>
                )}
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {teams.map((team) => {
                  const players = lineupByTeam(team);
                  const formation = players[0]?.formation;
                  return (
                    <section key={team} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-bold">{team}</h3>
                        {formation && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold">{formation}</span>}
                      </div>
                      {players.length === 0 ? (
                        <p className="text-sm text-slate-400">Sin alineación.</p>
                      ) : (
                        <ul className="space-y-1">
                          {players.map((p, i) => (
                            <li key={i} className={`flex items-center gap-2 text-sm ${p.is_starter ? "" : "text-slate-400"}`}>
                              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/10 text-xs font-bold">{p.number ?? "-"}</span>
                              <span className="flex-1 truncate">{p.player_name}</span>
                              {!p.is_starter && i === players.filter((x) => x.is_starter).length && <span className="text-[10px] uppercase text-slate-500">Suplentes</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
