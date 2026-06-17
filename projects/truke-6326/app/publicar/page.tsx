"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublicarItem() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("new");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title || !imageDataUrl) {
      setError("Por favor, complete todos los campos requeridos.");
      return;
    }
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          condition,
          image_url: imageDataUrl,
        }),
      });
      if (!response.ok) {
        throw new Error("Error al publicar el item.");
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-[#F5F7FA] min-h-screen p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-[#4A4A4A] mb-6">Publicar Item</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-4 w-full max-w-md">
        {error && <div className="bg-[#D0021B] text-white p-2 rounded mb-4">{error}</div>}
        <div className="mb-4">
          <label className="block text-[#4A4A4A] mb-2">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-gray-300 rounded-lg py-2 px-3 focus:border-[#4A90E2] w-full"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-[#4A4A4A] mb-2">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-300 rounded-lg py-2 px-3 focus:border-[#4A90E2] w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block text-[#4A4A4A] mb-2">Condición</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="border border-gray-300 rounded-lg py-2 px-3 focus:border-[#4A90E2] w-full"
          >
            <option value="new">Nuevo</option>
            <option value="like new">Como nuevo</option>
            <option value="used">Usado</option>
            <option value="for parts">Para partes</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-[#4A4A4A] mb-2">Imagen</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="border border-gray-300 rounded-lg py-2 px-3 focus:border-[#4A90E2] w-full"
            required
          />
        </div>
        <button type="submit" className="bg-[#FF6F61] text-white py-2 px-4 rounded-full hover:bg-[#e65c52] transition-bg w-full">
          Publicar
        </button>
      </form>
    </div>
  );
}
