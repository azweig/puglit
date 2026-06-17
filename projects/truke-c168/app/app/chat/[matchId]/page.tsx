"use client";

import { useEffect, useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ id: string; body: string; is_sender: boolean; }[]>([]);
  const [message, setMessage] = useState("");
  const matchId = typeof window !== "undefined" ? window.location.pathname.split("/").pop() : "";

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await fetch(`/api/messages?match_id=${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [matchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") return;

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ match_id: matchId, body: message }),
    });

    if (response.ok) {
      setMessage("");
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500">No hay mensajes aún.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-2 ${msg.is_sender ? "text-right" : "text-left"}`}
            >
              <span
                className={`inline-block p-2 rounded-lg ${msg.is_sender ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}
              >
                {msg.body}
              </span>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-brand"
          placeholder="Escribe un mensaje..."
        />
        <button
          type="submit"
          className="bg-brand text-white p-2 rounded-r-lg hover:bg-brand-dark"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
