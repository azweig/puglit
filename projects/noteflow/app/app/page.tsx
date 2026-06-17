import { useEffect, useState } from 'react';

interface Note {
  id: string;
  title: string;
  body: string;
  reminder?: {
    reminder_time: string;
  };
  tags: { id: string; name: string; color: string }[];
}

export default function Page() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch('/api/notes');
        if (!res.ok) throw new Error('Failed to fetch notes');
        const data = await res.json();
        setNotes(data.notes);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  if (loading) return <div className='p-4'>Cargando notas...</div>;
  if (error) return <div className='p-4 text-red-500'>Error: {error}</div>;
  if (notes.length === 0) return <div className='p-4'>No hay notas disponibles.</div>;

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Mis Notas</h1>
      <ul>
        {notes.map(note => (
          <li key={note.id} className='border-b py-2'>
            <h2 className='text-lg'>{note.title}</h2>
            <p>{note.body}</p>
            {note.reminder && (
              <p className='text-sm text-gray-500'>
                Recordatorio: {new Date(note.reminder.reminder_time).toLocaleString()}
              </p>
            )}
            <div className='flex'>
              {note.tags.map(tag => (
                <span key={tag.id} className='mr-2' style={{ backgroundColor: tag.color }}>
                  {tag.name}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
