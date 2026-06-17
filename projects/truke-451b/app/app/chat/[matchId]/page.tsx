"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Message {
  id: string;
  body: string;
}

function Chat() {
  const router = useRouter();
  const { matchId } = router.query;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await fetch(`/api/messages?matchId=${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [matchId]);

  const handleSend = async () => {
    if (newMessage.trim() === '') return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matchId, body: newMessage }),
    });
    setNewMessage('');
  };

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Chat</h1>
      <div>
        {messages.map((msg) => (
          <div key={msg.id} className='border p-2 mb-2'>
            <p>{msg.body}</p>
          </div>
        ))}
      </div>
      <input
        type='text'
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder='Escribe un mensaje...'
        className='border p-2 mb-2 w-full'
      />
      <button
        onClick={handleSend}
        className='bg-blue-500 text-white px-4 py-2'
      >
        Enviar
      </button>
    </div>
  );
}

export default Chat;
