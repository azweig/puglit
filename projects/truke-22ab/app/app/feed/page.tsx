"use client";

import { useEffect, useState } from "react";

interface Item {
  id: string;
  title: string;
  description: string;
  image: string;
}

export default function Feed() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/feed");
        if (!response.ok) {
          throw new Error("Failed to fetch items.");
        }
        const data = await response.json();
        setItems(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--brand)' }}>Feed</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="border p-4 rounded shadow">
            <img src={item.image} alt={item.title} className="w-full h-48 object-cover mb-2" />
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>
      {items.length === 0 && !loading && !error && <p>No more items to display.</p>}
    </div>
  );
}
