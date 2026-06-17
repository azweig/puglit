"use client";

import { useEffect, useState } from "react";

interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch("/api/offers");
        if (!response.ok) throw new Error("Failed to fetch offers");
        const data: Offer[] = await response.json();
        setOffers(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  if (loading) {
    return <div className="text-[#FFFFFF] text-center mt-10">Cargando ofertas...</div>;
  }

  if (error) {
    return <div className="text-[#FFFFFF] text-center mt-10">Error: {error}</div>;
  }

  if (offers.length === 0) {
    return <div className="text-[#FFFFFF] text-center mt-10">No hay ofertas cercanas disponibles.</div>;
  }

  return (
    <div className="bg-[#581845] min-h-screen p-4">
      <h1 className="text-2xl font-bold text-[#FFFFFF] mb-4">Ofertas Cercanas</h1>
      <div className="grid grid-cols-1 gap-4">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="bg-[#FFC300] rounded-3xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105"
          >
            <img
              src={offer.image_url ?? "/placeholder.png"}
              alt={offer.title ?? "Sin título"}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-xl font-bold text-[#FFFFFF]">
                {offer.title ?? "Sin título"}
              </h2>
              <p className="text-base font-medium text-[#FFFFFF]">
                {offer.description ?? "Sin descripción"}
              </p>
              <p className="text-lg font-bold text-[#FFFFFF] mt-2">
                {offer.price ?? "Precio no disponible"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
