"use client";

import { useState, useEffect } from "react";

interface LoyaltyProgram {
  id: string;
  name: string;
  provider: string;
  membership_id: string;
  expiration_date: string;
}

const LoyaltyProgramsPage = () => {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch("/api/loyalty-programs");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setPrograms(data.programs ?? []);
      } catch (err) {
        setError("Error fetching loyalty programs.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/loyalty-programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          provider,
          membership_id: membershipId,
          expiration_date: expirationDate,
        }),
      });
      if (!response.ok) throw new Error("Failed to add program");
      const newProgram: LoyaltyProgram = await response.json();
      setPrograms([...programs, newProgram]);
      setName("");
      setProvider("");
      setMembershipId("");
      setExpirationDate("");
    } catch (err) {
      setError("Error adding loyalty program.");
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <h1 className="text-3xl font-bold mb-6">Programas de Lealtad</h1>
      <form onSubmit={handleSubmit} className="bg-[#FFC300] p-6 rounded-3xl shadow-lg mb-8">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="w-full mb-4 bg-[#FFC300] text-[#581845] rounded-lg px-4 py-2 placeholder-[#C70039] focus:ring-2 focus:ring-[#FF5733]"
        />
        <input
          type="text"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="Proveedor"
          className="w-full mb-4 bg-[#FFC300] text-[#581845] rounded-lg px-4 py-2 placeholder-[#C70039] focus:ring-2 focus:ring-[#FF5733]"
        />
        <input
          type="text"
          value={membershipId}
          onChange={(e) => setMembershipId(e.target.value)}
          placeholder="ID de Membresía"
          className="w-full mb-4 bg-[#FFC300] text-[#581845] rounded-lg px-4 py-2 placeholder-[#C70039] focus:ring-2 focus:ring-[#FF5733]"
        />
        <input
          type="date"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
          className="w-full mb-4 bg-[#FFC300] text-[#581845] rounded-lg px-4 py-2 placeholder-[#C70039] focus:ring-2 focus:ring-[#FF5733]"
        />
        <button
          type="submit"
          className="w-full bg-[#FF5733] text-[#FFFFFF] rounded-full px-6 py-3 text-lg font-semibold hover:bg-[#C70039] transition-all duration-200 ease-in-out"
        >
          Agregar
        </button>
      </form>
      {loading ? (
        <p className="text-center text-lg">Cargando programas...</p>
      ) : error ? (
        <p className="text-center text-lg text-[#C70039]">{error}</p>
      ) : programs.length === 0 ? (
        <p className="text-center text-lg">No hay programas de lealtad disponibles.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {programs.map((program) => (
            <div
              key={program.id}
              className="bg-[#FFC300] text-[#FFFFFF] p-6 rounded-3xl shadow-lg transform transition-transform duration-150 ease-in-out hover:scale-105"
            >
              <h2 className="text-2xl font-bold mb-2">{program.name ?? "Sin nombre"}</h2>
              <p className="text-base font-medium mb-2">Proveedor: {program.provider ?? "Desconocido"}</p>
              <p className="text-sm font-light mb-2">ID de Membresía: {program.membership_id ?? "N/A"}</p>
              <p className="text-sm font-light">Fecha de Expiración: {program.expiration_date ?? "N/A"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoyaltyProgramsPage;
