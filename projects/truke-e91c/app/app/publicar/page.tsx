"use client";

import { useState } from "react";

type Condition = "new" | "like new" | "used" | "worn";

export default function PublicarPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [condition, setCondition] = useState<Condition>("new");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setLoading(true);
    setError(null);
    fetch("/api/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        image_url: image,
        condition,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al publicar el item.");
        }
        return response.json();
      })
      .then(() => {
        setTitle("");
        setDescription("");
        setImage("");
        setCondition("new");
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold">Publicar</h1>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título"
        className="w-full border p-2 mb-2"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción"
        className="w-full border p-2 mb-2"
      ></textarea>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
          }
        }}
        className="w-full border p-2 mb-2"
      />
      <select
        value={condition}
        onChange={(e) => setCondition(e.target.value as Condition)}
        className="w-full border p-2 mb-2"
      >
        <option value="new">Nuevo</option>
        <option value="like new">Como nuevo</option>
        <option value="used">Usado</option>
        <option value="worn">Desgastado</option>
      </select>
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-500 text-white p-2"
        disabled={loading}
      >
        {loading ? "Publicando..." : "Publicar"}
      </button>
    </div>
  );
}
