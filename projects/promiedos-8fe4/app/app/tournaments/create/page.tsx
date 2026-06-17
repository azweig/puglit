"use client";

import { useState } from "react";

export default function CreateTournament() {
  const [tournamentName, setTournamentName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [teams, setTeams] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tournamentName,
          start_date: startDate,
          teams: teams.split(",").map((team) => team.trim()),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create tournament");
      }

      setSuccess("Tournament created successfully!");
    } catch (err) {
      setError((err as Error).message ?? "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <header className="sticky top-0 bg-[#FFFFFF] shadow-md p-4">
        <nav className="flex space-x-4">
          <a href="/app" className="text-[#1E90FF] hover:underline">Partidos en Vivo</a>
          <a href="/app/tournaments" className="text-[#1E90FF] hover:underline">Torneos</a>
          <a href="/app/standings" className="text-[#1E90FF] hover:underline">Tabla de Posiciones</a>
          <a href="/app/scorers" className="text-[#1E90FF] hover:underline">Goleadores</a>
        </nav>
      </header>
      <main className="max-w-lg mx-auto mt-8">
        <h1 className="text-2xl font-bold text-[#000000] mb-6">Create Tournament</h1>
        <form onSubmit={handleSubmit} className="bg-[#F0F0F0] p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-[#000000] mb-2">Tournament Name</label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full border border-[#C0C0C0] p-2 rounded-md focus:border-[#1E90FF]"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#000000] mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-[#C0C0C0] p-2 rounded-md focus:border-[#1E90FF]"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#000000] mb-2">Teams (comma separated)</label>
            <input
              type="text"
              value={teams}
              onChange={(e) => setTeams(e.target.value)}
              className="w-full border border-[#C0C0C0] p-2 rounded-md focus:border-[#1E90FF]"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-[#1E90FF] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-[#104E8B] transition-all duration-200 ease-in-out"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Tournament"}
          </button>
        </form>
        {error && <p className="text-[#FF4500] mt-4">{error}</p>}
        {success && <p className="text-[#1E90FF] mt-4">{success}</p>}
      </main>
    </div>
  );
}
