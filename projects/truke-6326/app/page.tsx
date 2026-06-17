"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Item {
  id: number;
  title: string;
  description: string;
  image_url: string;
  condition: string;
}

const HomePage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/feed");
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setItems(list);
      } catch (error: any) {
        console.error("Error fetching items:", error);
      }
    };

    fetchItems();
  }, []);

  const handleSwipe = async (liked: boolean) => {
    if (currentIndex >= items.length) return;

    const item = items[currentIndex];
    try {
      await fetch("/api/swipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item_id: item.id, liked }),
      });
      setCurrentIndex((prevIndex) => prevIndex + 1);
    } catch (error: any) {
      console.error("Error swiping item:", error);
    }
  };

  const currentItem = items[currentIndex];

  return (
    <div className="bg-[#F5F7FA] min-h-screen flex flex-col items-center">
      <header className="w-full flex justify-between p-4">
        <Link href="/publicar" className="text-[#FF6F61] font-bold">Publicar</Link>
        <Link href="/matches" className="text-[#FF6F61] font-bold">Matches</Link>
      </header>
      <main className="flex-1 flex justify-center items-center">
        {currentItem ? (
          <div className="bg-white shadow-md rounded-lg p-4 mb-4 w-80">
            <img
              src={currentItem.image_url || "/placeholder.png"}
              alt={currentItem.title}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <h2 className="text-2xl font-bold text-[#4A4A4A] mt-2">{currentItem.title}</h2>
            <p className="text-base font-medium text-gray-600">{currentItem.description}</p>
            <div className="flex justify-between mt-4">
              <button
                className="bg-[#FF6F61] text-white py-2 px-4 rounded-full hover:bg-[#e65c52] transition-bg transform hover:scale-105"
                onClick={() => handleSwipe(true)}
              >
                Me gusta
              </button>
              <button
                className="border-2 border-[#4A90E2] text-[#4A90E2] py-2 px-4 rounded-full hover:bg-[#e3f4ff] transition-bg transform hover:scale-105"
                onClick={() => handleSwipe(false)}
              >
                Pasar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xl font-medium text-[#4A4A4A]">No hay más items para mostrar.</p>
        )}
      </main>
      <Link
        href="/publicar"
        className="fixed bottom-4 bg-[#FF6F61] text-white py-3 px-6 rounded-full shadow-lg hover:bg-[#e65c52] transition-bg transform hover:scale-105"
      >
        + Publicar
      </Link>
    </div>
  );
};

export default HomePage;
