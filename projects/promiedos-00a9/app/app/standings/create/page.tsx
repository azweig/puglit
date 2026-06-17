"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TeamStanding {
  teamName: string;
  points: number;
}

export default function CreateStandings() {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [teamName, setTeamName] = useState("");
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAddTeam = () => {
    if (teamName.trim() === "") {
      setError("Team name cannot be empty.");
      return;
    }
    setStandings([...standings, { teamName, points }]);
    setTeamName("");
    setPoints(0);
    setError("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/standings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ standings }),
      });
      if (!response.ok) {
        throw new Error("Failed to create standings.");
      }
      router.push("/app");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <h1 className="text-3xl font-bold mb-4">Create Standings</h1>
      <div className="flex flex-col space-y-4">
        {standings.map((team, index) => (
          <div
            key={index}
            className="flex justify-between items-center bg-[#DAF7A6] p-4 rounded-3xl shadow-lg"
          >
            <span>{team.teamName}</span>
            <span>{team.points} pts</span>
          </div>
        ))}
        <div className="bg-[#DAF7A6] p-4 rounded-3xl shadow-lg">
          <input
            type="text"
            placeholder="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
          />
          <input
            type="number"
            placeholder="Points"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
          />
          <button
            onClick={handleAddTeam}
            className="mt-2 bg-[#FF5733] text-[#FFFFFF] font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200"
          >
            Add Team
          </button>
        </div>
        {error && <p className="text-[#C70039]">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#FF5733] text-[#FFFFFF] font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200"
        >
          {loading ? "Submitting..." : "Submit Standings"}
        </button>
      </div>
    </div>
  );
}
