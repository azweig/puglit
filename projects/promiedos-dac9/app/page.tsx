"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Goal { player: string | null; minute: number | null; team: string | null }
interface Match {
  id: number;
  tournament_id: number;
  date: string;
  team_home: string;
  team_away: string;
  score_home: number;
  score_away: number;
  status: string;
  minute: number | null;
  tournament_name: string;
  country: string;
  flag: string;
  goals: Goal[];
}

const BRAND = "#FF5733";

function statusLabel(m: Match) {
  if (m.status === "live") return m.minute != null ? `${m.minute}'` : "EN VIVO";
  if (m.status === "finished") return "Final";
  return new Date(m.date).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

function scorerLine(goals: Goal[], team: string) {
  return goals.filter((g) => g.team === team && g.player).map((g) => `${g.minute}' ${g.player!.split(" ").slice(-1)[0]}`).join(" · ");
}

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<string>("Todos");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/live-matches");
        const data = await res.json();
        if (!alive) return;
        setMatches(Array.isArray(data) ? data : data.items ?? []);
        setError(null);
      } catch {
        if (alive) setError("No pudimos cargar los partidos.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 2500);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const countries = useMemo(() => {
    const map = new Map<string, string>();
    matches.forEach((m) => map.set(m.country, m.flag));
    return Array.from(map.entries());
  }, [matches]);

  const shown = country === "Todos" ? matches : matches.filter((m) => m.country === country);
  const liveCount = matches.filter((m) => m.status === "live").length;

  // group shown matches by tournament
  const groups = useMemo(() => {
    const g = new Map<string, Match[]>();
    shown.forEach((m) => {
      const key = `${m.flag}  ${m.tournament_name} · ${m.country}`;
      (g.get(key) ?? g.set(key, []).get(key)!).push(m);
    });
    return Array.from(g.entries());
  }, [shown]);

  return (
    <div className="min-h-screen bg-[#0f1419] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0f1419]/95 backdrop-blur">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: BRAND }}>⚽</span>
            Promiedos
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/" className="text-white">Partidos</Link>
            <Link href="/tournaments" className="text-slate-400 hover:text-white transition-colors">Torneos</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">Resultados en vivo</h1>
          {liveCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />{liveCount} en vivo
            </span>
          )}
        </div>

        {/* country tabs */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {[["Todos", "🌎"] as [string, string], ...countries].map(([c, f]) => (
            <button
              key={c}
              onClick={() => setCountry(c)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                country === c ? "text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
              style={country === c ? { background: BRAND } : undefined}
            >
              <span className="mr-1">{f}</span>{c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>
        ) : shown.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
            <div className="text-4xl">📅</div>
            <p className="mt-3 font-semibold">No hay partidos para mostrar</p>
            <p className="text-sm text-slate-400">Probá con otro país o volvé más tarde.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(([league, ms]) => (
              <section key={league}>
                <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-slate-400">{league}</h2>
                <ul className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  {ms.map((m) => {
                    const live = m.status === "live";
                    return (
                      <li key={m.id} className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.04] transition-colors">
                        <div className="w-16 shrink-0 text-center">
                          <span className={`text-xs font-bold ${live ? "text-emerald-400" : "text-slate-400"}`}>
                            {live && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 align-middle" />}
                            {statusLabel(m)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate font-semibold">{m.team_home}</span>
                            <span className={`shrink-0 tabular-nums font-extrabold ${live ? "text-emerald-400" : "text-white"}`}>{m.score_home}</span>
                          </div>
                          {scorerLine(m.goals || [], m.team_home) && (
                            <p className="mt-0.5 truncate text-[11px] text-slate-400">⚽ {scorerLine(m.goals, m.team_home)}</p>
                          )}
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <span className="truncate font-semibold">{m.team_away}</span>
                            <span className={`shrink-0 tabular-nums font-extrabold ${live ? "text-emerald-400" : "text-white"}`}>{m.score_away}</span>
                          </div>
                          {scorerLine(m.goals || [], m.team_away) && (
                            <p className="mt-0.5 truncate text-[11px] text-slate-400">⚽ {scorerLine(m.goals, m.team_away)}</p>
                          )}
                        </div>
                        <Link href={`/match/${m.id}`} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition-colors">›</Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
