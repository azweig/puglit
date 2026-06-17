"use client";

import { useEffect, useState } from "react";

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
}

const fetchLoyaltyPrograms = async (): Promise<LoyaltyProgram[]> => {
  const response = await fetch("/api");
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

const manageUserProgram = async (programId: string, action: "add" | "remove") => {
  const response = await fetch(`/api/user`, {
    method: action === "add" ? "POST" : "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ programId }),
  });
  if (!response.ok) throw new Error("Failed to manage program");
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [userPrograms, setUserPrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const data = await fetchLoyaltyPrograms();
        setPrograms(data);
      } catch (err) {
        setError("Error loading programs.");
      } finally {
        setLoading(false);
      }
    };

    loadPrograms();
  }, []);

  const handleProgramToggle = async (programId: string) => {
    const isEnrolled = userPrograms.includes(programId);
    try {
      await manageUserProgram(programId, isEnrolled ? "remove" : "add");
      setUserPrograms((prev) =>
        isEnrolled ? prev.filter((id) => id !== programId) : [...prev, programId]
      );
    } catch {
      setError("Failed to update program.");
    }
  };

  return (
    <div className="bg-[#581845] min-h-screen p-4">
      <h1 className="text-[#FFFFFF] font-bold text-2xl mb-4">Mis Programas</h1>
      {loading ? (
        <p className="text-[#FFFFFF]">Cargando programas...</p>
      ) : error ? (
        <p className="text-[#C70039]">{error}</p>
      ) : programs.length === 0 ? (
        <p className="text-[#FFFFFF]">No hay programas disponibles.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {programs.map((program) => (
            <div
              key={program.id}
              className="rounded-3xl shadow-lg bg-[#FFFFFF] p-4 text-[#581845] transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <h2 className="font-bold text-lg">{program.name}</h2>
              <p className="font-medium text-base mb-2">{program.description}</p>
              <button
                onClick={() => handleProgramToggle(program.id)}
                className={`rounded-full px-4 py-2 text-[#FFFFFF] ${
                  userPrograms.includes(program.id)
                    ? "bg-[#900C3F] hover:bg-[#FF5733]"
                    : "bg-[#FF5733] hover:bg-[#C70039]"
                } transition-all duration-200 ease-in-out`}
              >
                {userPrograms.includes(program.id) ? "Eliminar" : "Agregar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
