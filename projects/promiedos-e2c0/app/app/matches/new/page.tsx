"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CreateNewMatch() {
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam1, setSelectedTeam1] = useState<string>("");
  const [selectedTeam2, setSelectedTeam2] = useState<string>("");
  const [matchDate, setMatchDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Simulating fetching teams from an API
    setTeams(["Boca Juniors", "River Plate", "Independiente", "Racing Club"]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!selectedTeam1 || !selectedTeam2 || !matchDate) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team1: selectedTeam1,
          team2: selectedTeam2,
          date: matchDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create match.");
      }

      alert("Match created successfully!");
      setSelectedTeam1("");
      setSelectedTeam2("");
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
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <nav className="fixed top-0 left-0 right-0 bg-[#C70039] p-4 flex justify-between">
        <Link href="/" className="text-[#FFFFFF] font-bold">Inicio</Link>
        <Link href="/tournaments" className="text-[#FFFFFF] font-bold">Torneos</Link>
      </nav>

      <div className="mt-16 max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-4">Create New Match</h1>

        {error && <div className="text-[#FFC300] mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#C70039] p-4 rounded-lg shadow-md">
            <label className="block mb-2">Team 1</label>
            <select
              className="w-full border-2 border-[#FFC300] bg-transparent text-[#FFFFFF] p-2 rounded-md focus:outline-none focus:border-[#FF5733]"
              value={selectedTeam1}
              onChange={(e) => setSelectedTeam1(e.target.value)}
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#C70039] p-4 rounded-lg shadow-md">
            <label className="block mb-2">Team 2</label>
            <select
              className="w-full border-2 border-[#FFC300] bg-transparent text-[#FFFFFF] p-2 rounded-md focus:outline-none focus:border-[#FF5733]"
              value={selectedTeam2}
              onChange={(e) => setSelectedTeam2(e.target.value)}
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#C70039] p-4 rounded-lg shadow-md">
            <label className="block mb-2">Match Date</label>
            <input
              type="date"
              className="w-full border-2 border-[#FFC300] bg-transparent text-[#FFFFFF] p-2 rounded-md focus:outline-none focus:border-[#FF5733]"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#FFC300] transition duration-200"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Match"}
          </button>
        </form>
      </div>
    </div>
  );
}
