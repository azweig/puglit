"use client";

import { useEffect, useState } from "react";

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
}

export default function MembershipsPage() {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [catalog, setCatalog] = useState<LoyaltyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>("");

  useEffect(() => {
    async function fetchUserPrograms() {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) throw new Error("Failed to fetch user programs");
        const data = await response.json();
        setPrograms(data ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCatalog() {
      try {
        const response = await fetch("/api");
        if (!response.ok) throw new Error("Failed to fetch catalog");
        const data = await response.json();
        setCatalog(data ?? []);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchUserPrograms();
    fetchCatalog();
  }, []);

  const handleAddProgram = async () => {
    if (!selectedProgram) return;
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ programId: selectedProgram }),
      });
      if (!response.ok) throw new Error("Failed to add program");
      const newProgram = catalog.find((p) => p.id === selectedProgram);
      if (newProgram) {
        setPrograms([...programs, newProgram]);
        setSelectedProgram("");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen p-4">
      <h1 className="text-2xl font-bold text-[#333333] mb-4">Mis Programas</h1>
      {loading ? (
        <p className="text-[#333333]">Cargando...</p>
      ) : error ? (
        <p className="text-[#FF5733]">{error}</p>
      ) : programs.length === 0 ? (
        <p className="text-[#333333]">No tienes programas de lealtad.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {programs.map((program) => (
            <div key={program.id} className="rounded-lg shadow-md bg-[#FFC300] p-4 mb-4">
              <img
                src={program.icon_url ?? "/placeholder.png"}
                alt={program.name}
                className="w-12 h-12 mb-2"
              />
              <h2 className="text-xl font-bold text-[#333333]">{program.name}</h2>
              <p className="text-[#333333]">{program.description}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-[#333333] mb-2">Agregar nuevo programa</h2>
        <select
          className="border border-[#C70039] rounded-md p-2 w-full mb-4"
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
        >
          <option value="">Selecciona un programa</option>
          {catalog.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
        <button
          className="bg-[#FF5733] text-white py-2 px-4 rounded-md hover:bg-[#C70039] transition duration-200 ease-in-out"
          onClick={handleAddProgram}
        >
          Agregar Programa
        </button>
      </div>
    </div>
  );
}
