"use client";

import { useState, useEffect } from "react";

interface Merchant {
  merchant_id: string;
  name: string;
  category: string;
  distance_km: number;
  logo_url: string;
}

export default function Merchants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [newMerchantName, setNewMerchantName] = useState("");
  const [newMerchantCategory, setNewMerchantCategory] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMerchants() {
      try {
        const response = await fetch("/api/merchants");
        if (!response.ok) throw new Error("Failed to fetch merchants");
        const data = await response.json();
        setMerchants(data ?? []);
      } catch (error) {
        setError("Error loading merchants. Please try again later.");
      }
    }

    fetchMerchants();
  }, []);

  async function handleAddMerchant() {
    if (!newMerchantName || !newMerchantCategory) return;

    try {
      const response = await fetch("/api/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMerchantName, category: newMerchantCategory }),
      });

      if (!response.ok) throw new Error("Failed to add merchant");

      const newMerchant = await response.json();
      setMerchants((prev) => [...prev, newMerchant]);
      setNewMerchantName("");
      setNewMerchantCategory("");
    } catch (error) {
      setError("Error adding merchant. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <h1 className="text-3xl font-bold mb-4">Merchants</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Merchant Name"
          value={newMerchantName}
          onChange={(e) => setNewMerchantName(e.target.value)}
          className="rounded-lg bg-[#581845] text-[#FFFFFF] py-2 px-4 border border-opacity-50 focus:border-[#FF5733] transition-all duration-300 mb-2 w-full"
        />
        <input
          type="text"
          placeholder="Category"
          value={newMerchantCategory}
          onChange={(e) => setNewMerchantCategory(e.target.value)}
          className="rounded-lg bg-[#581845] text-[#FFFFFF] py-2 px-4 border border-opacity-50 focus:border-[#FF5733] transition-all duration-300 mb-2 w-full"
        />
        <button
          onClick={handleAddMerchant}
          className="rounded-full bg-[#FF5733] text-[#FFFFFF] py-3 px-6 font-bold hover:bg-[#C70039] transition-colors duration-300 w-full"
        >
          Add Merchant
        </button>
      </div>

      <div className="grid gap-4">
        {merchants.length > 0 ? (
          merchants.map((merchant) => (
            <div key={merchant.merchant_id} className="rounded-3xl shadow-lg bg-[#900C3F] p-6 text-[#FFFFFF]">
              <div className="flex items-center">
                <img
                  src={merchant.logo_url ?? "/placeholder-logo.png"}
                  alt={merchant.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h2 className="text-xl font-bold">{merchant.name}</h2>
                  <p className="text-sm text-opacity-70">{merchant.category}</p>
                  <p className="text-sm text-opacity-70">{merchant.distance_km.toFixed(1)} km away</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center">No merchants found. Add a new one above!</p>
        )}
      </div>
    </div>
  );
}
