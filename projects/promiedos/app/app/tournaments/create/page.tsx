"use client";

import { useState } from "react";

export default function CreateTournament() {
  const [tournamentName, setTournamentName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const response = await fetch("/api/v1/tournaments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: tournamentName,
        start_date: startDate,
        end_date: endDate,
        location,
      }),
    });

    setLoading(false);

    if (response.ok) {
      setSuccess(true);
    } else {
      setError("Failed to create tournament. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <h1 className="text-3xl font-bold text-[#000000] mb-6">Create Tournament</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-xl font-medium text-[#000000] mb-2" htmlFor="tournamentName">
            Tournament Name
          </label>
          <input
            id="tournamentName"
            type="text"
            className="border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all w-full"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            required
          />
        </div>
        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-xl font-medium text-[#000000] mb-2" htmlFor="startDate">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            className="border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all w-full"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-xl font-medium text-[#000000] mb-2" htmlFor="endDate">
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            className="border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all w-full"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <div className="rounded-3xl shadow-lg p-6 bg-[#FFCC00]">
          <label className="block text-xl font-medium text-[#000000] mb-2" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            type="text"
            className="border border-[#333333] rounded-lg p-3 text-base text-[#000000] focus:outline-none focus:border-[#FF0000] transition-all w-full"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-[#FF0000] text-[#FFFFFF] rounded-full py-2 px-4 font-bold hover:bg-opacity-90 transition-all w-full"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Tournament"}
        </button>
        {error && <p className="text-[#FF0000] mt-4">{error}</p>}
        {success && <p className="text-[#000000] mt-4">Tournament created successfully!</p>}
      </form>
    </div>
  );
}
