"use client";

import { useState } from "react";

function Page() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    condition: "new",
    location: "",
    image_url: "",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, image_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-lg p-6 max-w-md mx-auto mt-8 space-y-4"
      >
        <h1 className="font-bold text-2xl text-[#333333]">Publicar Item</h1>
        <input
          type="text"
          placeholder="Título"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border border-gray-300 rounded-lg py-2 px-3 text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF5733] w-full"
          required
        />
        <textarea
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border border-gray-300 rounded-lg py-2 px-3 text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF5733] w-full"
        ></textarea>
        <select
          value={form.condition}
          onChange={(e) => setForm({ ...form, condition: e.target.value })}
          className="border border-gray-300 rounded-lg py-2 px-3 text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF5733] w-full"
        >
          <option value="new">Nuevo</option>
          <option value="like new">Como nuevo</option>
          <option value="used">Usado</option>
          <option value="for parts">Para partes</option>
        </select>
        <input
          type="text"
          placeholder="Ubicación"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="border border-gray-300 rounded-lg py-2 px-3 text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF5733] w-full"
          required
        />
        <input
          type="file"
          onChange={handleImageChange}
          className="border border-gray-300 rounded-lg py-2 px-3 text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#FF5733] w-full"
        />
        <button
          type="submit"
          className="bg-[#FF5733] text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-[#e04c30] transition-colors w-full"
        >
          Publicar
        </button>
      </form>
    </div>
  );
}

export default Page;
