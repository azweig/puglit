"use client";

import { useState, useEffect } from 'react';

function Page() {
  const [items, setItems] = useState<{ id: string; image_url: string; title: string; description: string; }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('/api/feed')
      .then(res => res.json())
      .then(data => setItems(data));
  }, []);

  const handleSwipe = (itemId: string, liked: boolean) => {
    fetch('/api/swipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, liked })
    });
    setCurrentIndex(prevIndex => prevIndex + 1);
  };

  if (items.length === 0) {
    return <div className="text-center mt-20 font-medium text-gray-500">Cargando...</div>;
  }

  if (currentIndex >= items.length) {
    return <div className="text-center mt-20 font-medium text-gray-500">No hay más items por descubrir.</div>;
  }

  const currentItem = items[currentIndex];

  return (
    <div className="relative h-screen w-full bg-[#F5F5F5] flex justify-center items-center">
      <div className="absolute w-full h-full max-w-sm bg-white rounded-3xl shadow-lg overflow-hidden">
        <img src={currentItem.image_url} alt={currentItem.title} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#FF5733] to-transparent p-4">
          <h2 className="text-white font-bold text-2xl mb-1">{currentItem.title}</h2>
          <p className="text-white font-medium text-base">{currentItem.description}</p>
        </div>
      </div>
      <div className="fixed bottom-16 left-1/4 right-1/4 flex justify-between">
        <button onClick={() => handleSwipe(currentItem.id, false)} className="bg-[#900C3F] text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-[#7f0834] transition-colors">No me gusta</button>
        <button onClick={() => handleSwipe(currentItem.id, true)} className="bg-[#FF5733] text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-[#e04c30] transition-colors">Me gusta</button>
      </div>
    </div>
  );
}

export default Page;
