"use client";

import { useState, useEffect } from 'react';

interface Match {
  id: string;
  user_a: string;
  user_b: string;
  item: {
    title: string;
    image: string;
  };
}

function Page() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((data) => {
        setMatches(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar los matches.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className='text-center text-[#333333] mt-8'>Cargando matches...</div>;
  }

  if (error) {
    return <div className='text-center text-[#900C3F] mt-8'>{error}</div>;
  }

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <h1 className="text-[#333333] font-bold text-2xl text-center mt-4">Mis Matches</h1>
      <div className="grid grid-cols-2 gap-4 p-4">
        {matches.length === 0 ? (
          <div className="col-span-2 text-center text-gray-500">No tienes matches todavía.</div>
        ) : (
          matches.map((match) => (
            <div key={match.id} className="bg-white rounded-3xl shadow-lg overflow-hidden border-[#FF5733]">
              <img src={match.item.image} alt={match.item.title} className="w-full h-32 object-cover" />
              <div className="p-4">
                <h2 className="text-lg font-bold text-[#333333]">{match.item.title}</h2>
                <a
                  href={`/app/chat/${match.id}`}
                  className="bg-[#FF5733] text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-[#e04c30] transition-colors block text-center mt-2"
                >
                  Chatear
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Page;
