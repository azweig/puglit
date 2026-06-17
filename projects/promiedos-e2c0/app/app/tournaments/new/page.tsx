"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateNewTournament() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, logo }),
      });

      if (!response.ok) {
        throw new Error("Failed to create tournament");
      }

      router.push("/tournaments");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF]">
      <div className="fixed top-0 left-0 right-0 bg-[#C70039] p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Create New Tournament</h1>
          <div className="space-x-4">
            <Link href="/" className="text-[#FFC300]">Inicio</Link>
            <Link href="/tournaments" className="text-[#FFC300]">Torneos</Link>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-20 p-4">
        <div className="bg-[#C70039] p-4 rounded-lg shadow-md mb-4">
          <label htmlFor="name" className="block text-lg font-bold mb-2">Tournament Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-2 border-[#FFC300] bg-transparent text-[#FFFFFF] p-2 rounded-md w-full focus:outline-none focus:border-[#FF5733]"
            required
          />
        </div>

        <div className="bg-[#C70039] p-4 rounded-lg shadow-md mb-4">
          <label htmlFor="logo" className="block text-lg font-bold mb-2">Tournament Logo</label>
          <input
            id="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="w-full text-[#FFFFFF]"
          />
          {logo && <img src={logo} alt="Tournament Logo" className="mt-4 max-h-48" />}
        </div>

        {error && <p className="text-[#FFC300] mb-4">{error}</p>}

        <button
          type="submit"
          className="bg-[#FF5733] text-[#FFFFFF] py-2 px-4 rounded-full hover:bg-[#FFC300] transition duration-200"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Tournament"}
        </button>
      </form>
    </div>
  );
}
