"use client";

import { useEffect, useState } from 'react';

interface Item {
  id: string;
  title: string;
  description: string;
  image_url: string;
}

function Descubrir() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/feed');
        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }
        const data = await response.json();
        setItems(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleSwipe = async (itemId: string, liked: boolean) => {
    try {
      const response = await fetch('/api/swipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, liked }),
      });

      if (!response.ok) {
        throw new Error('Failed to record swipe');
      }

      const data = await response.json();
      if (data.success) {
        setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (items.length === 0) return <div className="p-4">No items to display.</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Descubrir</h1>
      <div>
        {items.map((item) => (
          <div key={item.id} className="border p-2 mb-2">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-64 object-cover"
            />
            <h2 className="text-lg">{item.title}</h2>
            <p>{item.description}</p>
            <button
              className="bg-blue-500 text-white px-4 py-2 mr-2"
              onClick={() => handleSwipe(item.id, true)}
            >
              Me gusta
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2"
              onClick={() => handleSwipe(item.id, false)}
            >
              No me gusta
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Descubrir;
