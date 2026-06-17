"use client";

import { useEffect, useState } from "react";

export default function LocationPage() {
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    return () => {
      setMessage(""); // Clear message on unmount
    };
  }, []);

  const updateLocation = async () => {
    if (!latitude || !longitude) {
      setMessage("Por favor, ingrese latitud y longitud.");
      return;
    }

    try {
      const response = await fetch("/api/user/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (response.ok) {
        setMessage("Ubicación actualizada con éxito.");
      } else {
        setMessage("Error al actualizar la ubicación.");
      }
    } catch (error) {
      setMessage("Error al conectar con el servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Ubicación</h1>
      <div className="w-full max-w-md">
        <input
          type="text"
          placeholder="Latitud"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          className="w-full mb-4 rounded-lg bg-[#581845] text-[#FFFFFF] py-2 px-4 border border-opacity-50 focus:border-[#FF5733] transition-all duration-300"
        />
        <input
          type="text"
          placeholder="Longitud"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          className="w-full mb-4 rounded-lg bg-[#581845] text-[#FFFFFF] py-2 px-4 border border-opacity-50 focus:border-[#FF5733] transition-all duration-300"
        />
        <button
          onClick={updateLocation}
          className="w-full rounded-full bg-[#FF5733] text-[#FFFFFF] py-3 px-6 font-bold hover:bg-[#C70039] transition-colors duration-300"
        >
          Actualizar Ubicación
        </button>
        {message && <p className="mt-4 text-center text-sm font-semibold">{message}</p>}
      </div>
    </div>
  );
}
