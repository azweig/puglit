"use client";
import { useEffect, useState } from 'react';

interface Match {
  id: string;
  team_home: string;
  team_away: string;
  score_home: number;
  score_away: number;
  image_url?: string;
}

export default function LiveMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch('/api/live-matches');
        if (!response.ok) throw new Error('Failed to fetch matches');
        const data = await response.json();
        setMatches(data.matches ?? []);
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };
    fetchMatches();
    const interval = setInterval(fetchMatches, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-[#000000] mb-6">Partidos en Vivo</h1>
      <div className="w-full max-w-md">
        {matches.length === 0 ? (
          <p className="text-center text-[#CCCCCC]">No hay partidos en vivo en este momento.</p>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="rounded-3xl shadow-md bg-[#CCCCCC] p-6 mb-4 transform hover:scale-105 transition-all duration-200 ease-in-out"
              style={{ backgroundImage: `url(${match.image_url ?? ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <div className="bg-gradient-to-t from-black to-transparent p-4 rounded-3xl">
                <h2 className="text-lg font-bold text-[#FFFFFF]">
                  {match.team_home} vs {match.team_away}
                </h2>
                <p className="text-md text-[#FFFFFF]">
                  {match.score_home} : {match.score_away}
                </p>
              </div>
              <div className="flex justify-around mt-4">
                <button className="bg-[#FF0000] text-[#FFFFFF] rounded-full py-2 px-6 transition-all duration-200 ease-in-out hover:bg-opacity-80">
                  Like
                </button>
                <button className="bg-[#FFFFFF] text-[#FF0000] border-2 border-[#FF0000] rounded-full py-2 px-6 transition-all duration-200 ease-in-out hover:bg-[#FF0000] hover:text-[#FFFFFF]">
                  Pass
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
