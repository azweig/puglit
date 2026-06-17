"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Merchant {
  merchant_id: number;
  name: string;
  category: string;
  discount_percentage: number;
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    async function fetchMerchants() {
      try {
        const response = await fetch("/api/merchants");
        if (!response.ok) throw new Error("Failed to load merchants.");
        const data: Merchant[] = await response.json();
        setMerchants(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchMerchants();
  }, []);

  const handleCreateMerchant = async () => {
    try {
      const response = await fetch("/api/merchants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, category, discount_percentage: discount }),
      });
      if (!response.ok) throw new Error("Failed to create merchant.");
      const newMerchant: Merchant = await response.json();
      setMerchants((prev) => [...prev, newMerchant]);
      setName("");
      setCategory("");
      setDiscount(0);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen p-4">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md flex justify-between items-center px-4 py-2">
        <h1 className="text-2xl font-bold text-[#333333]">Merchants</h1>
        <nav className="flex space-x-4">
          <Link href="/app" className="text-[#900C3F]">Descubrir</Link>
          <Link href="/app/memberships" className="text-[#900C3F]">Mis Programas</Link>
          <Link href="/app/location" className="text-[#900C3F]">Ubicación</Link>
        </nav>
      </div>

      <div className="mt-16">
        <h2 className="text-xl font-bold text-[#333333] mb-4">Create a Merchant</h2>
        <div className="bg-[#FFC300] rounded-lg shadow-md p-4 mb-4">
          <input
            type="text"
            placeholder="Merchant Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-[#C70039] rounded-md p-2 w-full mb-2 focus:outline-none focus:border-[#FF5733]"
          />
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-[#C70039] rounded-md p-2 w-full mb-2 focus:outline-none focus:border-[#FF5733]"
          />
          <input
            type="number"
            placeholder="Discount Percentage"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="border border-[#C70039] rounded-md p-2 w-full mb-2 focus:outline-none focus:border-[#FF5733]"
          />
          <button
            onClick={handleCreateMerchant}
            className="bg-[#FF5733] text-white py-2 px-4 rounded-md hover:bg-[#C70039] transition duration-200 ease-in-out"
          >
            Add Merchant
          </button>
        </div>

        {loading ? (
          <p className="text-[#333333]">Loading merchants...</p>
        ) : error ? (
          <p className="text-[#FF5733]">{error}</p>
        ) : merchants.length === 0 ? (
          <p className="text-[#333333]">No merchants available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {merchants.map((merchant) => (
              <div key={merchant.merchant_id} className="bg-[#FFC300] rounded-lg shadow-md p-4">
                <h3 className="text-lg font-bold text-[#333333]">{merchant.name}</h3>
                <p className="text-[#333333]">Category: {merchant.category}</p>
                <p className="text-[#333333]">Discount: {merchant.discount_percentage}%</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
