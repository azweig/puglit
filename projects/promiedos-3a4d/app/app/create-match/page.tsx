"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateMatch() {
  const router = useRouter();
  const [teamHome, setTeamHome] = useState("");
  const [teamAway, setTeamAway] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team_home: teamHome,
          team_away: teamAway,
          date_time: new Date(dateTime).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create match");
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <div className="sticky top-0 bg-[#FF6347] p-4 shadow-md">
        <h1 className="text-2xl font-bold text-[#FFD700]">Create Match</h1>
      </div>
      <form onSubmit={handleSubmit} className="mt-6">
        <div className="mb-4">
          <label className="block text-lg font-normal text-[#000000] mb-2">Home Team</label>
          <input
            type="text"
            value={teamHome}
            onChange={(e) => setTeamHome(e.target.value)}
            className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 focus:border-[#FF4500] focus:outline-none w-full"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-lg font-normal text-[#000000] mb-2">Away Team</label>
          <input
            type="text"
            value={teamAway}
            onChange={(e) => setTeamAway(e.target.value)}
            className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 focus:border-[#FF4500] focus:outline-none w-full"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-lg font-normal text-[#000000] mb-2">Date & Time</label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 focus:border-[#FF4500] focus:outline-none w-full"
            required
          />
        </div>
        {error && <p className="text-[#FF4500] mb-4">{error}</p>}
        <button
          type="submit"
          className="bg-[#FF4500] text-[#FFFFFF] font-bold rounded-lg px-6 py-2 hover:bg-[#FF7F50] transition-colors w-full"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Match"}
        </button>
      </form>
    </div>
  );
}
