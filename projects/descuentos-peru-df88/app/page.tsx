"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch("/api/discounts");
        if (response.status === 401) { router.replace("/login"); return; }
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
  }, [router]);

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
            <div key={offer.offer_id} className="bg-[#FFFFFF] text-[#581845] p-4 rounded-lg shadow-md mb-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-lg">{offer.title}</h2>
                <span className="shrink-0 bg-[#FFC300] text-[#581845] font-bold text-sm px-2 py-1 rounded-full">{offer.discount_label}</span>
              </div>
              <p className="text-sm mt-1 font-medium">{offer.merchant?.name} · <span className="text-[#900C3F]">{offer.merchant?.category}</span></p>
              <p className="text-sm text-[#581845]/70">{offer.address}</p>
              <p className="text-sm text-[#581845]/70">A {offer.distance_km?.toFixed(2)} km · {offer.program_name}</p>
              <button className="bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#C70039] transition-colors duration-300 mt-3">
                Ver oferta
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;