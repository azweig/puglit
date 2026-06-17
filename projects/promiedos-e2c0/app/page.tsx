"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  status: string;
}

export default function HomePage() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLiveMatches = async () => {
      try {
        const response = await fetch("/api/live-matches");
        if (!response.ok) throw new Error("Error fetching matches");
        const data: Match[] = await response.json();
        setLiveMatches(data);
      } catch (err) {
        setError("Failed to load live matches");
      } finally {
        setLoading(false);
      }
    };

    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF]">
      <nav className="bg-[#C70039] p-4 fixed top-0 w-full flex justify-around">
        <Link href="/">Fútbol Argentino en Vivo</Link>
        <Link href="/tournaments">Torneos</Link>
      </nav>
      <main className="pt-16 p-4">
        <h1 className="text-3xl font-bold mb-4">Fútbol Argentino en Vivo</h1>
        {loading ? (
          <p className="text-center">Cargando partidos en vivo...</p>
        ) : error ? (
          <p className="text-center text-[#FFC300]">{error}</p>
        ) : liveMatches.length === 0 ? (
          <p className="text-center">No hay partidos en vivo actualmente.</p>
        ) : (
          <ul className="space-y-4">
            {liveMatches.map((match) => (
              <li key={match.id} className="bg-[#C70039] p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold">{match.homeTeam} vs {match.awayTeam}</h2>
                    <p className="text-sm">Estado: {match.status}</p>
                  </div>
                  <div className="text-2xl font-bold">{match.score}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}