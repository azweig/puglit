"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function AddGoalScorer() {
  const { matchId } = useParams<{ matchId: string }>();
  const [playerName, setPlayerName] = useState("");
  const [goals, setGoals] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup any intervals or subscriptions if needed
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!playerName || goals <= 0) {
      setError("Please enter a valid player name and number of goals.");
      return;
    }

    try {
      const response = await fetch("/api/goal-scorers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ match_id: matchId, player_name: playerName, goals }),
      });

      if (!response.ok) {
        throw new Error("Failed to add goal scorer.");
      }

      setSuccess(true);
      setPlayerName("");
      setGoals(0);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-4">Add Goal Scorer</h1>
        <form onSubmit={handleSubmit} className="bg-[#FFC300] p-4 shadow-md rounded-lg">
          <div className="mb-4">
            <label className="block text-[#900C3F] mb-2">Player Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full border-b-2 border-[#900C3F] focus:border-[#FF5733] text-[#581845] bg-transparent p-2"
              placeholder="Enter player name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#900C3F] mb-2">Goals</label>
            <input
              type="number"
              value={goals}
              onChange={(e) => setGoals(Number(e.target.value))}
              className="w-full border-b-2 border-[#900C3F] focus:border-[#FF5733] text-[#581845] bg-transparent p-2"
              placeholder="Enter number of goals"
              min="0"
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {success && <p className="text-green-500 mb-4">Goal scorer added successfully!</p>}
          <button type="submit" className="bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors">
            Add Scorer
          </button>
        </form>
      </div>
    </div>
  );
}
