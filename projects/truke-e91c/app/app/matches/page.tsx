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
        if (!response.ok) throw new Error('Failed to fetch matches');
        const data = await response.json();
        setMatches(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) return <div className='p-4'>Loading...</div>;
  if (error) return <div className='p-4 text-red-500'>Error: {error}</div>;
  if (matches.length === 0) return <div className='p-4'>No matches found.</div>;

  return (
    <div className='p-4'>
      <h1 className='text-lg font-bold'>Matches</h1>
      {matches.map(match => (
        <div key={match.id} className='p-4 border-b border-gray-300'>
          <h2 className='text-md'>Match con {match.user_b}</h2>
          <button 
            className='mt-2 px-4 py-2 bg-[var(--brand)] text-white rounded'
            onClick={() => window.location.href=`/app/chat/${match.id}`}
          >
            Chatear
          </button>
        </div>
      ))}
    </div>
  );
}