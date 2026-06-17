"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

'use client';

interface Message {
  id: number;
  match_id: number;
  sender_id: number;
  body: string;
  created_at: string;
}

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?match_id=${matchId}`);
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.items ?? data.rows ?? []);
        setMessages(list);
      } catch (err: any) {
        setError('Failed to load messages.');
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [matchId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, body: newMessage }),
      });
      if (response.ok) {
        setNewMessage('');
        setError(null);
      } else {
        setError('Failed to send message.');
      }
    } catch (err: any) {
      setError('Failed to send message.');
    }
  };

  return (
    <div className="bg-[#F5F7FA] min-h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg p-3 mb-2 max-w-xs ${message.sender_id === 1 ? 'bg-[#FF6F61] text-white self-end' : 'bg-[#F5F7FA] text-[#4A4A4A] self-start'}`}
          >
            {message.body}
          </div>
        ))}
      </div>
      <div className="p-4 bg-white shadow-md">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:border-[#4A90E2]"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          onClick={handleSendMessage}
          className="mt-2 w-full bg-[#FF6F61] text-white py-2 px-4 rounded-full hover:bg-[#e65c52] transition-bg"
        >
          Send
        </button>
      </div>
    </div>
  );
}
