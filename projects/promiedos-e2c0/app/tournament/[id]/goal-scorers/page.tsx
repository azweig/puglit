"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface GoalScorer {
  player_name: string;
  goals: number;
  team_name: string;
}

export default function GoalScorersPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const [goalScorers, setGoalScorers] = useState<GoalScorer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoalScorers = async () => {
      try {
        const response = await fetch(`/api/goal-scorers?tournamentId=${tournamentId}`);
        if (!response.ok) throw new Error("Failed to fetch goal scorers");
        const data = await response.json();
        setGoalScorers(data?.goal_scorers ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGoalScorers();
  }, [tournamentId]);

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF]">
      <nav className="fixed top-0 w-full bg-[#C70039] p-4 shadow-md flex justify-center space-x-4">
        <Link href="/" className="text-[#FFFFFF] font-bold">Inicio</Link>
        <Link href="/tournaments" className="text-[#FFFFFF] font-bold">Torneos</Link>
      </nav>

      <main className="pt-20 px-4">
        <h1 className="text-2xl font-bold mb-4">Goleadores</h1>

        {loading ? (
          <p className="text-[#FFC300]">Cargando...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : goalScorers.length === 0 ? (
          <p className="text-[#FFC300]">No hay goleadores disponibles.</p>
        ) : (
          <ul className="space-y-4">
            {goalScorers.map((scorer, index) => (
              <li key={index} className="bg-[#C70039] p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">{scorer.player_name ?? "Sin nombre"}</p>
                    <p className="text-sm">{scorer.team_name ?? "Sin equipo"}</p>
                  </div>
                  <span className="bg-[#900C3F] text-[#FFFFFF] py-1 px-3 rounded-full text-sm">
                    {scorer.goals ?? 0} goles
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
