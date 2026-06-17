"use client";

import { useState } from "react";

export default function CreateMatch() {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/v1/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamA,
          teamB,
          date,
          time,
          location,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create match");
      }

      // Reset form on success
      setTeamA("");
      setTeamB("");
      setDate("");
      setTime("");
      setLocation("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] p-4">
      <h1 className="text-3xl font-bold text-[#FFFFFF] mb-4">Create Match</h1>
      {error && <div className="text-[#C70039] mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Team A"
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
          className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
          required
        />
        <input
          type="text"
          placeholder="Team B"
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
          className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
          required
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
          required
        />
        <button
          type="submit"
          className="bg-[#FF5733] text-[#FFFFFF] font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Create Match"}
        </button>
      </form>
    </div>
  );
}
