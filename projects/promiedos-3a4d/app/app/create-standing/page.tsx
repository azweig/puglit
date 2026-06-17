"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateStanding() {
  const [teamName, setTeamName] = useState("");
  const [points, setPoints] = useState(0);
  const [matchesPlayed, setMatchesPlayed] = useState(0);
  const [goalDifference, setGoalDifference] = useState(0);
  const [tournamentId, setTournamentId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const response = await fetch("/api/standings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        team_name: teamName,
        points,
        matches_played: matchesPlayed,
        goal_difference: goalDifference,
        tournament_id: parseInt(tournamentId, 10),
      }),
    });

    if (response.ok) {
      router.push("/standings");
    } else {
      setError("Failed to create standing. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <nav className="sticky top-0 bg-[#FF6347] shadow-md flex justify-around p-4">
        <a href="/" className="text-[#FFD700] font-bold text-2xl">Inicio</a>
        <a href="/matches" className="text-[#FFD700] font-bold text-2xl">Partidos</a>
        <a href="/standings" className="text-[#FFD700] font-bold text-2xl">Posiciones</a>
        <a href="/scorers" className="text-[#FFD700] font-bold text-2xl">Goleadores</a>
      </nav>
      <div className="max-w-lg mx-auto mt-8">
        <h1 className="font-bold text-2xl text-[#000000] mb-4">Create Standing</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="bg-[#FF6347] shadow-md rounded-lg p-4">
          <div className="mb-4">
            <label className="block text-[#000000] font-semibold mb-2">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 w-full focus:border-[#FF4500] focus:outline-none"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#000000] font-semibold mb-2">Points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value, 10))}
              className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 w-full focus:border-[#FF4500] focus:outline-none"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#000000] font-semibold mb-2">Matches Played</label>
            <input
              type="number"
              value={matchesPlayed}
              onChange={(e) => setMatchesPlayed(parseInt(e.target.value, 10))}
              className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 w-full focus:border-[#FF4500] focus:outline-none"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#000000] font-semibold mb-2">Goal Difference</label>
            <input
              type="number"
              value={goalDifference}
              onChange={(e) => setGoalDifference(parseInt(e.target.value, 10))}
              className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 w-full focus:border-[#FF4500] focus:outline-none"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#000000] font-semibold mb-2">Tournament ID</label>
            <input
              type="text"
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 w-full focus:border-[#FF4500] focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-[#FF4500] text-[#FFFFFF] font-bold rounded-lg px-6 py-2 hover:bg-[#FF7F50] transition-colors w-full"
          >
            Create Standing
          </button>
        </form>
      </div>
    </div>
  );
}
