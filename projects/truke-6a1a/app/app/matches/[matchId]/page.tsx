"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ id: number; body: string; isSender: boolean; }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { matchId } = useParams();

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/messages?matchId=${matchId}`)
        .then((res) => res.json())
        .then((data) => setMessages(data));
    }, 2500);
    return () => clearInterval(interval);
  }, [matchId]);

  function handleSendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, body: newMessage })
    }).then(() => setNewMessage(''));
  }

  return (
    <div className="bg-[#F4F4F4] min-h-screen flex flex-col justify-between">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-[#333333] mb-4">Chat</h1>
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-3xl shadow-lg p-4 max-w-xs ${msg.isSender ? 'bg-[#FF6F61] text-white self-end' : 'bg-white text-[#333333] self-start'}`}
            >
              {msg.body}
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={handleSendMessage} className="bg-white p-4 flex items-center shadow-md">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          required
          className="flex-grow border border-[#CCCCCC] rounded-lg px-4 py-2 focus:border-[#4A90E2] transition-all duration-200"
        />
        <button
          type="submit"
          className="bg-[#FF6F61] text-white rounded-full px-6 py-3 shadow-md hover:bg-[#FF9E80] transition-colors duration-200 ml-2"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
