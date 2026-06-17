"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LocationPage() {
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const locationInterval = setInterval(() => {
      // Logic to update location if needed
    }, 10000);
    return () => {
      clearInterval(locationInterval);
    };
  }, []);

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Guardando ubicación...");
    try {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude, longitude, address }),
      });
      if (response.ok) {
        setStatus("Ubicación guardada exitosamente.");
      } else {
        setStatus("Error al guardar la ubicación.");
      }
    } catch (error) {
      setStatus("Error de red.");
    }
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen p-4">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-[#900C3F] text-2xl font-bold">Ubicación</h1>
        <nav className="flex space-x-4">
          <Link href="/app" className="text-[#FF5733]">Descubrir</Link>
          <Link href="/app/memberships" className="text-[#FF5733]">Mis Programas</Link>
          <Link href="/app/location" className="text-[#FF5733]">Ubicación</Link>
        </nav>
      </header>

      <main className="mt-20">
        <form onSubmit={handleLocationSubmit} className="bg-[#FFC300] rounded-lg shadow-md p-4">
          <div className="mb-4">
            <label className="block text-[#333333] mb-2">Latitud</label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="border border-[#C70039] rounded-md p-2 w-full focus:outline-none focus:border-[#FF5733]"
              placeholder="Ingrese la latitud"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#333333] mb-2">Longitud</label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="border border-[#C70039] rounded-md p-2 w-full focus:outline-none focus:border-[#FF5733]"
              placeholder="Ingrese la longitud"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#333333] mb-2">Dirección</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border border-[#C70039] rounded-md p-2 w-full focus:outline-none focus:border-[#FF5733]"
              placeholder="Ingrese la dirección"
            />
          </div>
          <button type="submit" className="bg-[#FF5733] text-white py-2 px-4 rounded-md hover:bg-[#C70039] transition duration-200 ease-in-out">
            Guardar Ubicación
          </button>
        </form>
        {status && <p className="mt-4 text-[#FF5733]">{status}</p>}
      </main>
    </div>
  );
}
