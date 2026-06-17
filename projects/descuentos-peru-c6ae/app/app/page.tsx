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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const response = await fetch("/api/nearby-offers");
        if (!response.ok) {
          throw new Error("Failed to fetch offers.");
        }
        const data: Offer[] = await response.json();
        setOffers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, [currentIndex]);

  const handleLike = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  const handlePass = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  if (loading) {
    return <div className="text-[#FFFFFF] text-center mt-10">Cargando ofertas...</div>;
  }

  if (error) {
    return <div className="text-[#FF5733] text-center mt-10">Error: {error}</div>;
  }

  if (offers.length === 0) {
    return <div className="text-[#FFFFFF] text-center mt-10">No hay ofertas disponibles cerca de ti.</div>;
  }

  const currentOffer = offers[currentIndex];

  return (
    <div className="bg-[#581845] min-h-screen flex flex-col items-center justify-center">
      {currentOffer ? (
        <div className="relative w-full max-w-md h-96 rounded-3xl shadow-lg overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('/path/to/image/${currentOffer.offer_id}.jpg')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
            <div className="absolute bottom-0 p-6">
              <h2 className="text-3xl font-bold text-[#FFFFFF]">
                {currentOffer.title ?? "Sin título"}
              </h2>
              <p className="text-[#FFC300]">
                {currentOffer.discount_label ?? "Sin descuento"}
              </p>
            </div>
          </div>
          <div className="absolute bottom-4 left-4">
            <button
              onClick={handlePass}
              className="bg-[#C70039] text-[#FFFFFF] font-medium py-2 px-5 rounded-full shadow-sm transition-all duration-300 ease-in-out"
            >
              Pasar
            </button>
          </div>
          <div className="absolute bottom-4 right-4">
            <button
              onClick={handleLike}
              className="bg-[#FF5733] text-[#FFFFFF] font-bold py-3 px-6 rounded-full shadow-md transition-transform transform hover:scale-105"
            >
              Me gusta
            </button>
          </div>
        </div>
      ) : (
        <div className="text-[#FFFFFF] text-center mt-10">No hay más ofertas para mostrar.</div>
      )}
    </div>
  );
}
