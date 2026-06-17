"use client";

import { useState } from "react";
import { NextRequest, NextResponse } from "next/server";

export default function CreateMatch() {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
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
          teamA,
          teamB,
          date,
          time,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create match");
      }

      alert("Match created successfully!");
      setTeamA("");
      setTeamB("");
      setDate("");
      setTime("");
    } catch (error) {
      setError("An error occurred while creating the match.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <h1 className="text-3xl font-bold text-[#000000] mb-6">Create Match</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
          placeholder="Team A"
          className="border-2 border-[#CCCCCC] rounded-lg py-2 px-4 w-full"
          required
        />
        <input
          type="text"
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
          placeholder="Team B"
          className="border-2 border-[#CCCCCC] rounded-lg py-2 px-4 w-full"
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border-2 border-[#CCCCCC] rounded-lg py-2 px-4 w-full"
          required
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border-2 border-[#CCCCCC] rounded-lg py-2 px-4 w-full"
          required
        />

        {error && <p className="text-[#FF0000]">{error}</p>}

        <button
          type="submit"
          className="bg-[#FF0000] text-[#FFFFFF] rounded-full py-2 px-6 transition-all duration-200 ease-in-out hover:bg-[#FF4D4D]"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Match"}
        </button>
      </form>
    </div>
  );
}
