"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { NextRequest, NextResponse } from "next/server";

use client;

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const response = await fetch("/api/matches");
        if (!response.ok) throw new Error("Failed to fetch matches.");
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setMatches(list);
      } catch (err: any) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  return (
    <div className="bg-[#F5F7FA] min-h-screen p-4">
      <header className="text-2xl font-bold text-[#4A4A4A] mb-4">Mis Matches</header>
      {loading && <p className="text-gray-600">Cargando...</p>}
      {error && <p className="text-[#D0021B]">{error}</p>}
      <div className="flex flex-col space-y-4">
        {matches.length === 0 && !loading && (
          <p className="text-gray-600">No tienes matches aún.</p>
        )}
        {matches.map((match) => (
          <div key={match.id} className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <img
                src={match.item.image_url || "/placeholder.png"}
                alt={match.item.title}
                className="w-16 h-16 rounded-full mr-4 object-cover"
              />
              <div>
                <h2 className="text-xl font-semibold text-[#4A4A4A]">{match.item.title}</h2>
                <p className="text-gray-600">{match.item.description}</p>
                <Link href={`/chat/${match.id}`} className="text-[#FF6F61] underline">
                  Chat
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      <nav className="fixed bottom-4 left-0 right-0 flex justify-center">
        <Link href="/" className="bg-[#FF6F61] text-white py-2 px-4 rounded-full mx-2 hover:bg-[#e65c52] transition-bg">
          Inicio
        </Link>
        <Link href="/publicar" className="bg-[#FF6F61] text-white py-2 px-4 rounded-full mx-2 hover:bg-[#e65c52] transition-bg">
          Publicar
        </Link>
        <Link href="/matches" className="bg-[#FF6F61] text-white py-2 px-4 rounded-full mx-2 hover:bg-[#e65c52] transition-bg">
          Matches
        </Link>
      </nav>
    </div>
  );
}
