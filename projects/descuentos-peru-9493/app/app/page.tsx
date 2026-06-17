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
        const response = await fetch("/api/location");
        const location = await response.json();
        const offersResponse = await fetch(`/api/nearby_offers?lat=${location.latitude}&lng=${location.longitude}`);
        const offersData = await offersResponse.json();
        setOffers(offersData);
        setLoading(false);
      } catch (err) {
        setError("Error al cargar las ofertas cercanas.");
        setLoading(false);
      }
    }

    fetchOffers();
  }, []);

  if (loading) {
    return <div className="text-[#212121] text-center mt-10">Cargando ofertas...</div>;
  }

  if (error) {
    return <div className="text-[#FF5722] text-center mt-10">{error}</div>;
  }

  if (offers.length === 0) {
    return <div className="text-[#212121] text-center mt-10">No hay ofertas cercanas disponibles.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-[#212121] mb-4">Descubrir Ofertas Cercanas</h1>
      <div className="space-y-4">
        {offers.map((offer) => (
          <div key={offer.offer_id} className="rounded-3xl shadow-lg bg-[#FFCCBC] p-4 relative">
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#FFCCBC] via-transparent to-transparent p-4">
              <h2 className="text-xl font-bold text-[#212121]">{offer.title ?? "Oferta sin título"}</h2>
              <p className="text-[#212121]">{offer.discount_label ?? "Sin descuento"}</p>
              <p className="text-[#212121]">{offer.merchant?.name ?? "Sin nombre"} - {offer.merchant?.category ?? "Sin categoría"}</p>
              <p className="text-[#212121]">{offer.distance_km?.toFixed(2) ?? "--"} km</p>
            </div>
            <div className="flex justify-between mt-4">
              <button className="bg-[#FF5722] text-white py-2 px-4 rounded-full shadow-md hover:bg-[#FF8A65] transition-all duration-300">
                Me gusta
              </button>
              <button className="bg-[#FF5722] text-white py-2 px-4 rounded-full shadow-md hover:bg-[#FF8A65] transition-all duration-300">
                Pasar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
