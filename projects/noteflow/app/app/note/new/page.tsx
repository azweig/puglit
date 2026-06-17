"use client";

import { useState } from 'react';

export default function NewNotePage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [tags, setTags] = useState<{ name: string; color: string }[]>([]);

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body, reminder_time: reminderTime, tags }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        window.location.href = '/app';
      }
    } catch (error) {
      console.error('Error creating note:', error);
      alert('An error occurred while creating the note.');
    }
  };

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold mb-4'>Crear Nueva Nota</h1>
      <input
        type='text'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='Título'
        className='w-full mb-2 p-2 border border-gray-300 rounded'
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder='Contenido'
        className='w-full mb-2 p-2 border border-gray-300 rounded'
      ></textarea>
      <input
        type='datetime-local'
        value={reminderTime}
        onChange={(e) => setReminderTime(e.target.value)}
        className='w-full mb-2 p-2 border border-gray-300 rounded'
      />
      <button
        onClick={handleSubmit}
        className='bg-blue-500 text-white p-2 rounded w-full'
      >
        Guardar Nota
      </button>
    </div>
  );
}
