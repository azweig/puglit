"use client";

import { useEffect, useState } from 'react';

interface Match {
  id: string;
  user_a: string;
  user_b: string;
}

const userId = 'currentUserId'; // Replace with actual user ID logic

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch('/api/matches');
        if (!response.ok) throw new Error('Failed to fetch matches');
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
    window.location.href = `/app/chat/${matchId}`;
  };

  if (loading) return <div className="text-center text-gray-500">Cargando...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;
  if (matches.length === 0) return <div className="text-center text-gray-500">No tienes matches aún.</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Mis Matches</h1>
      <div className="space-y-4">
        {matches.map(match => (
          <div key={match.id} className="p-4 border rounded shadow-sm">
            <h2 className="text-lg font-semibold">
              Match con {match.user_b === userId ? match.user_a : match.user_b}
            </h2>
            <button 
              onClick={() => navigateToChat(match.id)}
              className="mt-2 px-4 py-2 bg-[var(--brand)] text-white rounded"
            >
              Chatear
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
