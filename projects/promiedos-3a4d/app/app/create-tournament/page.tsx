"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateTournament() {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentStage, setCurrentStage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          start_date: startDate,
          end_date: endDate,
          current_stage: currentStage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create tournament");
      }

      router.push("/");
    } catch (error: any) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <div className="sticky top-0 bg-[#FF6347] p-4 shadow-md">
        <nav className="flex justify-around">
          <Link href="/" className="text-[#FFD700] font-bold text-2xl">Inicio</Link>
          <Link href="/matches" className="text-[#FFD700] font-bold text-2xl">Partidos</Link>
          <Link href="/standings" className="text-[#FFD700] font-bold text-2xl">Posiciones</Link>
          <Link href="/scorers" className="text-[#FFD700] font-bold text-2xl">Goleadores</Link>
        </nav>
      </div>
      <div className="max-w-md mx-auto mt-8">
        <h1 className="font-bold text-2xl text-center mb-4">Create Tournament</h1>
        <form onSubmit={handleSubmit} className="bg-[#FF6347] shadow-md rounded-lg p-4">
          <div className="mb-4">
            <label className="block text-[#000000] font-semibold mb-2">Tournament Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 focus:border-[#FF4500] focus:outline-none w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#000000] font-semibold mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 focus:border-[#FF4500] focus:outline-none w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#000000] font-semibold mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 focus:border-[#FF4500] focus:outline-none w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#000000] font-semibold mb-2">Current Stage</label>
            <input
              type="text"
              value={currentStage}
              onChange={(e) => setCurrentStage(e.target.value)}
              className="bg-[#FFFFFF] border border-[#808080] rounded-lg px-4 py-2 focus:border-[#FF4500] focus:outline-none w-full"
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="bg-[#FF4500] text-[#FFFFFF] font-bold rounded-lg px-6 py-2 hover:bg-[#FF7F50] transition-colors w-full"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Tournament"}
          </button>
        </form>
      </div>
    </div>
  );
}
