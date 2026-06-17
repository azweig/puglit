"use client";

import { useEffect, useState } from "react";

const MatchesPage = () => {
  const [matches, setMatches] = useState<{ id: string; item_a_id: string; item_b_id: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("/api/matches");
        if (!res.ok) throw new Error("Failed to fetch matches");
        const data = await res.json();
        setMatches(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold text-center mb-4" style={{ color: 'var(--brand)' }}>Mis Matches</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : matches.length === 0 ? (
        <p>No matches found.</p>
      ) : (
        <ul className="w-full max-w-md">
          {matches.map((match) => (
            <li key={match.id} className="border-b border-gray-200 py-2">
              {match.item_a_id} - {match.item_b_id}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MatchesPage;
