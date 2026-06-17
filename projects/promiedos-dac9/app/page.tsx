"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Match {
  id: number;
  date: string;
  team_home: string;
  team_away: string;
  score_home: number;
  score_away: number;
}

export default function HomePage() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLiveMatches = async () => {
      try {
        const response = await fetch("/api/live-matches");
        const data = await response.json();
        const matches = Array.isArray(data) ? data : data.items ?? [];
        setLiveMatches(matches);
      } catch (err: any) {
        setError("Failed to load live matches.");
      } finally {
        setLoading(false);
      }
    };

    fetchLiveMatches();
    const intervalId = setInterval(fetchLiveMatches, 2500);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF]">
      <header className="sticky top-0 bg-[#FFC300] p-4 shadow-md">
        <nav className="flex space-x-4">
          <Link href="/" className="text-[#900C3F] font-bold">Inicio</Link>
          <Link href="/tournaments" className="text-[#900C3F] font-bold">Torneos</Link>
        </nav>
      </header>

      <main className="p-4">
        <h1 className="text-3xl font-bold mb-4">Fútbol Argentino en Vivo</h1>

        {loading ? (
          <p className="italic">Cargando partidos en vivo...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : liveMatches.length === 0 ? (
          <p className="italic">No hay partidos en vivo en este momento.</p>
        ) : (
          <ul className="space-y-4">
            {liveMatches.map((match) => (
              <li key={match.id} className="bg-[#FFC300] p-4 shadow-md rounded-lg transition-transform transform hover:scale-105">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold">{match.team_home} vs {match.team_away}</p>
                    <p className="italic">{new Date(match.date).toLocaleString()}</p>
                  </div>
                  <div className="bg-[#DAF7A6] text-[#581845] py-1 px-3 rounded-full">
                    {match.score_home} - {match.score_away}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
