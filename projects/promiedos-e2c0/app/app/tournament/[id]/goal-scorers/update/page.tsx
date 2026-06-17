"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface GoalScorer {
  id: string;
  name: string;
  goals: number;
}

export default function UpdateGoalScorers() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const [goalScorers, setGoalScorers] = useState<GoalScorer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGoalScorers() {
      try {
        const response = await fetch(`/api/goal-scorers?tournamentId=${tournamentId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch goal scorers.");
        }
        const data = await response.json();
        setGoalScorers(data?.goalScorers ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchGoalScorers();
  }, [tournamentId]);

  const handleGoalChange = (index: number, goals: number) => {
    const updatedGoalScorers = [...goalScorers];
    updatedGoalScorers[index].goals = goals;
    setGoalScorers(updatedGoalScorers);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/goal-scorers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tournamentId, goalScorers }),
      });
      if (!response.ok) {
        throw new Error("Failed to update goal scorers.");
      }
      alert("Goal scorers updated successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-[#FFFFFF]">Loading...</div>;
  if (error) return <div className="text-[#FFC300]">{error}</div>;

  return (
    <div className="bg-[#581845] min-h-screen p-4">
      <div className="fixed top-0 left-0 right-0 bg-[#C70039] p-4 flex justify-between">
        <Link href="/" className="text-[#FFFFFF] font-bold">Inicio</Link>
        <Link href="/tournaments" className="text-[#FFFFFF] font-bold">Torneos</Link>
      </div>
      <div className="mt-16">
        <h1 className="text-2xl font-bold text-[#FFFFFF] mb-4">Update Goal Scorers</h1>
        <div className="space-y-4">
          {goalScorers.map((scorer, index) => (
            <div key={scorer.id} className="bg-[#C70039] p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <span className="text-[#FFFFFF] font-medium">{scorer.name}</span>
                <input
                  type="number"
                  value={scorer.goals}
                  onChange={(e) => handleGoalChange(index, parseInt(e.target.value, 10) || 0)}
                  className="border-2 border-[#FFC300] bg-transparent text-[#FFFFFF] p-2 rounded-md focus:outline-none focus:border-[#FF5733] w-20"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          className="bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#FFC300] transition duration-200 mt-4"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
