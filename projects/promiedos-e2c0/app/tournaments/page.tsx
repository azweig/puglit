"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Tournament = {
  id: string;
  name: string;
  logo_url: string;
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch("/api/tournaments");
        if (!response.ok) {
          throw new Error("Failed to fetch tournaments");
        }
        const data: Tournament[] = await response.json();
        setTournaments(data);
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF]">
      <header className="fixed top-0 left-0 right-0 bg-[#C70039] p-4 shadow-md">
        <nav className="flex justify-around">
          <Link href="/" className="text-lg font-bold">Fútbol Argentino en Vivo</Link>
          <Link href="/tournaments" className="text-lg font-bold">Torneos</Link>
          <Link href="/standings" className="text-lg font-bold">Tabla de Posiciones</Link>
          <Link href="/goal-scorers" className="text-lg font-bold">Goleadores</Link>
          <Link href="/historical-results" className="text-lg font-bold">Resultados Históricos</Link>
        </nav>
      </header>
      <main className="pt-20 p-4">
        <h1 className="text-2xl font-bold mb-4">Torneos</h1>
        {loading ? (
          <p className="text-center">Cargando torneos...</p>
        ) : error ? (
          <p className="text-center text-[#FFC300]">Error: {error}</p>
        ) : tournaments.length === 0 ? (
          <p className="text-center">No hay torneos disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="bg-[#C70039] p-4 rounded-lg shadow-md">
                <img
                  src={tournament.logo_url ?? "/placeholder-logo.png"}
                  alt={tournament.name}
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
                <h2 className="text-lg font-bold mb-2">{tournament.name}</h2>
                <div className="flex justify-between">
                  <Link href={`/tournament/${tournament.id}/standings`} className="text-sm text-[#FF5733] hover:underline">
                    Ver Tabla de Posiciones
                  </Link>
                  <Link href={`/tournament/${tournament.id}/goal-scorers`} className="text-sm text-[#FF5733] hover:underline">
                    Ver Goleadores
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
