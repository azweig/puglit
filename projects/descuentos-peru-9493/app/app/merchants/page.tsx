"use client";

import { useState, useEffect } from "react";

interface Merchant {
  id: string;
  name: string;
  category: string;
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch("/api/merchants");
        if (!response.ok) throw new Error("Failed to fetch merchants");
        const data: Merchant[] = await response.json();
        setMerchants(data);
      } catch (err) {
        setError("Error loading merchants.");
      }
    };
    fetchMerchants();
  }, []);

  const addMerchant = async () => {
    if (!name || !category) return;
    setLoading(true);
    try {
      const response = await fetch("/api/merchants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, category }),
      });
      if (!response.ok) throw new Error("Failed to add merchant");
      const newMerchant: Merchant = await response.json();
      setMerchants((prev) => [...prev, newMerchant]);
      setName("");
      setCategory("");
    } catch (err) {
      setError("Error adding merchant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-[#212121] mb-4">Merchants</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Merchant Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white border border-[#FFCCBC] rounded-lg py-2 px-3 shadow-sm focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] mb-2"
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-white border border-[#FFCCBC] rounded-lg py-2 px-3 shadow-sm focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] mb-2"
        />
        <button
          onClick={addMerchant}
          disabled={loading}
          className="bg-[#FF5722] text-white py-2 px-4 rounded-full shadow-md hover:bg-[#FF8A65] transition-all duration-300"
        >
          {loading ? "Adding..." : "Add Merchant"}
        </button>
      </div>
      <ul>
        {merchants.length === 0 ? (
          <p className="text-center text-[#212121]">No merchants available.</p>
        ) : (
          merchants.map((merchant) => (
            <li key={merchant.id} className="flex items-center justify-between bg-[#FFCCBC] p-4 rounded-3xl shadow-lg mb-2">
              <div>
                <h2 className="text-lg font-bold text-[#212121]">{merchant.name ?? "Unnamed"}</h2>
                <p className="text-sm text-[#212121]">{merchant.category ?? "No category"}</p>
              </div>
              <button className="bg-[#FFC107] text-[#212121] py-2 px-4 rounded-full hover:bg-[#FFD54F] transition-all duration-300">
                View Offers
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
