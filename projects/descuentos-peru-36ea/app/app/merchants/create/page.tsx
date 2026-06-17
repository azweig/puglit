"use client";

import { useState } from "react";

export default function CreateMerchant() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/merchants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, category }),
      });

      if (!response.ok) {
        throw new Error("Failed to create merchant");
      }

      setSuccess(true);
      setName("");
      setCategory("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-6 bg-[#F5F5F5] h-screen">
      <h1 className="text-[#333333] text-2xl font-bold">Create Merchant</h1>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">Merchant created successfully!</div>}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Merchant Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-[#900C3F] rounded-lg px-4 py-2 focus:border-[#FF5733] focus:ring focus:ring-[#FF5733]/50 transition"
          required
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-[#900C3F] rounded-lg px-4 py-2 focus:border-[#FF5733] focus:ring focus:ring-[#FF5733]/50 transition"
          required
        />
        <button
          type="submit"
          className="bg-[#FF5733] text-white py-3 px-6 rounded-full shadow-md hover:bg-opacity-90 transition"
        >
          Create
        </button>
      </form>
    </div>
  );
}
