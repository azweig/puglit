"use client";

import { useState, useEffect } from "react";

interface Discount {
  id: number;
  title: string;
  image_url: string;
  description: string;
}

const LocationPage = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiscounts = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/discounts");
        if (!response.ok) throw new Error("Failed to fetch discounts");
        const data: Discount[] = await response.json();
        setDiscounts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await fetch("/api/user-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude, longitude, address }),
      });
    } catch (err) {
      console.error("Failed to update location", err);
    }
  };

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF]">
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="Latitud"
            className="block w-full bg-[#FFC300] text-[#581845] rounded-lg px-4 py-2 placeholder-[#C70039] focus:ring-2 focus:ring-[#FF5733]"
          />
          <input
            type="text"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="Longitud"
            className="block w-full bg-[#FFC300] text-[#581845] rounded-lg px-4 py-2 placeholder-[#C70039] focus:ring-2 focus:ring-[#FF5733]"
          />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Dirección"
            className="block w-full bg-[#FFC300] text-[#581845] rounded-lg px-4 py-2 placeholder-[#C70039] focus:ring-2 focus:ring-[#FF5733]"
          />
          <button
            type="submit"
            className="bg-[#FF5733] text-[#FFFFFF] rounded-full px-6 py-3 text-lg font-semibold hover:bg-[#C70039] transition-all duration-200 ease-in-out"
          >
            Actualizar
          </button>
        </form>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-center">Cargando descuentos...</p>
        ) : error ? (
          <p className="text-center text-[#C70039]">Error: {error}</p>
        ) : discounts.length === 0 ? (
          <p className="text-center">No hay descuentos disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {discounts.map((discount) => (
              <div
                key={discount.id}
                className="rounded-3xl shadow-lg bg-[#FFC300] text-[#FFFFFF] p-6 transform transition-transform duration-150 ease-in-out hover:scale-105"
              >
                <img
                  src={discount.image_url ?? "/placeholder.png"}
                  alt={discount.title ?? "Sin título"}
                  className="w-full h-40 object-cover rounded-t-3xl"
                />
                <h2 className="text-2xl font-bold mt-4">{discount.title ?? "Sin título"}</h2>
                <p className="text-base font-medium mt-2">{discount.description ?? "Sin descripción"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#581845] text-[#FFFFFF] flex justify-around py-2 border-t-2 border-[#900C3F] fixed bottom-0 w-full">
        <button className="text-lg font-semibold">Descubrir</button>
        <button className="text-lg font-semibold">Programas de Lealtad</button>
        <button className="text-lg font-semibold">Ubicación</button>
      </div>
    </div>
  );
};

export default LocationPage;
