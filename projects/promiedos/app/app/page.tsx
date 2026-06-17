"use client";
import { useEffect, useState } from 'react';

interface Match {
  id: number;
  teamHome?: string;
  teamAway?: string;
  scoreHome?: number;
  scoreAway?: number;
  image_url?: string;
  time?: string;
}

const Page = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/v1/live-football-data');
        if (!res.ok) throw new Error('Failed to fetch data');
        const json = await res.json();
        setMatches(json.matches ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className='text-center mt-10 text-xl font-bold'>Cargando...</div>;
  if (error) return <div className='text-center mt-10 text-xl font-bold text-red-600'>{error}</div>;

  return (
    <div className='p-4 bg-[#FFFFFF] min-h-screen'>
      <h1 className='text-3xl font-bold text-[#000000]'>Partidos en Vivo</h1>
      <div className='mt-6 space-y-6'>
        {matches.length === 0 ? (
          <div className='text-center text-xl font-medium text-[#333333]'>No hay partidos en vivo actualmente.</div>
        ) : (
          matches.map((match) => (
            <div key={match.id} className='relative rounded-3xl shadow-lg bg-[#FFCC00] overflow-hidden'>
              <img
                src={match.image_url ?? '/placeholder.jpg'}
                alt={`${match.teamHome ?? 'Equipo'} vs ${match.teamAway ?? 'Equipo'}`}
                className='w-full h-48 object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70'></div>
              <div className='absolute bottom-0 left-0 p-4 text-[#FFFFFF]'>
                <div className='text-xl font-bold'>{match.teamHome ?? 'Equipo Local'} vs {match.teamAway ?? 'Equipo Visitante'}</div>
                <div className='text-lg font-medium'>{match.scoreHome ?? 0} - {match.scoreAway ?? 0}</div>
                <div className='text-sm font-normal'>{match.time ?? 'Hora no disponible'}</div>
              </div>
              <div className='absolute bottom-4 left-4'>
                <button className='bg-[#FF0000] text-[#FFFFFF] rounded-full py-2 px-4 font-bold hover:bg-opacity-90 transition-all'>Like</button>
              </div>
              <div className='absolute bottom-4 right-4'>
                <button className='bg-[#000000] text-[#FFFFFF] rounded-full py-2 px-4 font-bold hover:bg-opacity-90 transition-all'>Pass</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Page;
