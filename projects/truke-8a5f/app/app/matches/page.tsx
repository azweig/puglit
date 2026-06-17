"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Match {
  id: number;
  other_user_id: number;
  item: {
    id: number;
    owner_id: number;
    title: string;
    description: string;
    image_url: string;
    city: string;
    status: string;
    created_at: string;
  };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then((data: Match[]) => setMatches(data))
      .catch(() => setMatches([]));
  }, []);

  return (
    <div className="p-4 bg-[#FFFFFF] min-h-screen">
      <h1 className="font-bold text-2xl text-[#4A4A4A] mb-4">Mis Matches</h1>
      <div className="grid gap-4">
        {matches.length === 0 ? (
          <p className="text-center text-[#4A4A4A]">No tienes matches aún.</p>
        ) : (
          matches.map(match => (
            <div key={match.id} className="bg-[#F5A623] shadow-lg rounded-lg p-4 mb-4 transition-transform transform hover:scale-105">
              <img
                src={match.item?.image_url ?? "/placeholder.png"}
                alt={match.item?.title ?? "Sin título"}
                className="w-full h-40 object-cover rounded-lg mb-2"
              />
              <h2 className="font-bold text-xl text-[#4A4A4A]">{match.item?.title ?? "Sin título"}</h2>
              <p className="font-medium text-base text-[#4A4A4A]">{match.item?.description ?? "Sin descripción"}</p>
              <Link href={`/app/chat/${match.id}`} className="bg-[#FF6F61] text-[#FFFFFF] font-bold py-2 px-4 rounded-full transition-colors hover:bg-opacity-90 mt-2 inline-block text-center">
                Chatear
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}