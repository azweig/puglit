"use client";

import { useEffect, useState } from "react";

interface Scorer {
  player_name: string;
  team_name: string;
  goals: number;
}

export default function Goleadores() {
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScorers = async () => {
      try {
        const response = await fetch("/api/live-football");
        if (!response.ok) {
          throw new Error("Failed to fetch scorers");
        }
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.scorers ?? [];
        setScorers(list);
      } catch (err: any) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchScorers();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="sticky top-0 bg-[#FF6347] text-[#FFFFFF] p-4">
        <nav className="flex justify-around">
          <a href="/" className="font-bold text-xl">Inicio</a>
          <a href="/matches" className="font-bold text-xl">Partidos</a>
          <a href="/standings" className="font-bold text-xl">Posiciones</a>
          <a href="/scorers" className="font-bold text-xl">Goleadores</a>
        </nav>
      </div>
      <div className="p-4">
        <h1 className="font-bold text-2xl mb-4">Goleadores</h1>
        {loading && <p className="text-lg">Cargando...</p>}
        {error && <p className="text-lg text-red-500">Error: {error}</p>}
        {!loading && !error && (
          <ul className="space-y-4">
            {scorers.map((scorer, index) => (
              <li key={index} className="bg-[#FF6347] shadow-md rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="text-[#FFD700] font-semibold">
                    {scorer.player_name}
                  </div>
                  <div className="text-[#000000]">
                    {scorer.team_name}
                  </div>
                  <div className="bg-[#FFD700] text-[#000000] rounded-full px-3 py-1 text-sm">
                    {scorer.goals} Goles
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
