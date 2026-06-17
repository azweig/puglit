"use client";

import { useEffect, useState } from "react";

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
        const response = await fetch("/api/matches");
        if (!response.ok) {
          throw new Error("Failed to fetch matches");
        }
        const data = await response.json();
        setMatches(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  if (matches.length === 0) {
    return <div className="text-center text-gray-500">No hay matches todavía.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Matches</h1>
      <div className="space-y-4">
        {matches.map((match) => (
          <div
            key={match.id}
            className="p-4 bg-white shadow rounded-lg flex justify-between items-center"
          >
            <h2 className="text-lg font-semibold">Match con {match.user_b}</h2>
            <button
              className="bg-[var(--brand)] text-white py-2 px-4 rounded"
              onClick={() => (window.location.href = `/app/chat/${match.id}`)}
            >
              Chatear
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
