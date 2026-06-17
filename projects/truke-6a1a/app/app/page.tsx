"use client";

import { useState, useEffect } from "react";

interface Item {
  id: number;
  title: string;
  description: string;
  image_url: string;
}

export default function Descubrir() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch("/api/feed")
      .then((res) => res.json())
      .then((data) => setItems(data));
  }, []);

  function handleSwipe(itemId: number, liked: boolean) {
    fetch("/api/swipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, liked }),
    }).then(() => setItems((prevItems) => prevItems.filter((item) => item.id !== itemId)));
  }

  return (
    <div className="bg-[#F4F4F4] min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-[#333333] mb-4">Descubrir</h1>
      <div className="w-full max-w-md">
        {items.length === 0 ? (
          <div className="text-center text-[#7BAAF7]">No more items to discover!</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl shadow-lg p-4 mb-4 relative overflow-hidden"
            >
              <img
                src={item.image_url || "/placeholder.png"}
                alt={item.title || "Sin título"}
                className="w-full h-64 object-cover rounded-3xl"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <h2 className="text-white text-lg font-bold">{item.title || "Sin título"}</h2>
                <p className="text-white text-sm font-light">
                  {item.description || "No description available."}
                </p>
              </div>
              <div className="flex justify-between mt-2">
                <button
                  onClick={() => handleSwipe(item.id, true)}
                  className="bg-[#FF6F61] text-white rounded-full px-6 py-3 shadow-md hover:bg-[#FF9E80] transition-colors duration-200"
                >
                  Me gusta
                </button>
                <button
                  onClick={() => handleSwipe(item.id, false)}
                  className="bg-[#4A90E2] text-white rounded-full px-4 py-2 shadow hover:bg-[#7BAAF7] transition-colors duration-200"
                >
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
