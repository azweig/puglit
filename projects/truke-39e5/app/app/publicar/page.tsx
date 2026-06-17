"use client";
import { useState } from 'react';

export default function PublicarArticulo() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [condition, setCondition] = useState('new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        throw new Error('Failed to publish article');
      }
      setTitle('');
      setDescription('');
      setImageUrl('');
      setCondition('new');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Publicar Artículo</h1>
      <form onSubmit={handleSubmit} className='mt-4'>
        <input
          type='text'
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder='Título'
          className='w-full p-2 mb-2 border'
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder='Descripción'
          className='w-full p-2 mb-2 border'
        ></textarea>
        <input
          type='file'
          onChange={handleImageUpload}
          className='w-full p-2 mb-2'
        />
        <select
          value={condition}
          onChange={e => setCondition(e.target.value)}
          className='w-full p-2 mb-2 border'
        >
          <option value='new'>Nuevo</option>
          <option value='like new'>Como Nuevo</option>
          <option value='used'>Usado</option>
          <option value='for parts'>Para Repuestos</option>
        </select>
        <button
          type='submit'
          className='bg-blue-500 text-white p-2 rounded'
          disabled={loading}
        >
          {loading ? 'Publicando...' : 'Publicar'}
        </button>
        {error && <p className='text-red-500 mt-2'>{error}</p>}
      </form>
    </div>
  );
}
