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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const locationResponse = await fetch("/api/location");
        const locationData = await locationResponse.json();
        const { latitude, longitude } = locationData;

        const response = await fetch(`/api/nearby?lat=${latitude}&lng=${longitude}&radius=5`);
        const data = await response.json();
        setOffers(data);
      } catch (err) {
        setError("Error al cargar las ofertas cercanas.");
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, []);

  if (loading) {
    return <div className="text-[#FFFFFF]">Cargando ofertas...</div>;
  }

  if (error) {
    return <div className="text-[#C70039]">{error}</div>;
  }

  return (
    <div className="bg-[#581845] min-h-screen p-4">
      <h1 className="text-2xl font-bold text-[#FFFFFF] mb-4">Descubrir Ofertas Cercanas</h1>
      <div className="space-y-4">
        {offers.length === 0 ? (
          <div className="text-[#FFFFFF]">No hay ofertas disponibles en este momento.</div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.offer_id}
              className="relative bg-[#FFFFFF] rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
              <img
                src="/placeholder-image.png"
                alt={offer.title ?? "Sin título"}
                className="w-full h-48 object-cover"
              />
              <div className="absolute bottom-0 p-4 z-20 text-[#FFFFFF]">
                <h2 className="text-lg font-bold">{offer.title ?? "Sin título"}</h2>
                <p className="text-sm">{offer.discount_label ?? "Sin descuento"}</p>
                <p className="text-xs">{offer.merchant?.name ?? "Sin nombre"} - {offer.merchant?.category ?? "Sin categoría"}</p>
                <p className="text-xs">{offer.distance_km?.toFixed(1) ?? "0"} km</p>
              </div>
              <div className="absolute top-2 right-2 z-20 flex space-x-2">
                <button className="rounded-full bg-[#FF5733] text-[#FFFFFF] px-4 py-2 hover:bg-[#C70039] transition-all duration-200 ease-in-out">Like</button>
                <button className="rounded-full bg-[#FF5733] text-[#FFFFFF] px-4 py-2 hover:bg-[#C70039] transition-all duration-200 ease-in-out">Pass</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
