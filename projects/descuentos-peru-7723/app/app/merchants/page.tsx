"use client";

import { useState, useEffect } from "react";

interface Merchant {
  id: string;
  name: string;
  logo_url?: string;
  current_offers?: string;
}

const MerchantsPage = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [newMerchantName, setNewMerchantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch("/api/merchants");
        if (!response.ok) throw new Error("Failed to fetch merchants");
        const data: Merchant[] = await response.json();
        setMerchants(data);
      } catch (error) {
        setError("Error loading merchants");
      }
    };

    fetchMerchants();
  }, []);

  const addMerchant = async () => {
    if (!newMerchantName) return;
    setLoading(true);
    try {
      const response = await fetch("/api/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMerchantName }),
      });
      if (!response.ok) throw new Error("Failed to add merchant");
      const newMerchant: Merchant = await response.json();
      setMerchants((prev) => [...prev, newMerchant]);
      setNewMerchantName("");
    } catch (error) {
      setError("Error adding merchant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#581845] min-h-screen p-4 text-[#FFFFFF]">
      <h1 className="text-2xl font-bold mb-4">Merchants</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="New Merchant Name"
          value={newMerchantName}
          onChange={(e) => setNewMerchantName(e.target.value)}
          className="rounded-md border border-[#C70039] bg-[#FFFFFF] text-[#581845] px-3 py-2 focus:border-[#FF5733] w-full mb-2"
        />
        <button
          onClick={addMerchant}
          className="rounded-full bg-[#FF5733] text-[#FFFFFF] px-4 py-2 hover:bg-[#C70039] transition-all duration-200 ease-in-out w-full"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Merchant"}
        </button>
      </div>
      {error && <p className="text-[#C70039]">{error}</p>}
      <div className="grid grid-cols-1 gap-4">
        {merchants.length === 0 ? (
          <p>No merchants available.</p>
        ) : (
          merchants.map((merchant) => (
            <div
              key={merchant.id}
              className="rounded-3xl shadow-lg bg-[#FFFFFF] text-[#581845] p-4 flex items-center"
            >
              <img
                src={merchant.logo_url ?? "/placeholder.png"}
                alt={merchant.name}
                className="w-16 h-16 rounded-full mr-4"
              />
              <div>
                <h2 className="text-xl font-bold">{merchant.name}</h2>
                <p className="text-sm text-[#C70039]">{merchant.current_offers ?? "No offers available"}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MerchantsPage;
