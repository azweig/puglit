"use client";

import { useEffect, useState } from 'react';

interface Match {
  id: string;
  user_b: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch('/api/matches');
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }
        const data = await response.json();
        setMatches(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const navigateToChat = (matchId: string) => {
    window.location.href = `/app/matches/${matchId}/chat`;
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Mis Matches</h1>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      <div className="mt-4">
        {matches.length === 0 && !loading && <p>No tienes matches todavía.</p>}
        {matches.map((match) => (
          <div key={match.id} className="mb-4">
            <h2 className="text-lg">Match con {match.user_b}</h2>
            <button
              onClick={() => navigateToChat(match.id)}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Chatear
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
