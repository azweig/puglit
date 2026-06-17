"use client";

import { useEffect, useState } from "react";

interface Item {
  id: string;
  image_url: string;
  title: string;
}

export default function Descubrir() {
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

  const handleSwipe = async (itemId: string, liked: boolean) => {
    try {
      await fetch("/api/swipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, liked }),
      });
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("Failed to record swipe.", err);
    }
  };

  if (loading) return <div className="text-center mt-4">Cargando...</div>;
  if (error) return <div className="text-center mt-4 text-red-500">{error}</div>;
  if (items.length === 0) return <div className="text-center mt-4">No hay más elementos para mostrar.</div>;

  return (
    <div className="p-4">
      {items.map((item) => (
        <div key={item.id} className="mb-4 border-b pb-4">
          <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover mb-2" />
          <h2 className="text-lg font-bold mb-2">{item.title}</h2>
          <div className="flex justify-between">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={() => handleSwipe(item.id, true)}
            >
              Me gusta
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={() => handleSwipe(item.id, false)}
            >
              No me gusta
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
