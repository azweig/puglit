"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateMatch() {
  const router = useRouter();
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
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
          homeTeam,
          awayTeam,
          date,
          time,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create match");
      }

      router.push("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen p-4">
      <div className="sticky top-0 bg-[#FFFFFF] shadow-md">
        <nav className="flex justify-around py-4">
          <a href="/app" className="text-[#1E90FF] font-bold">Partidos en Vivo</a>
          <a href="/app/tournaments" className="text-[#1E90FF] font-bold">Torneos</a>
          <a href="/app/standings" className="text-[#1E90FF] font-bold">Tabla de Posiciones</a>
          <a href="/app/scorers" className="text-[#1E90FF] font-bold">Goleadores</a>
        </nav>
      </div>
      <div className="max-w-lg mx-auto mt-8">
        <h1 className="text-2xl font-bold text-center mb-4">Crear Partido</h1>
        <form onSubmit={handleSubmit} className="bg-[#F0F0F0] p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-[#000000] mb-2">Equipo Local</label>
            <input
              type="text"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="border border-[#C0C0C0] p-2 rounded-md w-full focus:border-[#1E90FF]"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#000000] mb-2">Equipo Visitante</label>
            <input
              type="text"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="border border-[#C0C0C0] p-2 rounded-md w-full focus:border-[#1E90FF]"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#000000] mb-2">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-[#C0C0C0] p-2 rounded-md w-full focus:border-[#1E90FF]"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#000000] mb-2">Hora</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border border-[#C0C0C0] p-2 rounded-md w-full focus:border-[#1E90FF]"
              required
            />
          </div>
          {error && <p className="text-[#FF4500] mb-4">{error}</p>}
          <button
            type="submit"
            className="bg-[#1E90FF] text-[#FFFFFF] py-2 px-4 rounded-md w-full hover:bg-[#104E8B] transition-all duration-200 ease-in-out"
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear Partido"}
          </button>
        </form>
      </div>
    </div>
  );
}
