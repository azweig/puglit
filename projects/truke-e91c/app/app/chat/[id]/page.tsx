"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface ChatMessage {
  id: string;
  message: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { id } = router.query;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => {
      fetch(`/api/messages?match_id=${id}`)
        .then((res) => res.json())
        .then(setMessages)
        .catch((error) => console.error('Error fetching messages:', error));
    }, 2500);
    return () => clearInterval(interval);
  }, [id]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ match_id: id, body: newMessage }),
    })
      .then(() => {
        setNewMessage('');
      })
      .catch((error) => console.error('Error sending message:', error));
  };

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold">Chat</h1>
      <div className="space-y-2">
        {messages.length === 0 ? (
          <p className="text-gray-500">No hay mensajes aún.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="p-2 bg-gray-100 rounded">
              <p>{msg.message}</p>
            </div>
          ))
        )}
      </div>
      <textarea
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        className="w-full mt-4 p-2 border rounded"
        placeholder="Escribe un mensaje..."
      />
      <button
        onClick={handleSend}
        className="w-full mt-2 bg-blue-500 text-white py-2 rounded"
      >
        Enviar
      </button>
    </div>
  );
}
