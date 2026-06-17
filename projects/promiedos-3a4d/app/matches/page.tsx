"use client";

import { useEffect, useState } from "react";

interface Match {
  id: number;
  date_time: string;
  team_home: string;
  team_away: string;
  score_home: number | null;
  score_away: number | null;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch("/api/live-football");
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.items ?? data.rows ?? [];
        setMatches(list);
      } catch (err: any) {
        setError("Failed to load matches. Please try again later.");
      }
    };

    fetchMatches();
    const intervalId = setInterval(fetchMatches, 2500);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-[#FFFFFF] min-h-screen">
      <header className="sticky top-0 bg-[#FF6347] text-[#FFD700] font-bold text-2xl p-4 shadow-md">
        Partidos del Día
      </header>
      <main className="p-4">
        {error && <div className="text-red-500">{error}</div>}
        {matches.length === 0 && !error && (
          <div className="text-center text-lg text-[#808080]">No matches available today.</div>
        )}
        <ul className="space-y-4">
          {matches.map((match) => (
            <li key={match.id} className="bg-[#FF6347] shadow-md rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div className="text-[#000000] font-bold text-xl">
                  {match.team_home} vs {match.team_away}
                </div>
                <div className="bg-[#FFD700] text-[#000000] rounded-full px-3 py-1 text-sm">
                  {match.score_home ?? "-"} : {match.score_away ?? "-"}
                </div>
              </div>
              <div className="text-[#808080] text-lg">
                {new Date(match.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
