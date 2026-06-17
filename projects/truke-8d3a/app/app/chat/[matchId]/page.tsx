use client;

import { useState, useEffect } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState<{ id: string; body: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const matchId = window.location.pathname.split('/').pop() || '';

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?matchId=${matchId}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [matchId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId, body: newMessage }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      setNewMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Chat</h1>
      <div className="mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="mb-2">
              <p className="bg-gray-100 p-2 rounded-md">{msg.body}</p>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border border-gray-300 p-2 rounded-md"
          placeholder="Type your message..."
        />
        <button type="submit" className="ml-2 bg-brand text-white p-2 rounded-md">
          Enviar
        </button>
      </form>
    </div>
  );
}