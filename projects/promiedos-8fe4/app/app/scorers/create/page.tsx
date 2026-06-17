"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateScorer() {
  const [playerName, setPlayerName] = useState("");
  const [goals, setGoals] = useState(0);
  const [team, setTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/scorers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerName, goals, team }),
      });

      if (!response.ok) {
        throw new Error("Failed to create scorer");
      }

      router.push("/app/scorers");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <h1 className="text-2xl font-bold text-[#000000] mb-4">Create Scorer</h1>
      <form onSubmit={handleSubmit} className="bg-[#F0F0F0] p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-[#000000] mb-2" htmlFor="playerName">
            Player Name
          </label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full border border-[#C0C0C0] p-2 rounded-md focus:border-[#1E90FF]"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-[#000000] mb-2" htmlFor="goals">
            Goals
          </label>
          <input
            type="number"
            id="goals"
            value={goals}
            onChange={(e) => setGoals(Number(e.target.value))}
            className="w-full border border-[#C0C0C0] p-2 rounded-md focus:border-[#1E90FF]"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-[#000000] mb-2" htmlFor="team">
            Team
          </label>
          <input
            type="text"
            id="team"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="w-full border border-[#C0C0C0] p-2 rounded-md focus:border-[#1E90FF]"
            required
          />
        </div>
        {error && <p className="text-[#FF4500] mb-4">{error}</p>}
        <button
          type="submit"
          className="bg-[#1E90FF] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-[#104E8B] transition-all duration-200 ease-in-out"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Create Scorer"}
        </button>
      </form>
    </div>
  );
}
