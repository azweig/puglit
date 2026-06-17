"use client";

import { useState } from "react";

export default function LocationPage() {
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const handleLocationSubmit = async () => {
    if (!latitude || !longitude) {
      setStatus("Por favor, ingrese latitud y longitud.");
      return;
    }

    try {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (response.ok) {
        setStatus("Ubicación guardada exitosamente.");
      } else {
        setStatus("Error al guardar la ubicación.");
      }
    } catch (error) {
      setStatus("Error de red. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Ubicación</h1>
      <div className="bg-[#FFFFFF] text-[#581845] p-6 rounded-3xl shadow-lg w-11/12 max-w-md">
        <label className="block mb-4">
          <span className="text-sm font-medium">Latitud</span>
          <input
            type="text"
            className="border-2 border-[#900C3F] rounded-lg px-3 py-2 mt-1 block w-full"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="-12.0464"
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm font-medium">Longitud</span>
          <input
            type="text"
            className="border-2 border-[#900C3F] rounded-lg px-3 py-2 mt-1 block w-full"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="-77.0428"
          />
        </label>
        <button
          onClick={handleLocationSubmit}
          className="px-4 py-2 rounded-full bg-[#FF5733] text-[#FFFFFF] transition-all duration-200 ease-in-out hover:bg-[#FF4519]"
        >
          Guardar Ubicación
        </button>
        {status && <p className="mt-4 text-sm text-[#C70039]">{status}</p>}
      </div>
      <nav className="flex justify-around bg-[#581845] text-[#FFFFFF] w-full py-4 mt-8">
        <a href="/app" className="text-sm">Descubrir</a>
        <a href="/app/memberships" className="text-sm">Mis Programas</a>
        <a href="/app/location" className="text-sm">Ubicación</a>
      </nav>
    </div>
  );
}
