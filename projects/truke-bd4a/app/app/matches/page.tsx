"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Match {
  id: number;
  other_user_id: number;
  item: {
    id: number;
    title: string;
    description: string;
    image_url: string;
    condition: string;
    owner_id: number;
    created_at: string;
  };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((data) => setMatches(data))
      .catch(() => setMatches([]));
  }, []);

  return (
    <div className="p-4 bg-[#F7F7F7] min-h-screen">
      <h1 className="text-2xl font-bold text-[#333333] mb-4">Matches</h1>
      <div className="space-y-4">
        {matches.length === 0 ? (
          <p className="text-gray-600">No tienes matches todavía.</p>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="bg-white shadow-lg rounded-lg p-4 flex items-center space-x-4"
            >
              <img
                src={match.item?.image_url ?? "/placeholder.png"}
                alt={match.item?.title ?? "Sin título"}
                className="w-16 h-16 object-cover rounded-full"
              />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#333333]">
                  {match.item?.title ?? "Sin título"}
                </h2>
                <p className="text-base font-medium text-gray-600">
                  {match.item?.description ?? "Sin descripción"}
                </p>
              </div>
              <Link href={`/app/chat/${match.id}`} className="bg-transparent border border-[#4A90E2] text-[#4A90E2] font-medium py-2 px-4 rounded-full transition duration-300 ease-in-out hover:scale-105">
                  Chatear
                </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
