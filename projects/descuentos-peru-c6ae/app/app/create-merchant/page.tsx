"use client";

import { useState } from "react";

export default function CreateMerchant() {
  const [merchantName, setMerchantName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!merchantName || !category) {
      setError("Por favor, complete todos los campos obligatorios.");
      return;
    }

    try {
      const response = await fetch("/api/merchants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: merchantName,
          category,
          description,
          image,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear el comerciante.");
      }

      setSuccess(true);
      setMerchantName("");
      setCategory("");
      setDescription("");
      setImage(null);
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Crear Comerciante</h1>
      <form className="w-full max-w-md bg-[#DAF7A6] p-6 rounded-3xl shadow-lg" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-[#900C3F] font-medium mb-2">Nombre del Comerciante</label>
          <input
            type="text"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg w-full focus:outline-none focus:border-[#FF5733]"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-[#900C3F] font-medium mb-2">Categoría</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg w-full focus:outline-none focus:border-[#FF5733]"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-[#900C3F] font-medium mb-2">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg w-full focus:outline-none focus:border-[#FF5733]"
            rows={4}
          />
        </div>
        <div className="mb-4">
          <label className="block text-[#900C3F] font-medium mb-2">Imagen</label>
          <input
            type="file"
            onChange={handleImageUpload}
            className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg w-full focus:outline-none focus:border-[#FF5733]"
          />
        </div>
        {error && <p className="text-[#FF5733] mb-4">{error}</p>}
        {success && <p className="text-[#FFC300] mb-4">Comerciante creado con éxito!</p>}
        <button
          type="submit"
          className="bg-[#FF5733] text-[#FFFFFF] font-bold py-3 px-6 rounded-full shadow-md transition-transform transform hover:scale-105 w-full"
        >
          Crear Comerciante
        </button>
      </form>
    </div>
  );
}
