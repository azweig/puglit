"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Offer {
  offer_id: number;
  title: string;
  discount_label: string;
  merchant: {
    name: string;
    category: string;
  };
  address: string;
  program_name: string;
  distance_km: number;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const response = await fetch("/api/offers");
        if (!response.ok) throw new Error("Failed to fetch offers");
        const data: Offer[] = await response.json();
        setOffers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, []);

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md flex justify-between items-center p-4">
        <div className="flex space-x-4">
          <Link href="/app" className="text-[#333333] font-bold">Descubrir</Link>
          <Link href="/app/memberships" className="text-[#333333]">Mis Programas</Link>
          <Link href="/app/location" className="text-[#333333]">Ubicación</Link>
        </div>
      </nav>

      <main className="pt-16 px-4 pb-20">
        <h1 className="text-2xl font-bold text-[#333333] mb-4">Offers</h1>

        {loading && <p className="text-center text-[#FF5733]">Loading offers...</p>}
        {error && <p className="text-center text-[#FF5733]">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {offers.length > 0 ? (
            offers.map((offer) => (
              <div key={offer.offer_id} className="rounded-lg shadow-md bg-[#FFC300] p-4 mb-4">
                <h2 className="text-lg font-bold text-[#900C3F]">{offer.title ?? "Sin título"}</h2>
                <p className="text-[#333333]">{offer.discount_label ?? ""}</p>
                <p className="text-[#333333]">{offer.merchant?.name ?? "Unknown Merchant"}</p>
                <p className="text-[#333333]">{offer.program_name ?? "No Program"}</p>
                <p className="text-[#333333]">{offer.address ?? "No Address"}</p>
                <p className="text-[#333333]">{offer.distance_km ? `${offer.distance_km} km away` : "Distance unknown"}</p>
              </div>
            ))
          ) : (
            !loading && <p className="text-center text-[#333333]">No offers available at the moment.</p>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-md flex justify-around items-center p-4">
        <Link href="/app" className="text-[#333333]">Home</Link>
        <Link href="/app/search" className="text-[#333333]">Search</Link>
        <Link href="/app/profile" className="text-[#333333]">Profile</Link>
      </footer>
    </div>
  );
}
