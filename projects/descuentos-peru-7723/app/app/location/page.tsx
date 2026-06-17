"use client";

import { useState, useEffect } from "react";

export default function LocationPage() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        () => {
          setError("No se pudo obtener la ubicación actual.");
        }
      );
    } else {
      setError("La geolocalización no es compatible con este navegador.");
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (latitude !== null && longitude !== null) {
      try {
        const response = await fetch("/api/location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ latitude, longitude, address }),
        });

        if (!response.ok) {
          throw new Error("Error al guardar la ubicación.");
        }

        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    } else {
      setError("Ubicación no válida.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Ubicación</h1>
      <form className="w-full max-w-md bg-[#FFFFFF] text-[#581845] rounded-3xl shadow-lg p-6" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" htmlFor="address">
            Dirección
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-md border border-[#C70039] bg-[#FFFFFF] text-[#581845] px-3 py-2 w-full focus:border-[#FF5733]"
            placeholder="Ingrese su dirección"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-[#FF5733] text-[#FFFFFF] px-4 py-2 w-full hover:bg-[#C70039] transition-all duration-200 ease-in-out"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar Ubicación"}
        </button>
        {error && <p className="text-[#C70039] mt-4">{error}</p>}
      </form>
    </div>
  );
}
