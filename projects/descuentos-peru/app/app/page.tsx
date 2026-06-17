"use client";

import { useEffect, useState } from "react";

interface Discount {
  id: string;
  image_url?: string;
  title?: string;
  description?: string;
  amount?: number;
}

const DiscoverPage = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const res = await fetch("/api/discounts?latitude=...&longitude=...");
        if (!res.ok) throw new Error("Failed to fetch discounts");
        const data = await res.json();
        setDiscounts(data.discounts ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF]">
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-4">Descubrir</h1>
        {loading ? (
          <p className="text-center">Cargando descuentos...</p>
        ) : error ? (
          <p className="text-center text-[#C70039]">Error: {error}</p>
        ) : discounts.length === 0 ? (
          <p className="text-center">No se encontraron descuentos.</p>
        ) : (
          <div className="space-y-4">
            {discounts.map((discount) => (
              <div
                key={discount.id}
                className="relative rounded-3xl shadow-lg bg-[#FFC300] p-6 overflow-hidden transform transition-transform duration-150 ease-in-out hover:scale-105"
              >
                <img
                  src={discount.image_url ?? "/placeholder.jpg"}
                  alt={discount.title ?? "Imagen de descuento"}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#581845] to-transparent p-4">
                  <h2 className="text-xl font-bold">{discount.title ?? "Sin título"}</h2>
                  <p className="text-base font-medium">
                    {discount.description ?? "Sin descripción"}
                  </p>
                  <span className="bg-[#900C3F] text-[#FFFFFF] rounded-full px-3 py-1 text-sm font-medium">
                    {discount.amount ?? 0}% de descuento
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
