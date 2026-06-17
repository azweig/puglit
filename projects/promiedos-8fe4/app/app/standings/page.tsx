"use client";

import { useEffect, useState } from 'react';

interface Standing {
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
}

export default function Standings() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const res = await fetch('/api/standings?tournament_id=1');
        if (!res.ok) throw new Error('Failed to fetch standings');
        const data = await res.json();
        setStandings(data.standings ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  return (
    <div className="p-4 bg-[#FFFFFF]">
      <h1 className="text-2xl font-bold mb-4">Tabla de Posiciones</h1>
      {loading && <p className="text-[#808080]">Cargando...</p>}
      {error && <p className="text-[#FF4500]">Error: {error}</p>}
      {!loading && !error && (
        <table className="w-full text-left bg-[#F0F0F0] rounded-lg shadow-md">
          <thead>
            <tr className="border-b border-[#C0C0C0]">
              <th className="p-2">Equipo</th>
              <th className="p-2">Jugados</th>
              <th className="p-2">Ganados</th>
              <th className="p-2">Empatados</th>
              <th className="p-2">Perdidos</th>
              <th className="p-2">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => (
              <tr key={standing.team_name} className={`border-b border-[#C0C0C0] ${index % 2 === 0 ? 'bg-[#E0E0E0]' : 'bg-[#F0F0F0]'}`}>
                <td className="p-2">{standing.team_name}</td>
                <td className="p-2">{standing.played}</td>
                <td className="p-2">{standing.won}</td>
                <td className="p-2">{standing.drawn}</td>
                <td className="p-2">{standing.lost}</td>
                <td className="p-2">{standing.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
