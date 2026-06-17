"use client";

import { useState, useEffect } from 'react';

interface ChatMessage {
  id: string;
  body: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const matchId = window.location.pathname.split('/').pop();

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/messages?matchId=${matchId}`)
        .then((res) => res.json())
        .then(setMessages);
    }, 2500);

    return () => clearInterval(interval);
  }, [matchId]);

  function sendMessage() {
    fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matchId, body: newMessage }),
    }).then(() => {
      setNewMessage('');
      fetch(`/api/messages?matchId=${matchId}`)
        .then((res) => res.json())
        .then(setMessages);
    });
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold">Chat</h1>
      <div className="mt-4 w-full max-w-md">
        {messages.map((msg) => (
          <div key={msg.id} className="border p-2 mb-2">
            {msg.body}
          </div>
        ))}
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="w-full border p-2"
          placeholder="Escribe un mensaje..."
        ></textarea>
        <button
          onClick={sendMessage}
          className="bg-green-500 text-white px-4 py-2 mt-2"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
