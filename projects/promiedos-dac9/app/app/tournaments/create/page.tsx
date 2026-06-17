"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateTournament() {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        start_date: startDate,
        end_date: endDate,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      setError("Failed to create tournament. Please try again.");
      return;
    }

    router.push("/tournaments");
  };

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF] p-4">
      <header className="sticky top-0 bg-[#581845] z-10">
        <nav className="flex justify-between items-center">
          <a href="/" className="text-xl font-bold">Inicio</a>
          <a href="/tournaments" className="text-xl font-bold">Torneos</a>
        </nav>
      </header>
      <main className="mt-8 max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create Tournament</h1>
        <form onSubmit={handleSubmit} className="bg-[#FFC300] p-6 shadow-md rounded-lg">
          <div className="mb-4">
            <label className="block text-[#900C3F] mb-2">Tournament Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full border-b-2 border-[#900C3F] focus:border-[#FF5733] text-[#FFFFFF] bg-transparent p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#900C3F] mb-2">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-full border-b-2 border-[#900C3F] focus:border-[#FF5733] text-[#FFFFFF] bg-transparent p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#900C3F] mb-2">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="w-full border-b-2 border-[#900C3F] focus:border-[#FF5733] text-[#FFFFFF] bg-transparent p-2"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button 
            type="submit" 
            className="bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Tournament"}
          </button>
        </form>
      </main>
    </div>
  );
}
