"use client";

import { useState, useEffect } from 'react';

type Item = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
};

export default function DiscoverPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await fetch('/api/feed');
        if (!response.ok) {
          throw new Error('Failed to fetch feed');
        }
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const swipe = async (itemId: number, liked: boolean) => {
    try {
      const response = await fetch('/api/swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, liked }),
      });

      if (!response.ok) {
        throw new Error('Failed to record swipe');
      }

      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return <div className='flex justify-center items-center h-screen'>Loading...</div>;
  }

  if (error) {
    return <div className='flex justify-center items-center h-screen text-red-500'>{error}</div>;
  }

  return (
    <div className='flex flex-col items-center p-4'>
      <h1 className='text-2xl font-bold'>Descubrir</h1>
      <div className='mt-4 w-full max-w-md'>
        {items.length === 0 ? (
          <p className='text-center'>No more items to discover.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className='border p-4 mb-4 rounded shadow'>
              <img src={item.imageUrl} alt={item.title} className='w-full h-48 object-cover rounded'/>
              <h2 className='text-xl mt-2'>{item.title}</h2>
              <p className='mt-1'>{item.description}</p>
              <div className='flex justify-between mt-2'>
                <button 
                  onClick={() => swipe(item.id, true)} 
                  className='bg-green-500 text-white px-4 py-2 rounded'>
                  Me gusta
                </button>
                <button 
                  onClick={() => swipe(item.id, false)} 
                  className='bg-red-500 text-white px-4 py-2 rounded'>
                  No me gusta
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
