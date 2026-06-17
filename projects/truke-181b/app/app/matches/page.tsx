"use client";

import { useEffect, useState } from 'react';

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
        const res = await fetch('/api/matches');
        if (!res.ok) {
          throw new Error('Failed to fetch matches');
        }
        const data = await res.json();
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

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Matches</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div>
        {matches.length === 0 && !loading && <p>No matches found.</p>}
        {matches.map((match) => (
          <div key={match.id} className="border p-2 mb-2">
            <h2 className="font-semibold">Match con {match.user_b}</h2>
            <button
              className="bg-[var(--brand)] text-white py-1 px-4 mt-2 rounded"
              onClick={() => navigateToChat(match.id)}
            >
              Chatear
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchesPage;
