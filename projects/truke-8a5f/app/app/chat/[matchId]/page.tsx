"use client";
import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const { query } = useRouter();
  const [messages, setMessages] = useState<{ id: number; body: string; sender_id: number }[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await fetch(`/api/messages?matchId=${query.matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [query.matchId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matchId: query.matchId, body: newMessage }),
    });
    setNewMessage('');
  };

  return (
    <div className="p-4 bg-[#FFFFFF] min-h-screen">
      <h1 className="text-2xl font-bold text-[#4A4A4A] mb-4">Chat</h1>
      <div className="mb-4 space-y-2">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg p-3 shadow-md ${msg.sender_id === 1 ? 'bg-[#FF6F61] text-[#FFFFFF]' : 'bg-[#F5A623] text-[#4A4A4A]'}`}
            >
              {msg.body}
            </div>
          ))
        ) : (
          <div className="text-[#7ED321]">No messages yet. Start the conversation!</div>
        )}
      </div>
      <div className="flex items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow border border-[#4A4A4A] rounded-lg p-2 text-[#4A4A4A] focus:border-[#FF6F61]"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-[#FF6F61] text-[#FFFFFF] font-bold py-2 px-4 rounded-full transition-colors hover:bg-opacity-90"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}