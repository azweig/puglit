"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Standing {
  id: number;
  team_name: string;
  points: number;
  matches_played: number;
}

export default function Standings() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStandings() {
      try {
        const response = await fetch(`/api/standings?tournamentId=${tournamentId}`);
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.items ?? data.rows ?? []);
        setStandings(list);
      } catch (err: any) {
        setError("Failed to load standings.");
      } finally {
        setLoading(false);
      }
    }

    fetchStandings();
  }, [tournamentId]);

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF]">
      <div className="sticky top-0 bg-[#FFC300] p-4">
        <h1 className="text-3xl font-bold text-center">Tabla de Posiciones</h1>
        <div className="flex justify-around mt-4">
          <Link href="/" className="text-[#900C3F]">Inicio</Link>
          <Link href="/tournaments" className="text-[#900C3F]">Torneos</Link>
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <p className="text-center italic">Cargando...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : standings.length === 0 ? (
          <p className="text-center italic">No hay datos disponibles.</p>
        ) : (
          <table className="w-full bg-[#FFC300] shadow-md rounded-lg">
            <thead>
              <tr>
                <th className="p-2 text-left">Equipo</th>
                <th className="p-2 text-right">Puntos</th>
                <th className="p-2 text-right">Partidos Jugados</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing) => (
                <tr key={standing.id} className="hover:bg-opacity-90">
                  <td className="p-2 text-left text-[#581845]">{standing.team_name}</td>
                  <td className="p-2 text-right text-[#581845]">{standing.points}</td>
                  <td className="p-2 text-right text-[#581845]">{standing.matches_played}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
