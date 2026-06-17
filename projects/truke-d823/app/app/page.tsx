"use client";

import { useEffect, useState } from 'react';

interface Item {
  id: string;
  image_url: string;
  title: string;
}

const DescubrirPage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('/api/feed');
        if (!res.ok) throw new Error('Failed to fetch feed');
        const data = await res.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleSwipe = async (itemId: string, liked: boolean) => {
    try {
      const res = await fetch('/api/swipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: itemId, liked }),
      });
      if (!res.ok) throw new Error('Failed to record swipe');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen">Error: {error}</div>;

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl mb-4" style={{ color: 'var(--brand)' }}>Descubrir</h1>
      <div className="flex flex-wrap justify-center">
        {items.length === 0 ? (
          <div>No items to display</div>
        ) : (
          items.map(item => (
            <div key={item.id} className="m-2 p-2 border rounded shadow-md">
              <img src={item.image_url} alt={item.title} className="w-32 h-32 object-cover mb-2" />
              <h2 className="text-center mb-2">{item.title}</h2>
              <div className="flex justify-between">
                <button 
                  onClick={() => handleSwipe(item.id, true)} 
                  className="bg-green-500 text-white p-2 rounded">
                  Me gusta
                </button>
                <button 
                  onClick={() => handleSwipe(item.id, false)} 
                  className="bg-red-500 text-white p-2 rounded">
                  No me gusta
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DescubrirPage;
