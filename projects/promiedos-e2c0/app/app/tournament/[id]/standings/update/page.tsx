"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface TeamStanding {
  teamId: string;
  teamName: string;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

const UpdateStandingsPage = () => {
  const { id: tournamentId } = useParams<{ id: string }>();
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const response = await fetch(`/api/standings?tournamentId=${tournamentId}`);
        if (!response.ok) throw new Error("Failed to fetch standings.");
        const data = await response.json();
        setStandings(data.standings ?? []);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStandings();
  }, [tournamentId]);

  const handleInputChange = (index: number, field: keyof TeamStanding, value: string) => {
    const updatedStandings = [...standings];
    updatedStandings[index][field] = parseInt(value, 10) || 0;
    setStandings(updatedStandings);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/standings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tournamentId, standings }),
      });
      if (!response.ok) throw new Error("Failed to update standings.");
      alert("Standings updated successfully!");
    } catch (error) {
      alert((error as Error).message);
    }
  };

  if (isLoading) return <div className="text-[#FFFFFF]">Loading standings...</div>;
  if (error) return <div className="text-[#FF5733]">Error: {error}</div>;

  return (
    <div className="bg-[#581845] min-h-screen p-4">
      <div className="fixed top-0 left-0 right-0 bg-[#C70039] p-4 shadow-md">
        <nav className="flex justify-between">
          <Link href="/" className="text-[#FFFFFF] font-bold">Inicio</Link>
          <Link href="/tournaments" className="text-[#FFFFFF] font-bold">Torneos</Link>
        </nav>
      </div>
      <div className="mt-16">
        <h1 className="text-3xl font-bold text-[#FFFFFF] mb-4">Update Standings</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-[#C70039] text-[#FFFFFF]">
            <thead>
              <tr>
                <th className="p-2 border-b border-[#900C3F]">Team</th>
                <th className="p-2 border-b border-[#900C3F]">Points</th>
                <th className="p-2 border-b border-[#900C3F]">Played</th>
                <th className="p-2 border-b border-[#900C3F]">Wins</th>
                <th className="p-2 border-b border-[#900C3F]">Draws</th>
                <th className="p-2 border-b border-[#900C3F]">Losses</th>
                <th className="p-2 border-b border-[#900C3F]">Goals For</th>
                <th className="p-2 border-b border-[#900C3F]">Goals Against</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <tr key={team.teamId} className="hover:bg-[#FF5733] transition duration-200">
                  <td className="p-2 border-b border-[#900C3F]">{team.teamName}</td>
                  <td className="p-2 border-b border-[#900C3F]">
                    <input
                      type="number"
                      className="w-full bg-transparent border-2 border-[#FFC300] text-[#FFFFFF] p-1 rounded-md focus:outline-none focus:border-[#FF5733]"
                      value={team.points}
                      onChange={(e) => handleInputChange(index, 'points', e.target.value)}
                    />
                  </td>
                  <td className="p-2 border-b border-[#900C3F]">
                    <input
                      type="number"
                      className="w-full bg-transparent border-2 border-[#FFC300] text-[#FFFFFF] p-1 rounded-md focus:outline-none focus:border-[#FF5733]"
                      value={team.matchesPlayed}
                      onChange={(e) => handleInputChange(index, 'matchesPlayed', e.target.value)}
                    />
                  </td>
                  <td className="p-2 border-b border-[#900C3F]">
                    <input
                      type="number"
                      className="w-full bg-transparent border-2 border-[#FFC300] text-[#FFFFFF] p-1 rounded-md focus:outline-none focus:border-[#FF5733]"
                      value={team.wins}
                      onChange={(e) => handleInputChange(index, 'wins', e.target.value)}
                    />
                  </td>
                  <td className="p-2 border-b border-[#900C3F]">
                    <input
                      type="number"
                      className="w-full bg-transparent border-2 border-[#FFC300] text-[#FFFFFF] p-1 rounded-md focus:outline-none focus:border-[#FF5733]"
                      value={team.draws}
                      onChange={(e) => handleInputChange(index, 'draws', e.target.value)}
                    />
                  </td>
                  <td className="p-2 border-b border-[#900C3F]">
                    <input
                      type="number"
                      className="w-full bg-transparent border-2 border-[#FFC300] text-[#FFFFFF] p-1 rounded-md focus:outline-none focus:border-[#FF5733]"
                      value={team.losses}
                      onChange={(e) => handleInputChange(index, 'losses', e.target.value)}
                    />
                  </td>
                  <td className="p-2 border-b border-[#900C3F]">
                    <input
                      type="number"
                      className="w-full bg-transparent border-2 border-[#FFC300] text-[#FFFFFF] p-1 rounded-md focus:outline-none focus:border-[#FF5733]"
                      value={team.goalsFor}
                      onChange={(e) => handleInputChange(index, 'goalsFor', e.target.value)}
                    />
                  </td>
                  <td className="p-2 border-b border-[#900C3F]">
                    <input
                      type="number"
                      className="w-full bg-transparent border-2 border-[#FFC300] text-[#FFFFFF] p-1 rounded-md focus:outline-none focus:border-[#FF5733]"
                      value={team.goalsAgainst}
                      onChange={(e) => handleInputChange(index, 'goalsAgainst', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={handleSubmit}
          className="mt-4 bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#FFC300] transition duration-200"
        >
          Update Standings
        </button>
      </div>
    </div>
  );
};

export default UpdateStandingsPage;
