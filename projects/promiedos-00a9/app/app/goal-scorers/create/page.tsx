"use client";

import { useState } from "react";

const CreateGoalScorer = () => {
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [goals, setGoals] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/v1/goal-scorers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, team, goals }),
      });

      if (!response.ok) {
        throw new Error("Failed to create goal scorer");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <h1 className="text-3xl font-bold mb-4">Create Goal Scorer</h1>
      {error && <div className="text-[#C70039] mb-4">{error}</div>}
      {success && <div className="text-[#DAF7A6] mb-4">Goal scorer created successfully!</div>}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Player Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
          required
        />
        <input
          type="text"
          placeholder="Team"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
          required
        />
        <input
          type="number"
          placeholder="Goals"
          value={goals}
          onChange={(e) => setGoals(Number(e.target.value))}
          className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
          min="0"
          required
        />
        <button
          type="submit"
          className="bg-[#FF5733] text-[#FFFFFF] font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Create Goal Scorer"}
        </button>
      </form>
      <div className="flex justify-around bg-[#581845] text-[#FFFFFF] py-2 mt-4">
        <a href="/app" className="hover:underline">Partidos en Vivo</a>
      </div>
    </div>
  );
};

export default CreateGoalScorer;
