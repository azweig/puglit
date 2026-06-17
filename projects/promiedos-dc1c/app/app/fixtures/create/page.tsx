"use client";

import { useState } from "react";

export default function CreateFixture() {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!homeTeam || !awayTeam || !matchDate) {
      setError("Por favor complete todos los campos.");
      return;
    }

    const response = await fetch("/api/fixtures", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        homeTeam,
        awayTeam,
        matchDate,
      }),
    });

    if (response.ok) {
      setSuccess(true);
      setHomeTeam("");
      setAwayTeam("");
      setMatchDate("");
    } else {
      setError("Error al crear el fixture. Intente nuevamente.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-6">
      <h1 className="text-2xl font-bold text-[#000000] mb-6">Crear Fixture</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Equipo Local"
          value={homeTeam}
          onChange={(e) => setHomeTeam(e.target.value)}
          className="border-2 border-[#CCCCCC] rounded-lg py-2 px-4 w-full"
        />
        <input
          type="text"
          placeholder="Equipo Visitante"
          value={awayTeam}
          onChange={(e) => setAwayTeam(e.target.value)}
          className="border-2 border-[#CCCCCC] rounded-lg py-2 px-4 w-full"
        />
        <input
          type="date"
          value={matchDate}
          onChange={(e) => setMatchDate(e.target.value)}
          className="border-2 border-[#CCCCCC] rounded-lg py-2 px-4 w-full"
        />
        {error && <p className="text-[#FF0000]">{error}</p>}
        {success && <p className="text-[#FFD700]">Fixture creado exitosamente!</p>}
        <button type="submit" className="bg-[#FF0000] text-[#FFFFFF] rounded-full py-2 px-6 transition-all duration-200 ease-in-out hover:scale-105">
          Crear Fixture
        </button>
      </form>
    </div>
  );
}
