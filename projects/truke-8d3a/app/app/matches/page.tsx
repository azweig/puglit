"use client";

import { useState, useEffect } from 'react';

interface Match {
  id: string;
  user_b: string;
}

const MatchesPage = () => {
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
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  if (matches.length === 0) {
    return <div className="text-center text-gray-500">No tienes matches aún.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--brand)' }}>Matches</h1>
      {matches.map((match) => (
        <div key={match.id} className="mb-4 p-4 border rounded shadow-sm">
          <h2 className="text-lg font-semibold">Match con {match.user_b}</h2>
          <button
            className="mt-2 bg-blue-500 text-white py-1 px-4 rounded"
            onClick={() => window.location.href = `/app/chat/${match.id}`}
          >
            Chatear
          </button>
        </div>
      ))}
    </div>
  );
};

export default MatchesPage;