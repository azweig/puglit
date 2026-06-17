"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Message {
  id: number;
  body: string;
  sender_id: number;
  receiver_id: number;
  created_at: string;
}

const ChatPage = () => {
  const { matchId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/messages?matchId=${matchId}`)
        .then((res) => res.json())
        .then((data) => setMessages(data));
    }, 2500);
    return () => clearInterval(interval);
  }, [matchId]);

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, body: newMessage }),
    });
    setNewMessage('');
  };

  return (
    <div className="p-4 bg-[#F7F7F7] min-h-screen">
      <h1 className="text-2xl font-bold text-[#333333] mb-4">Chat</h1>
      <div className="bg-white shadow-lg rounded-lg p-4 mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-600">No hay mensajes aún. Comienza la conversación!</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 mb-2 rounded-lg ${msg.sender_id === parseInt(matchId) ? 'bg-[#FF9E80] text-white' : 'bg-[#F7F7F7] text-[#333333]'}`}
            >
              {msg.body}
            </div>
          ))
        )}
      </div>
      <div className="flex items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow border border-gray-300 rounded-md py-2 px-3 mr-2"
          placeholder="Escribe un mensaje..."
        />
        <button
          onClick={sendMessage}
          className="bg-[#FF6F61] text-white font-bold py-2 px-4 rounded-full hover:scale-105 transition duration-300 ease-in-out"
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default ChatPage;