"use client";

import { useEffect, useState } from "react";

interface Offer {
  offer_id: string;
  title: string;
  discount_label: string;
  merchant: {
    name: string;
    category: string;
  };
  address: string;
  latitude: number;
  longitude: number;
  program_name: string;
  distance_km: number;
}

export default function Descubrir() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch("/api/nearby");
        if (!response.ok) throw new Error("Failed to fetch offers");
        const data: Offer[] = await response.json();
        setOffers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
    const interval = setInterval(fetchOffers, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-10">
        <nav className="flex justify-between items-center p-4">
          <div className="text-[#900C3F] font-bold text-2xl">Descuentos Perú</div>
          <div className="space-x-4">
            <a href="/app" className="text-[#FF5733]">Descubrir</a>
            <a href="/app/memberships" className="text-[#333333]">Mis Programas</a>
            <a href="/app/location" className="text-[#333333]">Ubicación</a>
          </div>
        </nav>
      </header>

      <main className="pt-16 pb-20 px-4">
        {loading ? (
          <div className="text-center text-[#333333]">Cargando ofertas...</div>
        ) : error ? (
          <div className="text-center text-[#FF5733]">Error: {error}</div>
        ) : offers.length === 0 ? (
          <div className="text-center text-[#333333]">No hay ofertas disponibles.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {offers.map((offer) => (
              <div key={offer.offer_id} className="rounded-lg shadow-md bg-[#FFC300] p-4 mb-4 transition duration-200 ease-in-out hover:shadow-lg">
                <h2 className="text-[#900C3F] font-bold text-xl mb-2">{offer.title}</h2>
                <p className="text-[#333333] mb-2">{offer.merchant.name} - {offer.discount_label}</p>
                <p className="text-[#333333] italic">{offer.distance_km.toFixed(1)} km away</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-md z-10">
        <nav className="flex justify-around items-center p-4">
          <a href="/app" className="text-[#FF5733]">Home</a>
          <a href="/app/search" className="text-[#333333]">Search</a>
          <a href="/app/profile" className="text-[#333333]">Profile</a>
        </nav>
      </footer>
    </div>
  );
}