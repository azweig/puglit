"use client";

import { useEffect, useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ id: string; sender_id: string; body: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const matchId = window.location.pathname.split("/").pop();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/list.ts?matchId=${matchId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        } else {
          console.error("Failed to fetch messages.");
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [matchId]);

  const sendMessage = async () => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId, body: newMessage }),
      });
      if (response.ok) {
        setNewMessage("");
      } else {
        console.error("Failed to send message.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <strong>{msg.sender_id}</strong>: {msg.body}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow border border-gray-300 p-2 rounded-l"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="bg-[var(--brand)] text-white p-2 rounded-r"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
