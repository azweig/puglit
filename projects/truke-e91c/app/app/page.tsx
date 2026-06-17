"use client";

import { useEffect, useState } from "react";

type Item = {
  id: number;
  title: string;
  description: string;
  image_url: string;
};

export default function DiscoverPage() {
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
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleSwipe = async (itemId: number, liked: boolean) => {
    try {
      const response = await fetch("/api/swipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item_id: itemId, liked }),
      });

      if (!response.ok) {
        throw new Error("Failed to register swipe.");
      }

      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error((err as Error).message);
    }
  };

  if (loading) {
    return <div className="text-center">Cargando...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (items.length === 0) {
    return <div className="text-center">No hay más items para mostrar.</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-lg font-bold mb-4">Descubrir</h1>
      {items.map((item) => (
        <div key={item.id} className="p-4 border-b">
          <img src={item.image_url} alt={item.title} className="w-full mb-2" />
          <h2 className="text-md font-semibold mb-1">{item.title}</h2>
          <p className="mb-2">{item.description}</p>
          <div className="flex space-x-2">
            <button
              onClick={() => handleSwipe(item.id, true)}
              className="bg-green-500 text-white py-1 px-4 rounded"
            >
              Me gusta
            </button>
            <button
              onClick={() => handleSwipe(item.id, false)}
              className="bg-red-500 text-white py-1 px-4 rounded"
            >
              No me gusta
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
