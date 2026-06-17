"use client";

import { useEffect, useState } from 'react';

interface Item {
  id: string;
  image_url: string;
  title: string;
  description: string;
}

export default function DiscoverPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/feed');
        if (!response.ok) throw new Error('Error fetching items');
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

  const handleSwipe = async (itemId: string, liked: boolean) => {
    try {
      const response = await fetch('/api/swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, liked }),
      });
      if (!response.ok) throw new Error('Error swiping item');
      setItems((prevItems) => prevItems.filter(item => item.id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className='p-4'>Cargando...</div>;
  if (error) return <div className='p-4 text-red-500'>Error: {error}</div>;

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Descubrir</h1>
      <div className='mt-4'>
        {items.length === 0 ? (
          <p>No hay artículos disponibles.</p>
        ) : (
          items.map(item => (
            <div key={item.id} className='mb-4'>
              <img src={item.image_url} alt={item.title} className='w-full h-48 object-cover'/>
              <h2 className='text-lg'>{item.title}</h2>
              <p>{item.description}</p>
              <button onClick={() => handleSwipe(item.id, true)} className='bg-green-500 text-white p-2 rounded'>Me gusta</button>
              <button onClick={() => handleSwipe(item.id, false)} className='bg-red-500 text-white p-2 rounded ml-2'>No me gusta</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
