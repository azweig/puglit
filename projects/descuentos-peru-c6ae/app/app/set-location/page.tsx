"use client";

import { useState } from "react";

export default function SetLocationPage() {
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/set-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude, longitude, address }),
      });

      if (!response.ok) {
        throw new Error("Failed to set location");
      }

      // Handle success (e.g., show a success message or redirect)
      alert("Location set successfully!");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] flex flex-col">
      <h1 className="text-3xl font-bold text-center mt-8">Ubicación</h1>
      <div className="flex-1 flex flex-col justify-center items-center">
        <form onSubmit={handleSubmit} className="w-full max-w-md p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="latitude">
              Latitud
            </label>
            <input
              id="latitude"
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
              placeholder="Ingrese la latitud"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="longitude">
              Longitud
            </label>
            <input
              id="longitude"
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
              placeholder="Ingrese la longitud"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" htmlFor="address">
              Dirección
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
              placeholder="Ingrese la dirección"
            />
          </div>
          <button
            type="submit"
            className="bg-[#FF5733] text-[#FFFFFF] font-bold py-3 px-6 rounded-full shadow-md transition-transform transform hover:scale-105 w-full"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar Ubicación"}
          </button>
          {error && <p className="text-[#FFC300] mt-4">Error: {error}</p>}
        </form>
      </div>
    </div>
  );
}
