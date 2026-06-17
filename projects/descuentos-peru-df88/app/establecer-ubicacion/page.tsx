"use client";

import { useState } from "react";
import { NextPage } from "next";
import Link from "next/link";

const EstablecerUbicacion: NextPage = () => {
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleLocationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latitude, longitude, address }),
      });
      if (response.ok) {
        setStatusMessage("Ubicación guardada exitosamente.");
      } else {
        setStatusMessage("Error al guardar la ubicación.");
      }
    } catch (error: any) {
      console.error("Error submitting location:", error);
      setStatusMessage("Error al enviar la ubicación.");
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <header className="sticky top-0 bg-[#581845] py-4">
        <nav className="flex justify-around">
          <Link href="/" className="text-[#FFC300]">Inicio</Link>
          <Link href="/mis-programas" className="text-[#FFC300]">Mis Programas</Link>
          <Link href="/establecer-ubicacion" className="text-[#FFC300]">Establecer Ubicación</Link>
        </nav>
      </header>
      <main className="mt-8">
        <h1 className="text-3xl font-bold mb-4">Establecer Ubicación</h1>
        <form onSubmit={handleLocationSubmit} className="bg-[#FFFFFF] p-4 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-[#581845] mb-2" htmlFor="latitude">Latitud</label>
            <input
              type="text"
              id="latitude"
              className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 mb-4 focus:border-[#FF5733] transition-colors duration-300 w-full"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#581845] mb-2" htmlFor="longitude">Longitud</label>
            <input
              type="text"
              id="longitude"
              className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 mb-4 focus:border-[#FF5733] transition-colors duration-300 w-full"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#581845] mb-2" htmlFor="address">Dirección</label>
            <input
              type="text"
              id="address"
              className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 mb-4 focus:border-[#FF5733] transition-colors duration-300 w-full"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#C70039] transition-colors duration-300">
            Guardar Ubicación
          </button>
        </form>
        {statusMessage && <p className="mt-4 text-[#FFC300]">{statusMessage}</p>}
      </main>
    </div>
  );
};

export default EstablecerUbicacion;
