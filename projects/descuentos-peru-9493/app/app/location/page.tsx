"use client";

import { useEffect, useState } from "react";

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export default function LocationPage() {
  const [location, setLocation] = useState<Location>({ latitude: 0, longitude: 0, address: "" });
  const [message, setMessage] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocation((prevLocation) => ({ ...prevLocation, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(location),
      });
      if (response.ok) {
        setMessage("Ubicación guardada con éxito.");
      } else {
        setMessage("Error al guardar la ubicación.");
      }
    } catch (error) {
      setMessage("Error al conectar con el servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <h1 className="text-2xl font-bold text-[#212121] mb-4">Ubicación</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[#212121]">Dirección</label>
          <input
            type="text"
            name="address"
            value={location.address}
            onChange={handleInputChange}
            className="bg-white border border-[#FFCCBC] rounded-lg py-2 px-3 shadow-sm focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] w-full"
            placeholder="Ingrese su dirección"
          />
        </div>
        <div>
          <label className="block text-[#212121]">Latitud</label>
          <input
            type="number"
            name="latitude"
            value={location.latitude}
            onChange={handleInputChange}
            className="bg-white border border-[#FFCCBC] rounded-lg py-2 px-3 shadow-sm focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] w-full"
            placeholder="Ingrese latitud"
          />
        </div>
        <div>
          <label className="block text-[#212121]">Longitud</label>
          <input
            type="number"
            name="longitude"
            value={location.longitude}
            onChange={handleInputChange}
            className="bg-white border border-[#FFCCBC] rounded-lg py-2 px-3 shadow-sm focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] w-full"
            placeholder="Ingrese longitud"
          />
        </div>
        <button
          type="submit"
          className="bg-[#FF5722] text-white py-2 px-4 rounded-full shadow-md hover:bg-[#FF8A65] transition-all duration-300"
        >
          Guardar Ubicación
        </button>
      </form>
      {message && <p className="mt-4 text-[#212121]">{message}</p>}
    </div>
  );
}
