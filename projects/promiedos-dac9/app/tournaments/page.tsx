"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Tournament {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  current_round: number;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        const response = await fetch("/api/tournaments");
        if (!response.ok) {
          throw new Error("Failed to fetch tournaments");
        }
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.items ?? [];
        setTournaments(list);
      } catch (err: any) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchTournaments();
  }, []);

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF]">
      <header className="sticky top-0 bg-[#FFC300] text-[#900C3F] p-4 shadow-md">
        <nav className="flex justify-around">
          <Link href="/" className="text-lg font-bold">Inicio</Link>
          <Link href="/tournaments" className="text-lg font-bold">Torneos</Link>
        </nav>
      </header>
      <main className="p-4">
        <h1 className="text-3xl font-bold mb-4">Torneos</h1>
        {loading && <p className="italic">Cargando torneos...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="bg-[#FFC300] p-4 shadow-md rounded-lg transition-transform transform hover:scale-105">
              <h2 className="text-xl font-bold text-[#900C3F]">{tournament.name}</h2>
              <p className="text-base font-medium">Inicio: {new Date(tournament.start_date).toLocaleDateString()}</p>
              <p className="text-base font-medium">Fin: {new Date(tournament.end_date).toLocaleDateString()}</p>
              <p className="text-base font-medium">Ronda actual: {tournament.current_round}</p>
              <Link href={`/standings/${tournament.id}`} className="block mt-2 text-center bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors">Ver Tabla de Posiciones</Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
