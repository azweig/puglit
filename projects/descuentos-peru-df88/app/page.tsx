"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Offer {
  offer_id: number;
  title: string;
  discount_label: string;
  merchant: { name: string; category: string };
  address: string;
  latitude: number;
  longitude: number;
  program_name: string;
  distance_km: number;
}

const HomePage = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch("/api/discounts");
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.items ?? [];
        setOffers(list);
      } catch (err: any) {
        setError("Failed to load offers.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
    const interval = setInterval(fetchOffers, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF]">
      <nav className="sticky top-0 bg-[#900C3F] p-4 flex justify-around">
        <Link href="/" className="text-[#FFC300]">Inicio</Link>
        <Link href="/mis-programas" className="text-[#FFC300]">Mis Programas</Link>
        <Link href="/establecer-ubicacion" className="text-[#FFC300]">Establecer Ubicación</Link>
      </nav>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Descuentos Cercanos</h1>
        {loading && <p>Loading offers...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div>
          {offers.map((offer) => (
            <div key={offer.offer_id} className="bg-[#FFFFFF] p-4 rounded-lg shadow-md mb-4">
              <h2 className="font-bold text-lg">{offer.title}</h2>
              <p className="text-[#581845]">{offer.discount_label}</p>
              <p className="text-sm">Merchant: {offer.merchant.name} ({offer.merchant.category})</p>
              <p className="text-sm">Location: {offer.address}</p>
              <p className="text-sm">Distance: {offer.distance_km.toFixed(2)} km</p>
              <button className="bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#C70039] transition-colors duration-300 mt-2">
                View Offer
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;