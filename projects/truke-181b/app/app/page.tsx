"use client";

import { useEffect, useState } from 'react';

interface Item {
  id: string;
  image_url: string;
  title: string;
  description: string;
}

export default function Descubrir() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('/api/feed');
        if (!res.ok) throw new Error('Failed to fetch items');
        const data = await res.json();
        setItems(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
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
        body: JSON.stringify({ itemId, liked }),
      });
      if (!res.ok) throw new Error('Failed to record swipe');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className='p-4'>Loading...</div>;
  if (error) return <div className='p-4 text-red-500'>Error: {error}</div>;

  return (
    <div className='p-4'>
      <h1 className='text-xl mb-4'>Descubrir</h1>
      <div>
        {items.length === 0 ? (
          <p>No hay más elementos para mostrar.</p>
        ) : (
          items.map(item => (
            <div key={item.id} className='border p-2 mb-4'>
              <img src={item.image_url} alt={item.title} className='w-full' />
              <h2 className='text-lg'>{item.title}</h2>
              <p>{item.description}</p>
              <div className='flex space-x-2 mt-2'>
                <button 
                  onClick={() => handleSwipe(item.id, true)} 
                  className='bg-green-500 text-white px-4 py-2 rounded'>
                  Me gusta
                </button>
                <button 
                  onClick={() => handleSwipe(item.id, false)} 
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
