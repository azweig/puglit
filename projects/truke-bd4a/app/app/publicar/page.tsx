"use client";

import { useState } from 'react';

export default function Publicar() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [condition, setCondition] = useState('new');

  const handleSubmit = async () => {
    if (!title || !description || !imageUrl) {
      alert('Por favor, completa todos los campos antes de publicar.');
      return;
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description, imageUrl, condition }),
      });

      if (response.ok) {
        alert('¡Item publicado con éxito!');
        setTitle('');
        setDescription('');
        setImageUrl('');
        setCondition('new');
      } else {
        alert('Hubo un problema al publicar el item.');
      }
    } catch (error) {
      alert('Error de red. Inténtalo de nuevo más tarde.');
    }
  };

  return (
    <div className="p-4 bg-[#F7F7F7] min-h-screen flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4 text-[#333333]">Publicar</h1>
      <div className="bg-white shadow-lg rounded-lg p-4 w-full max-w-md">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="w-full mb-2 border border-gray-300 rounded-md py-2 px-3"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción"
          className="w-full mb-2 border border-gray-300 rounded-md py-2 px-3"
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
          className="w-full mb-2 border border-gray-300 rounded-md py-2 px-3"
        />
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="w-full mb-2 border border-gray-300 rounded-md py-2 px-3"
        >
          <option value="new">Nuevo</option>
          <option value="like new">Como nuevo</option>
          <option value="used">Usado</option>
          <option value="heavily used">Muy usado</option>
        </select>
        <button
          onClick={handleSubmit}
          className="bg-[#FF6F61] text-white font-bold py-2 px-4 rounded-full w-full hover:scale-105 transition duration-300 ease-in-out"
        >
          Publicar
        </button>
      </div>
    </div>
  );
}
