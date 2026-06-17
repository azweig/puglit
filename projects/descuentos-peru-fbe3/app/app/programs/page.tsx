"use client";

import { useEffect, useState } from "react";

interface Program {
  id: string;
  name: string;
  points: number;
  status: string;
}

export default function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const response = await fetch("/api/programs");
        if (!response.ok) {
          throw new Error("Failed to fetch programs");
        }
        const data: Program[] = await response.json();
        setPrograms(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();
  }, []);

  const handleAddProgram = async (programId: string) => {
    try {
      await fetch("/api/user/memberships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ programId }),
      });
    } catch (error) {
      console.error("Failed to add program", error);
    }
  };

  const handleRemoveProgram = async (programId: string) => {
    try {
      await fetch(`/api/user/memberships`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ programId }),
      });
    } catch (error) {
      console.error("Failed to remove program", error);
    }
  };

  if (loading) return <div className="text-[#FFFFFF]">Cargando programas...</div>;
  if (error) return <div className="text-[#FF5733]">Error: {error}</div>;

  return (
    <div className="bg-[#581845] min-h-screen p-4">
      <h1 className="text-3xl font-bold text-[#FFFFFF] mb-6">Mis Programas</h1>
      <div className="grid grid-cols-1 gap-4">
        {programs.map((program) => (
          <div key={program.id} className="rounded-3xl shadow-lg bg-[#900C3F] p-6 text-[#FFFFFF]">
            <h2 className="text-xl font-bold">{program.name}</h2>
            <p className="text-base font-medium">Puntos: {program.points}</p>
            <div className="mt-2">
              <span className="rounded-full bg-[#FFC300] text-[#581845] px-3 py-1 font-semibold">
                {program.status}
              </span>
            </div>
            <div className="flex mt-4">
              <button
                onClick={() => handleAddProgram(program.id)}
                className="rounded-full bg-[#FF5733] text-[#FFFFFF] py-3 px-6 font-bold hover:bg-[#C70039] transition-colors duration-300 mr-2"
              >
                Añadir
              </button>
              <button
                onClick={() => handleRemoveProgram(program.id)}
                className="rounded-full bg-transparent border-2 border-[#FF5733] text-[#FF5733] py-3 px-6 font-medium hover:bg-[#FF5733] hover:text-[#FFFFFF] transition-colors duration-300"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
