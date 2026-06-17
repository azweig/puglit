"use client";

import { useEffect, useState } from "react";

interface Program {
  id: string;
  name: string;
  provider: string;
}

export default function MembershipsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/programs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load programs");
        return res.json();
      })
      .then((data) => {
        setPrograms(data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-[#581845] min-h-screen p-4 text-[#FFFFFF]">
      <h1 className="text-2xl font-bold mb-4">Mis Programas de Lealtad</h1>
      {loading && <p className="text-base font-medium">Cargando programas...</p>}
      {error && <p className="text-base font-medium text-[#C70039]">Error: {error}</p>}
      {!loading && !error && programs.length === 0 && (
        <p className="text-base font-medium">No hay programas disponibles.</p>
      )}
      <div className="grid grid-cols-1 gap-4">
        {programs.map((program) => (
          <div
            key={program.id}
            className="rounded-3xl bg-[#FFC300] shadow-lg p-6 transform transition-all duration-300 hover:scale-105"
          >
            <h2 className="text-xl font-bold mb-2">{program.name ?? "Sin nombre"}</h2>
            <p className="text-base font-medium">Proveedor: {program.provider ?? "Desconocido"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
