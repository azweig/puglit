"use client";

import { useEffect, useState } from "react";

interface Program {
  id: string;
  name: string;
  logo_url: string;
}

interface Membership {
  programId: string;
}

export default function MembershipsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [programsRes, membershipsRes] = await Promise.all([
          fetch("/api/programs"),
          fetch("/api/user_memberships"),
        ]);

        if (!programsRes.ok || !membershipsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const programsData = await programsRes.json();
        const membershipsData = await membershipsRes.json();

        setPrograms(programsData ?? []);
        setMemberships(membershipsData ?? []);
      } catch (err) {
        setError("Error loading data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const toggleMembership = async (programId: string) => {
    const isMember = memberships.some((m) => m.programId === programId);
    const url = "/api/user_memberships";
    const method = isMember ? "DELETE" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ programId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update membership");
      }

      setMemberships((prev) =>
        isMember
          ? prev.filter((m) => m.programId !== programId)
          : [...prev, { programId }]
      );
    } catch {
      setError("Error updating membership");
    }
  };

  if (loading) return <div className="text-[#FFFFFF]">Loading...</div>;
  if (error) return <div className="text-[#C70039]">{error}</div>;

  return (
    <div className="bg-[#581845] min-h-screen p-4">
      <h1 className="text-[#FFFFFF] text-3xl font-bold mb-4">Mis Programas</h1>
      <div className="grid grid-cols-1 gap-4">
        {programs.length === 0 && (
          <div className="text-[#FFFFFF]">No programs available.</div>
        )}
        {programs.map((program) => {
          const isMember = memberships.some(
            (membership) => membership.programId === program.id
          );
          return (
            <div
              key={program.id}
              className="bg-[#FFFFFF] rounded-3xl shadow-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center">
                <img
                  src={program.logo_url ?? "/placeholder-logo.png"}
                  alt={program.name}
                  className="w-16 h-16 object-cover rounded-full mr-4"
                />
                <span className="text-[#581845] font-medium">
                  {program.name ?? "Sin nombre"}
                </span>
              </div>
              <button
                onClick={() => toggleMembership(program.id)}
                className={`px-4 py-2 rounded-full transition-all duration-200 ease-in-out ${
                  isMember ? "bg-[#C70039]" : "bg-[#FF5733]"
                } text-[#FFFFFF]`}
              >
                {isMember ? "Eliminar" : "Añadir"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
