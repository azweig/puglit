"use client";

import { useEffect, useState } from "react";

interface Program {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

export default function MembershipsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [userMemberships, setUserMemberships] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        setLoading(true);
        const response = await fetch("/api/programs");
        if (!response.ok) throw new Error("Failed to fetch programs");
        const data: Program[] = await response.json();
        setPrograms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, []);

  const toggleMembership = async (programId: number, isActive: boolean) => {
    try {
      const method = isActive ? "DELETE" : "POST";
      const response = await fetch("/api/user_memberships", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ programId }),
      });
      if (!response.ok) throw new Error("Failed to update membership");
      setUserMemberships((prev) =>
        isActive
          ? prev.filter((id) => id !== programId)
          : [...prev, programId]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  if (loading) return <div className="text-center mt-4">Cargando...</div>;
  if (error) return <div className="text-center mt-4 text-red-500">{error}</div>;
  if (!programs.length) return <div className="text-center mt-4">No hay programas disponibles.</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-[#212121] mb-4">Mis Programas</h1>
      <div className="grid grid-cols-1 gap-4">
        {programs.map((program) => {
          const isActive = userMemberships.includes(program.id);
          return (
            <div key={program.id} className="rounded-3xl shadow-lg bg-[#FFCCBC] p-4 relative">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#212121]">{program.name}</h2>
                  <p className="text-sm text-[#212121]">{program.description}</p>
                </div>
                {isActive && <span className="bg-[#4CAF50] text-white text-xs px-2 py-1 rounded-full">Activo</span>}
              </div>
              <button
                onClick={() => toggleMembership(program.id, isActive)}
                className={`mt-4 ${
                  isActive ? "bg-[#FFC107] hover:bg-[#FFD54F]" : "bg-[#FF5722] hover:bg-[#FF8A65]"
                } text-white py-2 px-4 rounded-full shadow-md transition-all duration-300`}
              >
                {isActive ? "Eliminar" : "Agregar"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
