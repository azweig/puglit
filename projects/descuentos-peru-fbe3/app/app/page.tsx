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

  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/offers/nearby");
      if (!response.ok) {
        throw new Error("Failed to fetch offers.");
      }
      const data: Offer[] = await response.json();
      setOffers(data);
    } catch (err) {
      setError("Could not load offers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchOffers();
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] flex flex-col items-center">
      <h1 className="text-3xl font-bold mt-6">Descubrir</h1>
      {loading ? (
        <p className="mt-4">Cargando ofertas...</p>
      ) : error ? (
        <p className="mt-4 text-red-500">{error}</p>
      ) : offers.length === 0 ? (
        <p className="mt-4">No hay ofertas disponibles cerca de ti.</p>
      ) : (
        <div className="mt-6 space-y-4 w-full px-4">
          {offers.map((offer) => (
            <div key={offer.offer_id} className="rounded-3xl shadow-lg bg-[#900C3F] p-6 text-[#FFFFFF]">
              <h2 className="text-2xl font-bold">{offer.title ?? "Oferta sin título"}</h2>
              <p className="text-base mt-2">{offer.discount_label ?? "Sin descuento"}</p>
              <p className="text-sm mt-1">{offer.merchant?.name ?? "Mercado Desconocido"}</p>
              <p className="text-sm mt-1">{offer.address ?? "Dirección no disponible"}</p>
              <p className="text-sm mt-1">{offer.distance_km?.toFixed(1) ?? "--"} km de distancia</p>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={handleRefresh}
        className="mt-6 rounded-full bg-[#FF5733] text-[#FFFFFF] py-3 px-6 font-bold hover:bg-[#C70039] transition-colors duration-300"
      >
        Refrescar Ofertas
      </button>
    </div>
  );
}
