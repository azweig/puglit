"use client";

import { useState, useEffect } from "react";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  score: string | null;
  status: string;
}

interface LiveMatchesResponse {
  matches: Match[];
}

export default function LiveMatchesPage() {
  const [data, setData] = useState<LiveMatchesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/v1/live-matches");
        if (!response.ok) throw new Error("Error fetching matches");
        const data: LiveMatchesResponse = await response.json();
        setData(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 2500);

    return () => clearInterval(intervalId);
  }, []);

  if (error) return <div className="text-[#C70039]">Error: {error}</div>;
  if (!data) return <div className="text-[#FFFFFF]">Cargando...</div>;

  return (
    <div className="p-4 bg-[#581845] min-h-screen">
      <h1 className="text-3xl font-bold text-[#FFFFFF] mb-4">Partidos en Vivo</h1>
      <div className="grid grid-cols-1 gap-4">
        {data.matches.length === 0 ? (
          <div className="text-[#FFFFFF]">No hay partidos en vivo en este momento.</div>
        ) : (
          data.matches.map((match) => (
            <div
              key={match.id}
              className="rounded-3xl shadow-lg bg-[#DAF7A6] p-4 flex justify-between items-center"
            >
              <div className="text-[#581845]">
                <span className="font-bold">{match.home_team}</span> vs <span className="font-bold">{match.away_team}</span>
              </div>
              <div className="text-[#900C3F]">
                {match.score ?? "Pendiente"}
              </div>
              {match.status === "live" && (
                <span className="bg-[#FF5733] text-[#FFFFFF] font-medium py-1 px-3 rounded-full">En Vivo</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
