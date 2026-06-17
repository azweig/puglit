"use client";

import { useEffect, useState } from 'react';

interface Match {
  id: string;
  item_a: string;
  item_b: string;
}

function MisMatches() {
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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return <div className='p-4'>Loading...</div>;
  }

  if (error) {
    return <div className='p-4 text-red-500'>Error: {error}</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Mis Matches</h1>
      <div>
        {matches.length === 0 ? (
          <p>No matches found.</p>
        ) : (
          matches.map((match) => (
            <div key={match.id} className='border p-2 mb-2'>
              <p>Match con el ítem {match.item_a} y {match.item_b}</p>
              <a href={`/app/chat/${match.id}`} className='bg-blue-500 text-white px-4 py-2'>Chatear</a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MisMatches;
