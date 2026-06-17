"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublicarItem() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("new");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, condition, image_url: image }),
      });

      if (!response.ok) {
        throw new Error("Failed to post item.");
      }

      router.push("/");
    } catch (error: unknown) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-[#4A4A4A] mb-4">Publicar Item</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <div className="mb-4">
          <label className="block text-gray-600 mb-2">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-gray-300 rounded-lg py-2 px-3 focus:border-[#4A90E2] w-full"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 mb-2">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-300 rounded-lg py-2 px-3 focus:border-[#4A90E2] w-full"
            rows={4}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 mb-2">Condición</label>
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
          <label className="block text-gray-600 mb-2">Imagen</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="border border-gray-300 rounded-lg py-2 px-3 focus:border-[#4A90E2] w-full"
          />
        </div>
        {error && <p className="text-[#D0021B] mb-4">{error}</p>}
        <button
          type="submit"
          className="bg-[#FF6F61] text-white py-2 px-4 rounded-full w-full hover:bg-[#e65c52] transition-bg"
          disabled={loading}
        >
          {loading ? "Publicando..." : "Publicar"}
        </button>
      </form>
    </div>
  );
}
