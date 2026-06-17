"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CreateScorer = () => {
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [goals, setGoals] = useState(0);
  const [tournamentId, setTournamentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/scorers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_name: playerName,
          team_name: teamName,
          goals,
          tournament_id: parseInt(tournamentId, 10),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create scorer");
      }

      router.push("/scorers");
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-[#FFFFFF] min-h-screen">
      <div className="sticky top-0 bg-[#FF6347] text-[#FFD700] p-4 shadow-md">
        <nav className="flex justify-around">
          <a href="/" className="font-bold text-2xl">Inicio</a>
          <a href="/matches" className="font-bold text-2xl">Partidos</a>
          <a href="/standings" className="font-bold text-2xl">Posiciones</a>
          <a href="/scorers" className="font-bold text-2xl">Goleadores</a>
        </nav>
      </div>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto mt-8">
        <h1 className="font-bold text-2xl mb-4">Create Scorer</h1>
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2">Player Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 w-full focus:border-[#FF4500] focus:outline-none"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2">Team Name</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 w-full focus:border-[#FF4500] focus:outline-none"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2">Goals</label>
          <input
            type="number"
            value={goals}
            onChange={(e) => setGoals(Number(e.target.value))}
            className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 w-full focus:border-[#FF4500] focus:outline-none"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2">Tournament ID</label>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Create Scorer"}
        </button>
      </form>
    </div>
  );
};

export default CreateScorer;
