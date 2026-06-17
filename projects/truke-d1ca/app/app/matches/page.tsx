"use client";

import { useState, useEffect } from 'react';

interface Match {
  id: string;
  user_b: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
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
    }

    fetchMatches();
  }, []);

  if (loading) {
    return <div className='flex flex-col items-center'><p>Loading...</p></div>;
  }

  if (error) {
    return <div className='flex flex-col items-center'><p className='text-red-500'>{error}</p></div>;
  }

  return (
    <div className='flex flex-col items-center'>
      <h1 className='text-2xl font-bold'>Mis Matches</h1>
      <div className='mt-4'>
        {matches.length === 0 ? (
          <p>No tienes matches aún.</p>
        ) : (
          matches.map(match => (
            <div key={match.id} className='border p-4 mb-4'>
              <p>Match con el usuario {match.user_b}</p>
              <button 
                onClick={() => window.location.href=`/app/chat/${match.id}`} 
                className='bg-blue-500 text-white px-4 py-2 mt-2'>
                Chatear
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
