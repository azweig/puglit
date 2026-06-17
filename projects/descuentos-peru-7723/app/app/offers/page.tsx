"use client";

import { useState, useEffect } from "react";

interface Offer {
  offer_id: string;
  title: string;
  discount_label: string;
  merchant: {
    name: string;
    category: string;
  };
  address: string;
  program_name: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newOffer, setNewOffer] = useState<string>("");

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch("/api/offers");
        if (!response.ok) throw new Error("Network response was not ok");
        const data: Offer[] = await response.json();
        setOffers(data);
      } catch (error) {
        setError("Failed to load offers.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const handleAddOffer = async () => {
    if (!newOffer.trim()) return;

    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newOffer }),
      });
      if (!response.ok) throw new Error("Failed to add offer.");
      const addedOffer: Offer = await response.json();
      setOffers((prevOffers) => [...prevOffers, addedOffer]);
      setNewOffer("");
    } catch (error) {
      setError("Failed to add new offer.");
    }
  };

  return (
    <div className="bg-[#581845] min-h-screen p-4 text-[#FFFFFF]">
      <h1 className="font-bold text-2xl mb-4">Offers</h1>

      {loading && <p>Loading offers...</p>}
      {error && <p className="text-[#C70039]">{error}</p>}

      <div className="grid gap-4">
        {offers.length === 0 && !loading && (
          <p>No offers available at the moment.</p>
        )}
        {offers.map((offer) => (
          <div
            key={offer.offer_id}
            className="rounded-3xl shadow-lg bg-[#FFFFFF] text-[#581845] p-4 transition-all duration-200 ease-in-out hover:transform hover:scale-105"
          >
            <h2 className="font-bold text-lg">{offer.title ?? "Sin título"}</h2>
            <p className="text-sm">{offer.discount_label ?? "No discount available"}</p>
            <p className="text-sm">Merchant: {offer.merchant?.name ?? "Unknown"}</p>
            <p className="text-sm">Category: {offer.merchant?.category ?? "Uncategorized"}</p>
            <p className="text-sm">Address: {offer.address ?? "No address provided"}</p>
            <p className="text-sm">Program: {offer.program_name ?? "No program"}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <input
          type="text"
          value={newOffer}
          onChange={(e) => setNewOffer(e.target.value)}
          placeholder="Enter new offer title"
          className="rounded-md border border-[#C70039] bg-[#FFFFFF] text-[#581845] px-3 py-2 focus:border-[#FF5733] w-full mb-2"
        />
        <button
          onClick={handleAddOffer}
          className="rounded-full bg-[#FF5733] text-[#FFFFFF] px-4 py-2 hover:bg-[#C70039]"
        >
          Add Offer
        </button>
      </div>
    </div>
  );
}
