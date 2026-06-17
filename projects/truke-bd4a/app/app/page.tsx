"use client";

import { useEffect, useState } from "react";

interface Item {
  id: number;
  image_url: string;
  title: string;
}

export default function Descubrir() {
  const [items, setItems] = useState<Item[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch("/api/feed")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  const swipe = (itemId: number, liked: boolean) => {
    fetch("/api/swipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemId, liked }),
    });

    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  const currentItem = items[currentIndex];

  return (
    <div className="bg-[#F7F7F7] min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-2xl font-bold text-[#333333] mb-4">Descubrir</h1>
      {currentItem ? (
        <div className="bg-white shadow-lg rounded-lg p-4 w-full max-w-md">
          <img
            src={currentItem.image_url ?? "/placeholder.png"}
            alt={currentItem.title ?? "Sin título"}
            className="w-full h-64 object-cover rounded-t-lg"
          />
          <h2 className="text-lg font-bold text-[#333333] mt-2">
            {currentItem.title ?? "Sin título"}
          </h2>
          <div className="flex justify-around mt-4">
            <button
              onClick={() => swipe(currentItem.id, true)}
              className="bg-[#FF6F61] text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out hover:scale-105"
            >
              Me gusta
            </button>
            <button
              onClick={() => swipe(currentItem.id, false)}
              className="bg-transparent border border-[#FF6F61] text-[#FF6F61] font-medium py-2 px-4 rounded-full transition duration-300 ease-in-out hover:scale-105"
            >
              No me gusta
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-[#333333] mt-4">No hay más items para mostrar.</div>
      )}
    </div>
  );
}
