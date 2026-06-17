"use client";

import { useEffect, useState } from "react";
import { NextPage } from "next";
import Link from "next/link";

interface Standings {
  id: number;
  tournament_id: number;
  team_name: string;
  points: number;
  matches_played: number;
}

const UpdateStandings: NextPage = () => {
  const [standings, setStandings] = useState<Standings[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const response = await fetch("/api/standings");
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.items ?? [];
        setStandings(list);
      } catch (err: any) {
        setError("Failed to load standings.");
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  const handleInputChange = (id: number, field: keyof Standings, value: string) => {
    setStandings((prevStandings) =>
      prevStandings.map((standing) =>
        standing.id === id ? { ...standing, [field]: parseInt(value, 10) } : standing
      )
    );
  };

  const updateStandings = async () => {
    try {
      const response = await fetch("/api/standings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(standings),
      });

      if (!response.ok) {
        throw new Error("Failed to update standings");
      }
      alert("Standings updated successfully!");
    } catch (err: any) {
      alert("Error updating standings.");
    }
  };

  if (loading) return <div className="text-[#FFFFFF]">Loading...</div>;
  if (error) return <div className="text-[#FF5733]">{error}</div>;

  return (
    <div className="min-h-screen bg-[#581845] p-4">
      <header className="sticky top-0 bg-[#FFC300] p-4 shadow-md">
        <nav className="flex justify-between">
          <Link href="/" className="text-[#900C3F] font-bold">Inicio</Link>
          <Link href="/tournaments" className="text-[#900C3F] font-bold">Torneos</Link>
        </nav>
      </header>
      <main className="mt-4">
        <h1 className="text-3xl font-bold text-[#FFFFFF] mb-4">Update Standings</h1>
        <table className="w-full bg-[#FFC300] text-[#581845]">
          <thead>
            <tr>
              <th className="p-2">Team</th>
              <th className="p-2">Points</th>
              <th className="p-2">Matches Played</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => (
              <tr key={standing.id} className="border-b border-[#900C3F]">
                <td className="p-2">{standing.team_name}</td>
                <td className="p-2">
                  <input
                    type="number"
                    className="w-full bg-transparent border-b-2 border-[#900C3F] focus:border-[#FF5733] text-[#FFFFFF]"
                    value={standing.points}
                    onChange={(e) => handleInputChange(standing.id, "points", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    className="w-full bg-transparent border-b-2 border-[#900C3F] focus:border-[#FF5733] text-[#FFFFFF]"
                    value={standing.matches_played}
                    onChange={(e) => handleInputChange(standing.id, "matches_played", e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={updateStandings}
          className="mt-4 bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors"
        >
          Save Changes
        </button>
      </main>
    </div>
  );
};

export default UpdateStandings;
