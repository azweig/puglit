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

export default function DiscoverPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/nearby");
      if (!response.ok) throw new Error("Failed to fetch offers");
      const data: Offer[] = await response.json();
      setOffers(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    const interval = setInterval(fetchOffers, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-[#F5F5F5] flex flex-col items-center">
      <h1 className="text-4xl font-bold text-[#333333] mt-6">Descubrir</h1>
      <div className="flex-1 w-full overflow-y-auto">
        {loading && <p className="text-center mt-4">Cargando ofertas...</p>}
        {error && <p className="text-center mt-4 text-red-500">Error: {error}</p>}
        {offers.length === 0 && !loading && (
          <p className="text-center mt-4">No hay ofertas disponibles.</p>
        )}
        <div className="p-4 grid grid-cols-1 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.offer_id}
              className="rounded-3xl shadow-lg p-4 bg-[#FFC300] relative"
            >
              <div className="bg-gradient-to-t from-[#900C3F] to-transparent absolute inset-0 rounded-3xl"></div>
              <div className="relative z-10">
                <h2 className="text-lg font-bold text-[#333333]">
                  {offer.title ?? "Oferta sin título"}
                </h2>
                <p className="text-[#333333] mt-1">
                  {offer.discount_label ?? "Sin descuento"}
                </p>
                <p className="text-[#333333] mt-1">
                  {offer.merchant?.name ?? "Sin nombre de comerciante"} - {offer.merchant?.category ?? "Sin categoría"}
                </p>
                <p className="text-[#333333] mt-1">
                  {offer.distance_km.toFixed(2)} km de distancia
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 w-full flex justify-around bg-[#FFC300] py-3 shadow-inner">
        <button className="bg-[#FF5733] text-white py-3 px-6 rounded-full shadow-md hover:bg-opacity-90 transition">
          Descubrir
        </button>
        <button className="bg-[#C70039] text-white py-2 px-4 rounded-full shadow-sm hover:bg-opacity-90 transition">
          Mis Programas
        </button>
        <button className="bg-[#C70039] text-white py-2 px-4 rounded-full shadow-sm hover:bg-opacity-90 transition">
          Ubicación
        </button>
      </div>
    </div>
  );
}
