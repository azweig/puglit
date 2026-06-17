"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateStandings() {
  const [teamName, setTeamName] = useState("");
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/standings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamName, points }),
      });

      if (!response.ok) {
        throw new Error("Failed to create standings entry");
      }

      router.push("/app/standings");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <header className="sticky top-0 bg-[#F0F0F0] shadow-md">
        <nav className="flex justify-around py-4">
          <a href="/app" className="text-[#000000] hover:text-[#1E90FF] transition-all duration-200">Partidos en Vivo</a>
          <a href="/app/tournaments" className="text-[#000000] hover:text-[#1E90FF] transition-all duration-200">Torneos</a>
          <a href="/app/standings" className="text-[#000000] hover:text-[#1E90FF] transition-all duration-200">Tabla de Posiciones</a>
          <a href="/app/scorers" className="text-[#000000] hover:text-[#1E90FF] transition-all duration-200">Goleadores</a>
        </nav>
      </header>
      <main className="flex flex-col items-center py-8">
        <h1 className="text-4xl font-bold text-[#000000] mb-6">Create Standings</h1>
        <form onSubmit={handleSubmit} className="bg-[#F0F0F0] p-6 rounded-lg shadow-md w-full max-w-md">
          <div className="mb-4">
            <label htmlFor="teamName" className="block text-[#000000] mb-2">Team Name</label>
            <input
              type="text"
              id="teamName"
              className="w-full border border-[#C0C0C0] p-2 rounded-md focus:border-[#1E90FF]"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="points" className="block text-[#000000] mb-2">Points</label>
            <input
              type="number"
              id="points"
              className="w-full border border-[#C0C0C0] p-2 rounded-md focus:border-[#1E90FF]"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="bg-[#1E90FF] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-[#104E8B] transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </main>
    </div>
  );
}
