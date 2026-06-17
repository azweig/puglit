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

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newOffer, setNewOffer] = useState({ title: "", discount_label: "" });

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

  const handleCreateOffer = async () => {
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOffer),
      });
      if (!response.ok) throw new Error("Failed to create offer");
      const createdOffer: Offer = await response.json();
      setOffers((prevOffers) => [...prevOffers, createdOffer]);
      setNewOffer({ title: "", discount_label: "" });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="bg-[#581845] min-h-screen p-4">
      <h1 className="text-3xl font-bold text-[#FFFFFF] mb-4">Offers</h1>
      {loading ? (
        <p className="text-[#FFFFFF]">Loading...</p>
      ) : error ? (
        <p className="text-[#FF5733]">{error}</p>
      ) : offers.length === 0 ? (
        <p className="text-[#FFFFFF]">No offers available.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.offer_id}
              className="rounded-3xl shadow-lg bg-[#900C3F] p-6 text-[#FFFFFF] transform transition-transform hover:scale-105"
            >
              <h2 className="text-xl font-bold">{offer.title ?? "Sin título"}</h2>
              <p>{offer.discount_label ?? ""}</p>
              <p>{offer.merchant?.name ?? "Unknown Merchant"}</p>
              <p>{offer.address ?? "No Address"}</p>
              <p>{offer.program_name ?? "No Program"}</p>
              <p>{offer.distance_km ? `${offer.distance_km} km away` : ""}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-2xl font-bold text-[#FFFFFF] mb-2">Create New Offer</h2>
        <input
          type="text"
          placeholder="Offer Title"
          value={newOffer.title}
          onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
          className="rounded-lg bg-[#581845] text-[#FFFFFF] py-2 px-4 border border-opacity-50 focus:border-[#FF5733] transition-all duration-300 mb-2 w-full"
        />
        <input
          type="text"
          placeholder="Discount Label"
          value={newOffer.discount_label}
          onChange={(e) => setNewOffer({ ...newOffer, discount_label: e.target.value })}
          className="rounded-lg bg-[#581845] text-[#FFFFFF] py-2 px-4 border border-opacity-50 focus:border-[#FF5733] transition-all duration-300 mb-2 w-full"
        />
        <button
          onClick={handleCreateOffer}
          className="rounded-full bg-[#FF5733] text-[#FFFFFF] py-3 px-6 font-bold hover:bg-[#C70039] transition-colors duration-300"
        >
          Create Offer
        </button>
      </div>
    </div>
  );
}
