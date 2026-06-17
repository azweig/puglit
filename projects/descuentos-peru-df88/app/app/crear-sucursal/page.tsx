"use client";

import { useState } from "react";
import { NextPage } from "next";
import Link from "next/link";

const CrearSucursal: NextPage = () => {
  const [merchantId, setMerchantId] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);

    try {
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchant_id: parseInt(merchantId, 10),
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setMerchantId("");
        setAddress("");
        setLatitude("");
        setLongitude("");
      } else {
        setSuccess(false);
      }
    } catch (error: any) {
      console.error("Error creating branch:", error);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <header className="sticky top-0 bg-[#900C3F] p-4 mb-4">
        <nav className="flex justify-between">
          <Link href="/" className="text-xl font-bold">Inicio</Link>
          <Link href="/mis-programas" className="text-xl font-bold">Mis Programas</Link>
          <Link href="/establecer-ubicacion" className="text-xl font-bold">Establecer Ubicación</Link>
        </nav>
      </header>

      <main className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-4">Crear Sucursal</h1>
        <form onSubmit={handleSubmit} className="bg-[#FFFFFF] p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-[#581845] mb-2" htmlFor="merchantId">
              Merchant ID
            </label>
            <input
              id="merchantId"
              type="text"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 mb-4 focus:border-[#FF5733] transition-colors duration-300 w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#581845] mb-2" htmlFor="address">
              Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 mb-4 focus:border-[#FF5733] transition-colors duration-300 w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#581845] mb-2" htmlFor="latitude">
              Latitude
            </label>
            <input
              id="latitude"
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 mb-4 focus:border-[#FF5733] transition-colors duration-300 w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#581845] mb-2" htmlFor="longitude">
              Longitude
            </label>
            <input
              id="longitude"
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 mb-4 focus:border-[#FF5733] transition-colors duration-300 w-full"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#C70039] transition-colors duration-300 w-full"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Branch"}
          </button>
          {success === true && (
            <p className="text-green-500 mt-4">Branch created successfully!</p>
          )}
          {success === false && (
            <p className="text-red-500 mt-4">Failed to create branch. Please try again.</p>
          )}
        </form>
      </main>
    </div>
  );
};

export default CrearSucursal;
