"use client";

import { useEffect, useState } from "react";

interface Standing {
  id: number;
  tournament_id: number;
  team_name: string;
  points: number;
  matches_played: number;
  goal_difference: number;
}

interface Tournament {
  id: number;
  name: string;
}

export default function StandingsPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStandings() {
      try {
        const response = await fetch("/api/live-football");
        const data = await response.json();
        const normalizedStandings = Array.isArray(data.standings) ? data.standings : [];
        const normalizedTournaments = Array.isArray(data.tournaments) ? data.tournaments : [];
        setStandings(normalizedStandings);
        setTournaments(normalizedTournaments);
      } catch (err: any) {
        setError("Failed to load standings.");
      } finally {
        setLoading(false);
      }
    }

    fetchStandings();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto mt-5">
      <h1 className="font-bold text-2xl text-center mb-4">Tablas de Posiciones</h1>
      {tournaments.map((tournament) => (
        <div key={tournament.id} className="mb-6">
          <h2 className="font-semibold text-xl mb-2 bg-[#FF6347] p-2 rounded-lg text-center text-[#000000]">
            {tournament.name}
          </h2>
          <table className="w-full bg-[#FF7F50] rounded-lg">
            <thead>
              <tr className="text-left">
                <th className="p-2">Equipo</th>
                <th className="p-2">Puntos</th>
                <th className="p-2">Jugados</th>
                <th className="p-2">Diferencia de Gol</th>
              </tr>
            </thead>
            <tbody>
              {standings
                .filter((standing) => standing.tournament_id === tournament.id)
                .sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference)
                .map((standing) => (
                  <tr key={standing.id} className="border-b border-[#FFFFFF]">
                    <td className="p-2 text-[#000000]">{standing.team_name}</td>
                    <td className="p-2 text-[#000000]">{standing.points}</td>
                    <td className="p-2 text-[#000000]">{standing.matches_played}</td>
                    <td className="p-2 text-[#000000]">{standing.goal_difference}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}