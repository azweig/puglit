"use client";

import { useState } from 'react';

export default function Publicar() {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [condition, setCondition] = useState<string>('new');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result?.toString() || '');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/items/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          imageUrl,
          condition,
        }),
      });
      setTitle('');
      setDescription('');
      setImageUrl('');
      setCondition('new');
    } catch (error) {
      console.error('Error creating item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-[#F4F4F4] min-h-screen">
      <h1 className="text-2xl font-bold text-[#333333] mb-4">Publicar</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          required
          className="w-full border border-[#CCCCCC] rounded-lg px-4 py-2 focus:border-[#4A90E2] transition-all duration-200"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción"
          required
          className="w-full border border-[#CCCCCC] rounded-lg px-4 py-2 focus:border-[#4A90E2] transition-all duration-200"
        ></textarea>
        <input
          type="file"
          onChange={handleImageUpload}
          required
          className="w-full border border-[#CCCCCC] rounded-lg px-4 py-2 focus:border-[#4A90E2] transition-all duration-200"
        />
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="w-full border border-[#CCCCCC] rounded-lg px-4 py-2 focus:border-[#4A90E2] transition-all duration-200"
        >
          <option value="new">Nuevo</option>
          <option value="like new">Como nuevo</option>
          <option value="used">Usado</option>
          <option value="worn">Desgastado</option>
        </select>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#FF6F61] text-white rounded-full px-6 py-3 shadow-md hover:bg-[#FF9E80] transition-colors duration-200"
        >
          {isSubmitting ? 'Publicando...' : 'Publicar'}
        </button>
      </form>
    </div>
  );
}
