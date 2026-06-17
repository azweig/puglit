"use client";

import { useEffect, useState } from 'react';

interface Item {
  id: number;
  title: string;
  description: string;
  image_url: string;
}

export default function Descubrir() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/feed');
        if (!response.ok) throw new Error('Failed to fetch items');
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchItems();
  }, []);

  const handleSwipe = async (itemId: number, liked: boolean) => {
    try {
      const response = await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, liked }),
      });
      if (!response.ok) throw new Error('Failed to register swipe');
      // Optionally handle successful swipe
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className='p-4 bg-[#FFFFFF] min-h-screen'>
      <h1 className='font-bold text-2xl text-[#4A4A4A] mb-4'>Descubrir</h1>
      {error ? (
        <p className='text-red-500'>{error}</p>
      ) : (
        <div className='flex flex-col items-center'>
          {items.length === 0 ? (
            <p className='text-[#4A4A4A] font-medium text-base'>No hay objetos para mostrar.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className='bg-[#F5A623] shadow-lg rounded-lg p-4 mb-4 transition-transform transform hover:scale-105 w-full max-w-sm'>
                <img
                  src={item.image_url || '/placeholder.png'}
                  alt={item.title || 'Imagen no disponible'}
                  className='w-full h-48 object-cover rounded-lg'
                />
                <h2 className='font-bold text-2xl text-[#4A4A4A] mt-2'>{item.title || 'Sin título'}</h2>
                <p className='font-medium text-base text-[#4A4A4A]'>{item.description || 'Descripción no disponible'}</p>
                <div className='flex justify-between mt-4'>
                  <button
                    className='bg-[#FF6F61] text-[#FFFFFF] font-bold py-2 px-4 rounded-full transition-colors hover:bg-opacity-90'
                    onClick={() => handleSwipe(item.id, true)}
                  >
                    Me gusta
                  </button>
                  <button
                    className='bg-[#4A90E2] text-[#FFFFFF] font-medium py-2 px-4 rounded-full transition-colors hover:bg-opacity-90'
                    onClick={() => handleSwipe(item.id, false)}
                  >
                    No me gusta
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}