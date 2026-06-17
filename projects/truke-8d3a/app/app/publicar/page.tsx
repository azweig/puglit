"use client";

import { useState } from 'react';

export default function Publicar() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [condition, setCondition] = useState('new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description, imageUrl, condition }),
      });
      if (!response.ok) {
        throw new Error('Failed to create item');
      }
      setTitle('');
      setDescription('');
      setImageUrl('');
      setCondition('new');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Publicar</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título"
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descripción"
          className="w-full p-2 border border-gray-300 rounded"
          required
        ></textarea>
        <input
          type="file"
          onChange={handleImageUpload}
          className="w-full"
        />
        <select
          value={condition}
          onChange={e => setCondition(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="new">Nuevo</option>
          <option value="like new">Como nuevo</option>
          <option value="used">Usado</option>
          <option value="for parts">Para partes</option>
        </select>
        <button
          type="submit"
          className="w-full p-2 bg-[var(--brand)] text-white rounded"
          disabled={loading}
        >
          {loading ? 'Publicando...' : 'Publicar'}
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}
