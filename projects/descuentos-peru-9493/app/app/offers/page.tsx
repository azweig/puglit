"use client";

import { useEffect, useState } from "react";

interface Offer {
  offer_id: number;
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
  const [title, setTitle] = useState<string>("");
  const [discountLabel, setDiscountLabel] = useState<string>("");

  useEffect(() => {
    async function fetchOffers() {
      try {
        const response = await fetch("/api/offers");
        if (!response.ok) throw new Error("Failed to fetch offers");
        const data = await response.json();
        setOffers(data ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, []);

  async function handleCreateOffer() {
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, discount_label: discountLabel }),
      });
      if (!response.ok) throw new Error("Failed to create offer");
      const newOffer = await response.json();
      setOffers((prevOffers) => [...prevOffers, newOffer]);
      setTitle("");
      setDiscountLabel("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="p-4 bg-[#FFFFFF] min-h-screen">
      <h1 className="text-2xl font-bold text-[#212121] mb-4">Offers</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Offer Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-white border border-[#FFCCBC] rounded-lg py-2 px-3 shadow-sm focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] mb-2 w-full"
        />
        <input
          type="text"
          placeholder="Discount Label"
          value={discountLabel}
          onChange={(e) => setDiscountLabel(e.target.value)}
          className="bg-white border border-[#FFCCBC] rounded-lg py-2 px-3 shadow-sm focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] mb-2 w-full"
        />
        <button
          onClick={handleCreateOffer}
          className="bg-[#FF5722] text-white py-2 px-4 rounded-full shadow-md hover:bg-[#FF8A65] transition-all duration-300 w-full"
        >
          Create Offer
        </button>
      </div>
      {loading ? (
        <p className="text-center text-[#212121]">Loading offers...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : offers.length === 0 ? (
        <p className="text-center text-[#212121]">No offers available.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.offer_id}
              className="rounded-3xl shadow-lg bg-[#FFCCBC] p-4"
            >
              <h2 className="text-xl font-bold text-[#212121]">
                {offer.title ?? "Sin título"}
              </h2>
              <p className="text-[#212121]">{offer.discount_label ?? ""}</p>
              <p className="text-[#212121]">
                {offer.merchant?.name ?? "Unknown Merchant"} - {offer.merchant?.category ?? "Unknown Category"}
              </p>
              <p className="text-[#212121]">{offer.address ?? "No Address"}</p>
              <button
                className="bg-[#FF5722] text-white py-2 px-4 rounded-full shadow-md hover:bg-[#FF8A65] transition-all duration-300 mt-2"
              >
                Redeem
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
