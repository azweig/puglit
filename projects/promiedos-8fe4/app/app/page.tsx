"use client";
import { useEffect, useState } from "react";

interface Match {
  id: string;
  team_home: string;
  team_away: string;
  score_home: number;
  score_away: number;
  time_slot: string;
}

export default function LiveMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("/api/live-matches");
        if (!res.ok) throw new Error("Failed to fetch matches");
        const data = await res.json();
        setMatches(data.matches ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };
    fetchMatches();
    const interval = setInterval(fetchMatches, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#FFFFFF] min-h-screen">
      <nav className="sticky top-0 bg-[#F0F0F0] p-4 shadow-md">
        <ul className="flex space-x-4">
          <li><a href="/app" className="text-[#000000] hover:text-[#1E90FF]">Partidos en Vivo</a></li>
          <li><a href="/app/tournaments" className="text-[#000000] hover:text-[#1E90FF]">Torneos</a></li>
          <li><a href="/app/standings" className="text-[#000000] hover:text-[#1E90FF]">Tabla de Posiciones</a></li>
          <li><a href="/app/scorers" className="text-[#000000] hover:text-[#1E90FF]">Goleadores</a></li>
        </ul>
      </nav>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-[#000000] mb-4">Partidos en Vivo</h1>
        {error ? (
          <p className="text-[#FF4500]">{error}</p>
        ) : matches.length === 0 ? (
          <p className="text-[#808080]">No hay partidos en vivo en este momento.</p>
        ) : (
          <ul className="space-y-4">
            {matches.map((match) => (
              <li
                key={match.id}
                className="bg-[#F0F0F0] text-[#000000] p-4 rounded-lg shadow-md"
              >
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold">
                    {match.team_home} vs {match.team_away}
                  </div>
                  <div className="text-xl font-bold">
                    {match.score_home}:{match.score_away}
                  </div>
                </div>
                <div className="text-[#808080] mt-2">
                  {match.time_slot ?? "Hora no especificada"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
