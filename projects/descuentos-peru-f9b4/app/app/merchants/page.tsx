"use client";

import { useEffect, useState } from "react";

interface Merchant {
  id: string;
  name: string;
  logo_url: string;
  description: string;
}

const MerchantsPage = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch("/api/merchants");
        if (!response.ok) {
          throw new Error("Failed to fetch merchants.");
        }
        const data: Merchant[] = await response.json();
        setMerchants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF]">
      <header className="p-4 text-2xl font-bold">Comerciantes</header>
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <span>Cargando...</span>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-full">
          <span>Error: {error}</span>
        </div>
      ) : merchants.length === 0 ? (
        <div className="flex justify-center items-center h-full">
          <span>No hay comerciantes disponibles.</span>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {merchants.map((merchant) => (
            <div
              key={merchant.id}
              className="bg-[#FFC300] text-[#FFFFFF] rounded-3xl shadow-lg p-4 transition-all duration-300 transform hover:scale-105"
            >
              <img
                src={merchant.logo_url || "/placeholder.png"}
                alt={merchant.name}
                className="w-full h-32 object-cover rounded-xl mb-3"
              />
              <h2 className="text-xl font-bold mb-2">{merchant.name}</h2>
              <p className="text-base font-medium">
                {merchant.description || "Sin descripción"}
              </p>
            </div>
          ))}
        </div>
      )}
      <nav className="fixed bottom-0 bg-[#900C3F] text-[#FFFFFF] py-3 flex justify-around items-center w-full">
        <a href="/app" className="font-medium">Descubrir</a>
        <a href="/app/memberships" className="font-medium">Mis Programas</a>
        <a href="/app/location" className="font-medium">Ubicación</a>
      </nav>
    </div>
  );
};

export default MerchantsPage;
