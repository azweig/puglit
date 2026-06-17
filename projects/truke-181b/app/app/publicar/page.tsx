"use client";

import { useState } from 'react';

export default function Publicar() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [condition, setCondition] = useState('new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description, imageUrl, condition }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish item.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Publicar</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="block w-full p-2 border border-gray-300 rounded"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción"
          className="block w-full p-2 border border-gray-300 rounded"
          required
        ></textarea>
        <input
          type="file"
          onChange={handleImageUpload}
          className="block w-full"
          required
        />
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded"
        >
          <option value="new">Nuevo</option>
          <option value="like_new">Como nuevo</option>
          <option value="used">Usado</option>
          <option value="for_parts">Para partes</option>
        </select>
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Publicando...' : 'Publicar'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">¡Publicado con éxito!</p>}
    </div>
  );
}
