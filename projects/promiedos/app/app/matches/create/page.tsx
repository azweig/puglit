"use client";

import { useState } from "react";

export default function CreateMatch() {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/v1/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamA,
          teamB,
          matchDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create match");
      }

      setSuccess("Match created successfully!");
      setTeamA("");
      setTeamB("");
      setMatchDate("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <h1 className="text-3xl font-bold text-[#000000] mb-6">Create Match</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-xl font-medium text-[#000000] mb-2">Team A</label>
          <input
            type="text"
            value={teamA}
            onChange={(e) => setTeamA(e.target.value)}
            className="border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all w-full"
            required
          />
        </div>

        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-xl font-medium text-[#000000] mb-2">Team B</label>
          <input
            type="text"
            value={teamB}
            onChange={(e) => setTeamB(e.target.value)}
            className="border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all w-full"
            required
          />
        </div>

        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-xl font-medium text-[#000000] mb-2">Match Date</label>
          <input
            type="date"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            className="border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all w-full"
            required
          />
        </div>

        {error && <p className="text-[#FF0000]">{error}</p>}
        {success && <p className="text-[#00FF00]">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#FF0000] text-[#FFFFFF] rounded-full py-2 px-4 font-bold hover:bg-opacity-90 transition-all"
        >
          {loading ? "Creating..." : "Create Match"}
        </button>
      </form>
    </div>
  );
}
