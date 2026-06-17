"use client";

import { useEffect, useState } from "react";

interface Scorer {
  player_name: string;
  goals: number;
  team_name: string;
  image_url?: string;
}

export default function Scorers() {
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScorers = async () => {
      try {
        const res = await fetch("/api/scorers?tournament_id=1");
        if (!res.ok) throw new Error("Failed to fetch scorers");
        const data = await res.json();
        setScorers(data.scorers ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchScorers();
  }, []);

  if (loading) return <div className="p-4">Cargando goleadores...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Goleadores</h1>
      <ul className="space-y-4">
        {scorers.map((scorer) => (
          <li
            key={scorer.player_name}
            className="bg-[#F0F0F0] text-[#000000] p-4 rounded-lg shadow-md flex items-center"
          >
            <img
              src={scorer.image_url ?? "/placeholder.png"}
              alt={scorer.player_name}
              className="w-16 h-16 rounded-full mr-4"
            />
            <div>
              <p className="font-bold text-lg">{scorer.player_name}</p>
              <p className="text-sm text-[#808080]">{scorer.team_name}</p>
              <p className="text-sm">Goles: {scorer.goals}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
