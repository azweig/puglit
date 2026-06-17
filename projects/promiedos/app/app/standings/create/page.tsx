"use client";

import { useState } from "react";

export default function CreateStandings() {
  const [teamName, setTeamName] = useState("");
  const [points, setPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/v1/standings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamName,
          points,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create standings");
      }

      setSuccess("Standings created successfully!");
      setTeamName("");
      setPoints("");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <h1 className="font-bold text-3xl text-[#000000] mb-6">Create Standings</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-xl font-medium text-[#000000] mb-2">Team Name</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all w-full"
            required
          />
        </div>
        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-xl font-medium text-[#000000] mb-2">Points</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all w-full"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-[#FF0000] text-[#FFFFFF] rounded-full py-2 px-4 font-bold hover:bg-opacity-90 transition-all"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Standings"}
        </button>
        {error && <p className="text-[#FF0000] mt-4">{error}</p>}
        {success && <p className="text-[#00FF00] mt-4">{success}</p>}
      </form>
    </div>
  );
}
