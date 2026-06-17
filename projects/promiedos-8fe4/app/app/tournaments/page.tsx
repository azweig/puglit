"use client";

import { useEffect, useState } from "react";

type Tournament = {
  id: string;
  name: string;
  current_round: string;
};

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await fetch("/api/tournaments");
        if (!res.ok) throw new Error("Failed to fetch tournaments");
        const data = await res.json();
        setTournaments(data.tournaments ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="sticky top-0 bg-[#F0F0F0] p-4 shadow-md">
        <nav className="flex justify-between">
          <a href="/app" className="text-[#1E90FF] font-bold">Partidos en Vivo</a>
          <a href="/app/tournaments" className="text-[#FF4500] font-bold">Torneos</a>
          <a href="/app/standings" className="text-[#1E90FF] font-bold">Tabla de Posiciones</a>
          <a href="/app/scorers" className="text-[#1E90FF] font-bold">Goleadores</a>
        </nav>
      </div>

      <div className="p-4">
        <h1 className="text-4xl font-bold text-[#000000] mb-4">Torneos</h1>
        {loading ? (
          <p className="text-[#808080]">Cargando torneos...</p>
        ) : error ? (
          <p className="text-[#FF4500]">Error: {error}</p>
        ) : tournaments.length === 0 ? (
          <p className="text-[#808080]">No hay torneos disponibles.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <li key={tournament.id} className="bg-[#F0F0F0] text-[#000000] p-4 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-2">{tournament.name ?? "Sin nombre"}</h2>
                <p className="text-lg">Ronda Actual: {tournament.current_round ?? "N/A"}</p>
                <button className="mt-4 bg-[#1E90FF] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-[#104E8B] transition-all duration-200 ease-in-out">
                  Ver Detalles
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
