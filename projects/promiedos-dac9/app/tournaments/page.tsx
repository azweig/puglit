"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Tournament { id: number; name: string; country: string; flag: string; season: string; current_round: number; }
const BRAND = "#FF5733";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((d) => setTournaments(Array.isArray(d) ? d : d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byCountry = useMemo(() => {
    const g = new Map<string, Tournament[]>();
    tournaments.forEach((t) => (g.get(t.country) ?? g.set(t.country, []).get(t.country)!).push(t));
    return Array.from(g.entries());
  }, [tournaments]);

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
            <Link href="/tournaments" className="text-white">Torneos</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5">
        <h1 className="mb-5 text-2xl font-extrabold tracking-tight">Torneos</h1>
        {loading ? (
          <div className="space-y-3">{[0,1,2].map((i)=><div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />)}</div>
        ) : (
          <div className="space-y-6">
            {byCountry.map(([country, ts]) => (
              <section key={country}>
                <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-slate-400">{ts[0]?.flag} {country}</h2>
                <ul className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  {ts.map((t) => (
                    <li key={t.id}>
                      <Link href={`/standings/${t.id}`} className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.05] transition-colors">
                        <div>
                          <p className="font-semibold">{t.name}</p>
                          <p className="text-xs text-slate-400">Temporada {t.season} · Fecha {t.current_round}</p>
                        </div>
                        <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">Tabla ›</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
