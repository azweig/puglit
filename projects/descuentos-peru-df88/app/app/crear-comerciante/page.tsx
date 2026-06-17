"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CrearComerciante() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/merchants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, category }),
      });

      if (!response.ok) {
        throw new Error("Failed to create merchant.");
      }

      router.push("/");
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Crear Comerciante</h1>
        <form onSubmit={handleSubmit} className="bg-[#FFFFFF] p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-[#581845] font-bold mb-2">Nombre del Comerciante</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 w-full focus:border-[#FF5733] transition-colors duration-300"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-[#581845] font-bold mb-2">Categoría</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#FFFFFF] border-b-2 border-[#C70039] text-[#581845] py-2 px-3 w-full focus:border-[#FF5733] transition-colors duration-300"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#C70039] transition-colors duration-300 w-full"
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear Comerciante"}
          </button>
        </form>
      </div>
    </div>
  );
}
