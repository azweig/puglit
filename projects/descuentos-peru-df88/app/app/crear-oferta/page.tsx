"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Merchant {
  id: string;
  name: string;
}

interface Program {
  id: string;
  name: string;
}

export default function CrearOferta() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [programId, setProgramId] = useState("");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMerchants() {
      try {
        const res = await fetch("/api/merchants");
        const data = await res.json();
        setMerchants(Array.isArray(data) ? data : []);
      } catch {
        setError("Failed to load merchants.");
      }
    }

    async function fetchPrograms() {
      try {
        const res = await fetch("/api/programs");
        const data = await res.json();
        setPrograms(Array.isArray(data) ? data : []);
      } catch {
        setError("Failed to load programs.");
      }
    }

    fetchMerchants();
    fetchPrograms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          discount_label: discountLabel,
          merchant_id: merchantId,
          program_id: programId,
        }),
      });
      if (!res.ok) throw new Error("Failed to create offer.");
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#581845] min-h-screen p-4">
      <div className="sticky top-0 bg-[#581845] text-[#FFFFFF] py-4">
        <nav className="flex justify-around">
          <Link href="/">Inicio</Link>
          <Link href="/mis-programas">Mis Programas</Link>
          <Link href="/establecer-ubicacion">Establecer Ubicación</Link>
        </nav>
      </div>
      <h1 className="text-2xl font-bold text-[#FFFFFF] mb-4">Crear Oferta</h1>
      <form onSubmit={handleSubmit} className="bg-[#FFFFFF] p-4 rounded-lg shadow-md">
        <input
          type="text"
          placeholder="Título de la oferta"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 mb-4 focus:border-[#FF5733] transition-colors duration-300 w-full"
          required
        />
        <input
          type="text"
          placeholder="Etiqueta de descuento"
          value={discountLabel}
          onChange={(e) => setDiscountLabel(e.target.value)}
          className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 mb-4 focus:border-[#FF5733] transition-colors duration-300 w-full"
          required
        />
        <select
          value={merchantId}
          onChange={(e) => setMerchantId(e.target.value)}
          className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 mb-4 focus:border-[#FF5733] transition-colors duration-300 w-full"
          required
        >
          <option value="">Seleccione un comerciante</option>
          {merchants.map((merchant) => (
            <option key={merchant.id} value={merchant.id}>
              {merchant.name}
            </option>
          ))}
        </select>
        <select
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 mb-4 focus:border-[#FF5733] transition-colors duration-300 w-full"
          required
        >
          <option value="">Seleccione un programa</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#C70039] transition-colors duration-300 w-full"
          disabled={loading}
        >
          {loading ? "Creando..." : "Crear Oferta"}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
    </div>
  );
}
