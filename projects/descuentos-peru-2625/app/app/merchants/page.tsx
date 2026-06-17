"use client";

import { useState, useEffect } from "react";

interface Merchant {
  id: string;
  name: string;
  logo_url: string;
  description: string;
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [newMerchantName, setNewMerchantName] = useState("");
  const [newMerchantDescription, setNewMerchantDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMerchants() {
      try {
        const response = await fetch("/api/merchants");
        if (!response.ok) {
          throw new Error("Failed to fetch merchants");
        }
        const data: Merchant[] = await response.json();
        setMerchants(data ?? []);
      } catch (err) {
        setError((err as Error).message);
      }
    }
    fetchMerchants();
  }, []);

  async function handleAddMerchant() {
    if (!newMerchantName || !newMerchantDescription) return;
    setLoading(true);
    try {
      const response = await fetch("/api/merchants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newMerchantName,
          description: newMerchantDescription,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to add merchant");
      }
      const newMerchant: Merchant = await response.json();
      setMerchants((prev) => [...prev, newMerchant]);
      setNewMerchantName("");
      setNewMerchantDescription("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#581845] min-h-screen p-4 text-[#FFFFFF]">
      <h1 className="text-2xl font-bold mb-4">Merchants</h1>
      {error && <p className="text-[#C70039]">{error}</p>}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Merchant Name"
          value={newMerchantName}
          onChange={(e) => setNewMerchantName(e.target.value)}
          className="border-2 border-[#900C3F] rounded-lg px-3 py-2 mb-2 w-full"
        />
        <input
          type="text"
          placeholder="Description"
          value={newMerchantDescription}
          onChange={(e) => setNewMerchantDescription(e.target.value)}
          className="border-2 border-[#900C3F] rounded-lg px-3 py-2 mb-2 w-full"
        />
        <button
          onClick={handleAddMerchant}
          className="px-4 py-2 rounded-full bg-[#FF5733] text-[#FFFFFF]"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Merchant"}
        </button>
      </div>
      <div>
        {merchants.length === 0 ? (
          <p>No merchants available.</p>
        ) : (
          <ul>
            {merchants.map((merchant) => (
              <li
                key={merchant.id}
                className="bg-[#FFFFFF] text-[#581845] rounded-3xl shadow-md mb-4 p-4"
              >
                <img
                  src={merchant.logo_url ?? "/placeholder.png"}
                  alt={merchant.name}
                  className="w-16 h-16 rounded-full mb-2"
                />
                <h2 className="font-bold text-lg">{merchant.name}</h2>
                <p className="text-sm">{merchant.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
