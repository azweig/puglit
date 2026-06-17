"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import Link from "next/link";

interface TeamStanding {
  position: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
}

export default function StandingsPage() {
  const { id } = useParams<{ id: string }>();
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const response = await fetch(`/api/standings?tournamentId=${id}`);
        if (!response.ok) throw new Error("Failed to fetch standings");
        const data = await response.json();
        setStandings(data.standings ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [id]);

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF]">
      <header className="fixed top-0 w-full bg-[#C70039] p-4 shadow-md">
        <nav className="flex justify-around">
          <Link href="/" className="text-[#FFFFFF] font-bold">Inicio</Link>
          <Link href="/tournaments" className="text-[#FFFFFF] font-bold">Torneos</Link>
        </nav>
      </header>
      <main className="pt-20 p-4">
        <h1 className="text-2xl font-bold mb-4">Tabla de Posiciones</h1>
        {loading ? (
          <p className="text-center">Cargando...</p>
        ) : error ? (
          <p className="text-center text-[#FFC300]">Error: {error}</p>
        ) : standings.length === 0 ? (
          <p className="text-center">No hay datos disponibles.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#900C3F]">
                <th className="p-2">Posición</th>
                <th className="p-2">Equipo</th>
                <th className="p-2">PJ</th>
                <th className="p-2">G</th>
                <th className="p-2">E</th>
                <th className="p-2">P</th>
                <th className="p-2">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team) => (
                <tr key={team.position} className="border-b border-[#900C3F]">
                  <td className="p-2">{team.position}</td>
                  <td className="p-2">{team.teamName}</td>
                  <td className="p-2">{team.played}</td>
                  <td className="p-2">{team.won}</td>
                  <td className="p-2">{team.drawn}</td>
                  <td className="p-2">{team.lost}</td>
                  <td className="p-2">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

export async function GET(request: NextRequest) {
  // This function would handle server-side logic if needed
  return NextResponse.next();
}