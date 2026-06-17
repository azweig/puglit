"use client";

import { useState, useEffect } from "react";

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
    fetch("/api/matches")
      .then((res) => res.json())
      .then((data) => setMatches(data))
      .catch(() => setMatches([]));
  }, []);

  return (
    <div className="bg-[#F4F4F4] min-h-screen p-4">
      <h1 className="text-2xl font-bold text-[#333333] mb-4">Matches</h1>
      <div className="grid grid-cols-1 gap-4">
        {matches.length > 0 ? (
          matches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-3xl shadow-lg p-4 flex items-center"
            >
              <img
                src={match.item?.image_url ?? "/placeholder.png"}
                alt={match.item?.title ?? "Sin título"}
                className="w-20 h-20 object-cover rounded-full mr-4"
              />
              <div>
                <h2 className="font-bold text-[#333333]">
                  {match.item?.title ?? "Sin título"}
                </h2>
                <p className="text-sm text-[#7BAAF7]">
                  {match.item?.description ?? "No description available."}
                </p>
                <a
                  href={`/app/matches/${match.id}`}
                  className="bg-[#FF6F61] text-white rounded-full px-4 py-2 shadow hover:bg-[#FF9E80] transition-colors duration-200 mt-2 inline-block"
                >
                  Chat
                </a>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[#333333] font-medium">No matches found. Explore more items!</p>
        )}
      </div>
    </div>
  );
}
