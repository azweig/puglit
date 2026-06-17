"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateMatch() {
  const [teamHome, setTeamHome] = useState("");
  const [teamAway, setTeamAway] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const matchData = {
      team_home: teamHome,
      team_away: teamAway,
      date: new Date(date).toISOString(),
    };

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(matchData),
      });

      if (!response.ok) {
        throw new Error("Failed to create match");
      }

      router.push("/");
    } catch (error: any) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <header className="sticky top-0 bg-[#581845] py-4">
        <nav className="flex justify-between">
          <Link href="/" className="text-[#FFC300] text-xl font-bold">Inicio</Link>
          <Link href="/tournaments" className="text-[#FFC300] text-xl font-bold">Torneos</Link>
        </nav>
      </header>
      <main className="mt-8 max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create Match</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Home Team</label>
            <input
              type="text"
              value={teamHome}
              onChange={(e) => setTeamHome(e.target.value)}
              className="w-full border-b-2 border-[#900C3F] focus:border-[#FF5733] text-[#FFFFFF] bg-transparent p-2"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Away Team</label>
            <input
              type="text"
              value={teamAway}
              onChange={(e) => setTeamAway(e.target.value)}
              className="w-full border-b-2 border-[#900C3F] focus:border-[#FF5733] text-[#FFFFFF] bg-transparent p-2"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Match Date</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-b-2 border-[#900C3F] focus:border-[#FF5733] text-[#FFFFFF] bg-transparent p-2"
              required
            />
          </div>
          {error && <p className="text-[#FF5733]">{error}</p>}
          <button
            type="submit"
            className="bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Match"}
          </button>
        </form>
      </main>
    </div>
  );
}
