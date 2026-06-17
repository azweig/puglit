"use client";

import { useState } from "react";

export default function CreateTournament() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/v1/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create tournament.");
      }

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] flex flex-col items-center py-8">
      <h1 className="text-3xl font-bold mb-6">Create Tournament</h1>
      <form onSubmit={handleSubmit} className="bg-[#DAF7A6] p-6 rounded-3xl shadow-lg w-full max-w-md">
        <div className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Tournament Name"
            className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <input
            type="date"
            className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <input
            type="date"
            className="bg-[#FFFFFF] text-[#581845] border-[#900C3F] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-[#FF5733] text-[#FFFFFF] font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Tournament"}
          </button>
          {error && <p className="text-[#C70039]">{error}</p>}
          {success && <p className="text-[#FFFFFF]">Tournament created successfully!</p>}
        </div>
      </form>
    </div>
  );
}
