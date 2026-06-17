"use client";

import { useState } from "react";

export default function CreateGoalScorer() {
  const [playerName, setPlayerName] = useState("");
  const [goals, setGoals] = useState("");
  const [team, setTeam] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/v1/goal-scorers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName,
          goals: parseInt(goals, 10),
          team,
          position,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create goal scorer.");
      }

      setSuccess(true);
      setPlayerName("");
      setGoals("");
      setTeam("");
      setPosition("");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-6">
      <h1 className="text-3xl font-bold text-[#000000] mb-6">Create Goal Scorer</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-base font-medium text-[#000000] mb-2">
            Player Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all"
            required
          />
        </div>
        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-base font-medium text-[#000000] mb-2">
            Goals
          </label>
          <input
            type="number"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            className="w-full border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all"
            required
          />
        </div>
        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-base font-medium text-[#000000] mb-2">
            Team
          </label>
          <input
            type="text"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="w-full border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all"
            required
          />
        </div>
        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-base font-medium text-[#000000] mb-2">
            Position
          </label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-[#FF0000] text-[#FFFFFF] rounded-full py-2 px-4 font-bold hover:bg-opacity-90 transition-all"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Create Goal Scorer"}
        </button>
        {error && <p className="text-[#FF0000] mt-2">{error}</p>}
        {success && <p className="text-[#00FF00] mt-2">Goal Scorer created successfully!</p>}
      </form>
    </div>
  );
}
