"use client";

import { useState } from 'react';

export default function PublicarObjeto() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = async () => {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        image_url: image,
        city,
      }),
    });

    if (res.ok) {
      alert('Objeto publicado!');
      setTitle('');
      setDescription('');
      setImage('');
      setCity('');
    } else {
      alert('Error al publicar el objeto.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFFFF]">
      <h1 className="font-bold text-2xl text-[#4A4A4A] mb-6">Publicar Objeto</h1>
      <div className="w-full max-w-md bg-[#F5A623] shadow-lg rounded-lg p-6">
        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-[#4A4A4A] rounded-lg p-2 text-[#4A4A4A] focus:border-[#FF6F61] w-full mb-4"
        />
        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-[#4A4A4A] rounded-lg p-2 text-[#4A4A4A] focus:border-[#FF6F61] w-full mb-4"
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
          className="mb-4"
        />
        <input
          type="text"
          placeholder="Ciudad"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border border-[#4A4A4A] rounded-lg p-2 text-[#4A4A4A] focus:border-[#FF6F61] w-full mb-4"
        />
        <button
          onClick={handleSubmit}
          className="bg-[#FF6F61] text-[#FFFFFF] font-bold py-2 px-4 rounded-full transition-colors hover:bg-opacity-90 w-full"
        >
          Publicar
        </button>
      </div>
    </div>
  );
}
