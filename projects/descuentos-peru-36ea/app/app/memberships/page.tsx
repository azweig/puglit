"use client";

import { useEffect, useState } from "react";

interface Program {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

export default function MembershipsPage() {
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();
  }, []);

  const addMembership = async (programId: string) => {
    try {
      const response = await fetch("/api/user/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId }),
      });
      if (!response.ok) {
        throw new Error("Failed to add membership");
      }
      alert("Program added to your memberships!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const removeMembership = async (programId: string) => {
    try {
      const response = await fetch("/api/user/memberships", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId }),
      });
      if (!response.ok) {
        throw new Error("Failed to remove membership");
      }
      alert("Program removed from your memberships!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  };

  if (loading) return <div className="text-center mt-4">Loading...</div>;
  if (error) return <div className="text-center mt-4 text-red-500">{error}</div>;

  return (
    <div className="p-4 bg-[#F5F5F5] min-h-screen">
      <h1 className="text-[#333333] font-bold text-2xl mb-4">Mis Programas</h1>
      <div className="grid grid-cols-2 gap-4">
        {programs.map((program) => (
          <div key={program.id} className="rounded-3xl shadow-lg p-4 bg-[#FFC300]">
            <img
              src={program.image_url ?? "/placeholder.png"}
              alt={program.name}
              className="rounded-lg mb-2 w-full h-32 object-cover"
            />
            <h2 className="text-[#333333] font-bold text-lg">{program.name}</h2>
            <p className="text-[#333333] text-opacity-50 mb-2">{program.description}</p>
            <button
              className="bg-[#FF5733] text-white py-2 px-4 rounded-full shadow-md hover:bg-opacity-90 transition"
              onClick={() => addMembership(program.id)}
            >
              Add
            </button>
            <button
              className="bg-[#C70039] text-white py-2 px-4 rounded-full shadow-sm hover:bg-opacity-90 transition mt-2"
              onClick={() => removeMembership(program.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
