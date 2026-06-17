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

export default function LocationPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLoading(true);
          try {
            const response = await fetch(`/api/location`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ latitude, longitude, address: "" }),
            });

            if (!response.ok) {
              throw new Error("Failed to update location");
            }

            const offersResponse = await fetch(
              `/api/nearby?lat=${latitude}&lng=${longitude}&radius=10`
            );

            if (!offersResponse.ok) {
              throw new Error("Failed to fetch offers");
            }

            const data: Offer[] = await offersResponse.json();
            setOffers(data);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        },
        () => {
          setError("Unable to retrieve your location");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-20 text-[#333333]">Loading offers...</div>
        ) : error ? (
          <div className="text-center py-20 text-[#FF5733]">{error}</div>
        ) : offers.length === 0 ? (
          <div className="text-center py-20 text-[#333333]">No offers found nearby.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4">
            {offers.map((offer) => (
              <div key={offer.offer_id} className="rounded-3xl shadow-lg p-4 bg-[#FFC300]">
                <h2 className="text-lg font-bold text-[#333333]">
                  {offer.title ?? "Sin título"}
                </h2>
                <p className="text-[#333333] text-opacity-50">
                  {offer.discount_label ?? "No discount available"}
                </p>
                <p className="text-[#333333]">
                  {offer.merchant?.name ?? "Unknown Merchant"} - {offer.merchant?.category ?? "Unknown Category"}
                </p>
                <p className="text-[#333333] text-opacity-50">
                  {offer.address ?? "No address available"}
                </p>
                <p className="text-[#333333]">
                  {offer.program_name ?? "No program"}
                </p>
                <p className="text-[#333333] text-opacity-50">
                  {offer.distance_km?.toFixed(1) ?? "0"} km away
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="fixed bottom-0 w-full flex justify-around bg-[#FFC300] py-3 shadow-inner">
        <button className="bg-[#FF5733] text-white py-3 px-6 rounded-full shadow-md hover:bg-opacity-90 transition">
          Descubrir
        </button>
        <button className="bg-[#FF5733] text-white py-3 px-6 rounded-full shadow-md hover:bg-opacity-90 transition">
          Mis Programas
        </button>
        <button className="bg-[#FF5733] text-white py-3 px-6 rounded-full shadow-md hover:bg-opacity-90 transition">
          Ubicación
        </button>
      </div>
    </div>
  );
}
