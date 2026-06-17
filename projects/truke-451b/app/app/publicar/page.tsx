"use client";

import { useState } from 'react';

function Publicar() {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [condition, setCondition] = useState<string>('new');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description, imageUrl, condition }),
      });
      if (res.ok) {
        alert('Item publicado!');
        setTitle('');
        setDescription('');
        setImageUrl('');
        setCondition('new');
      } else {
        setError('Error al publicar el ítem.');
      }
    } catch (error) {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <h1 className="text-xl font-bold">Publicar un nuevo ítem</h1>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título"
        className="border p-2 mb-2 w-full"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción"
        className="border p-2 mb-2 w-full"
      ></textarea>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => setImageUrl(reader.result as string);
            reader.readAsDataURL(file);
          }
        }}
        className="mb-2"
      />
      <select
        value={condition}
        onChange={(e) => setCondition(e.target.value)}
        className="border p-2 mb-2 w-full"
      >
        <option value="new">Nuevo</option>
        <option value="like new">Como nuevo</option>
        <option value="good">Bueno</option>
        <option value="fair">Regular</option>
        <option value="poor">Malo</option>
      </select>
      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2"
        disabled={loading}
      >
        {loading ? 'Publicando...' : 'Publicar'}
      </button>
    </form>
  );
}

export default Publicar;