"use client";

import { useState, useEffect } from "react";

export default function LocationPage() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude, longitude, address }),
      });
      if (!response.ok) {
        throw new Error("Failed to set location");
      }
    } catch (err) {
      setError("No se pudo configurar la ubicación. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Optionally, fetch current location here if needed
  }, []);

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6">Configurar Ubicación</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md p-4">
        <input
          type="text"
          placeholder="Latitud"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          className="block w-full mt-2 rounded-lg bg-[#581845] text-[#FFFFFF] placeholder-[#C70039] px-4 py-2"
        />
        <input
          type="text"
          placeholder="Longitud"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          className="block w-full mt-2 rounded-lg bg-[#581845] text-[#FFFFFF] placeholder-[#C70039] px-4 py-2"
        />
        <input
          type="text"
          placeholder="Dirección"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="block w-full mt-2 rounded-lg bg-[#581845] text-[#FFFFFF] placeholder-[#C70039] px-4 py-2"
        />
        <button
          type="submit"
          className="mt-4 bg-[#FF5733] text-[#FFFFFF] py-3 px-6 rounded-full transition-all duration-300 hover:bg-[#C70039]"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
        {error && <p className="mt-4 text-[#C70039]">{error}</p>}
      </form>
      <div className="fixed bottom-0 bg-[#900C3F] text-[#FFFFFF] py-3 w-full flex justify-around items-center">
        <button className="text-base font-medium">Descubrir</button>
        <button className="text-base font-medium">Mis Programas</button>
        <button className="text-base font-medium">Ubicación</button>
      </div>
    </div>
  );
}
