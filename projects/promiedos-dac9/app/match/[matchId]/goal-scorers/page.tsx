"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface GoalScorer {
  id: number;
  player_name: string;
  goals: number;
}

export default function GoalScorers() {
  const { matchId } = useParams<{ matchId: string }>();
  const [goalScorers, setGoalScorers] = useState<GoalScorer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGoalScorers() {
      try {
        const response = await fetch(`/api/goal-scorers?match_id=${matchId}`);
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.items ?? data.rows ?? []);
        setGoalScorers(list);
        setLoading(false);
      } catch (err: any) {
        setError("Failed to load goal scorers.");
        setLoading(false);
      }
    }

    fetchGoalScorers();
    const interval = setInterval(fetchGoalScorers, 2500);

    return () => clearInterval(interval);
  }, [matchId]);

  return (
    <div className="bg-[#581845] min-h-screen p-4 text-[#FFFFFF]">
      <header className="sticky top-0 bg-[#581845] text-center py-4">
        <h1 className="text-3xl font-bold">Goleadores</h1>
        <nav className="flex justify-center space-x-4 mt-2">
          <Link href="/" className="text-[#FF5733]">Inicio</Link>
          <Link href="/tournaments" className="text-[#FF5733]">Torneos</Link>
        </nav>
      </header>
      <main className="mt-6">
        {loading && <p className="italic">Cargando goleadores...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <ul className="space-y-4">
            {goalScorers.map((scorer) => (
              <li key={scorer.id} className="bg-[#FFC300] p-4 shadow-md rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">{scorer.player_name}</span>
                  <span className="bg-[#DAF7A6] text-[#581845] py-1 px-3 rounded-full">
                    {scorer.goals} {scorer.goals === 1 ? "Gol" : "Goles"}
                  </span>
                </div>
              </li>
            ))}
            {goalScorers.length === 0 && <p className="italic">No hay goleadores para este partido.</p>}
          </ul>
        )}
      </main>
    </div>
  );
}
