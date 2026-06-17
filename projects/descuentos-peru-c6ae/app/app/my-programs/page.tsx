"use client";

import { useEffect, useState } from "react";

interface LoyaltyProgram {
  program_id: string;
  name: string;
  description?: string;
}

export default function MyPrograms() {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [newProgram, setNewProgram] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const response = await fetch("/api/my-programs");
        if (!response.ok) throw new Error("Failed to fetch programs");
        const data = await response.json();
        setPrograms(data || []);
      } catch (err) {
        setError((err as Error).message);
      }
    }

    fetchPrograms();
  }, []);

  const handleAddProgram = async () => {
    if (!newProgram) return;
    try {
      const response = await fetch("/api/my-programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newProgram }),
      });
      if (!response.ok) throw new Error("Failed to add program");
      const newProgramData = await response.json();
      setPrograms((prev) => [...prev, newProgramData]);
      setNewProgram("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <h1 className="font-bold text-3xl mb-4">Mis Programas</h1>
      {error && <p className="text-[#FFC300]">{error}</p>}
      <div className="grid grid-cols-1 gap-4">
        {programs.length === 0 ? (
          <p className="text-center text-[#FFC300]">No tienes programas de lealtad aún.</p>
        ) : (
          programs.map((program) => (
            <div key={program.program_id} className="rounded-3xl shadow-lg bg-[#DAF7A6] p-6">
              <h2 className="font-bold text-xl text-[#900C3F]">{program.name}</h2>
              <p className="text-[#581845]">{program.description ?? "Sin descripción"}</p>
              <button className="bg-[#FF5733] text-[#FFFFFF] font-bold py-2 px-4 rounded-full shadow-md transition-transform transform hover:scale-105 mt-2">
                Editar
              </button>
            </div>
          ))
        )}
      </div>
      <div className="mt-6">
        <input
          type="text"
          value={newProgram}
          onChange={(e) => setNewProgram(e.target.value)}
          placeholder="Nuevo programa"
          className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full mb-2"
        />
        <button
          onClick={handleAddProgram}
          className="bg-[#FF5733] text-[#FFFFFF] font-bold py-3 px-6 rounded-full shadow-md transition-transform transform hover:scale-105 w-full"
        >
          Añadir Programa
        </button>
      </div>
    </div>
  );
}
