"use client";
// File: app/matches/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch("/api/matches");
        if (!response.ok) throw new Error("Failed to fetch matches");
        const data = await response.json();
        const normalizedData = Array.isArray(data) ? data : [];
        setMatches(normalizedData);
      } catch (err: any) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div className="bg-[#F5F7FA] min-h-screen p-4">
      <h1 className="text-2xl font-bold text-[#4A4A4A] mb-4">Mis Matches</h1>
      {loading && <p className="text-gray-600">Cargando...</p>}
      {error && <p className="text-[#D0021B]">Error: {error}</p>}
      {!loading && !error && matches.length === 0 && (
        <p className="text-gray-600">No tienes matches aún. ¡Sigue explorando!</p>
      )}
      <div className="space-y-4">
        {matches.map((match) => (
          <div
            key={match.id}
            className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <img
              src={match.item.image_url || "/placeholder.png"}
              alt={match.item.title}
              className="w-full h-48 object-cover rounded-lg mb-2"
            />
            <h2 className="text-xl font-semibold text-[#4A4A4A]">
              {match.item.title}
            </h2>
            <p className="text-gray-600">{match.item.description}</p>
            <Link href={`/chat/${match.id}`}>
              <button className="bg-[#FF6F61] text-white py-2 px-4 rounded-full mt-2 hover:bg-[#e65c52] transition-bg">
                Chatear
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
