"use client";

import { useEffect, useState } from "react";

interface Branch {
  id: string;
  name: string;
  address: string;
  distance: number;
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await fetch("/api/branches");
        if (!response.ok) throw new Error("Failed to load branches.");
        const data = await response.json();
        setBranches(data ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchBranches();
  }, []);

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF]">
      <header className="p-4 text-center text-2xl font-bold">Sucursales</header>
      {loading ? (
        <p className="text-center mt-8">Cargando sucursales...</p>
      ) : error ? (
        <p className="text-center mt-8 text-[#C70039]">{error}</p>
      ) : branches.length === 0 ? (
        <p className="text-center mt-8">No hay sucursales disponibles.</p>
      ) : (
        <div className="p-4 space-y-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-[#FFC300] rounded-3xl shadow-lg p-4 transition-all duration-300 transform hover:scale-105"
            >
              <h2 className="text-xl font-bold">{branch.name ?? "Sucursal sin nombre"}</h2>
              <p className="font-medium">{branch.address ?? "Dirección no disponible"}</p>
              <p className="font-medium">Distancia: {branch.distance ?? "N/A"} km</p>
            </div>
          ))}
        </div>
      )}
      <nav className="fixed bottom-0 w-full bg-[#900C3F] text-[#FFFFFF] py-3 flex justify-around items-center">
        <a href="/app" className="text-center">Descubrir</a>
        <a href="/app/memberships" className="text-center">Mis Programas</a>
        <a href="/app/location" className="text-center">Ubicación</a>
      </nav>
    </div>
  );
}
