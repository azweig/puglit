"use client";

import { useEffect, useState } from "react";

interface Program {
  id: number;
  name: string;
  provider: string;
  is_active: boolean;
}

const MisProgramas = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [memberships, setMemberships] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch("/api/programs");
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.items ?? data.rows ?? []);
        setPrograms(list);
        setLoading(false);
      } catch (err: any) {
        setError("Failed to load programs.");
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const toggleMembership = async (programId: number) => {
    const isMember = memberships.has(programId);
    const method = isMember ? "DELETE" : "POST";

    try {
      await fetch("/api/memberships", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ program_id: programId }),
      });

      setMemberships((prev) => {
        const updated = new Set(prev);
        if (isMember) {
          updated.delete(programId);
        } else {
          updated.add(programId);
        }
        return updated;
      });
    } catch (err: any) {
      setError("Failed to update membership.");
    }
  };

  if (loading) return <div className="text-[#FFFFFF]">Loading...</div>;
  if (error) return <div className="text-[#FFFFFF]">{error}</div>;

  return (
    <div className="bg-[#581845] min-h-screen p-4">
      <h1 className="text-2xl font-bold text-[#FFFFFF] mb-4">Mis Programas de Lealtad</h1>
      <div className="grid grid-cols-1 gap-4">
        {programs.map((program) => (
          <div key={program.id} className="bg-[#FFFFFF] p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-[#581845]">{program.name}</h2>
            <p className="text-[#900C3F]">{program.provider}</p>
            <button
              className={`mt-2 ${memberships.has(program.id) ? "bg-[#C70039]" : "bg-[#FF5733]"} text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#FFC300] transition-colors duration-300`}
              onClick={() => toggleMembership(program.id)}
            >
              {memberships.has(program.id) ? "Remove from Memberships" : "Add to Memberships"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MisProgramas;