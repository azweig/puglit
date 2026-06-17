"use client";

import { useEffect, useState } from 'react';

interface Message {
  id: string;
  body: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const matchId = window.location.pathname.split('/').pop() || '';

  useEffect(() => {
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, []);

  function fetchMessages() {
    fetch(`/api/messages?matchId=${matchId}`)
      .then(res => res.json())
      .then(data => setMessages(data));
  }

  function sendMessage() {
    if (newMessage.trim()) {
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, body: newMessage })
      }).then(() => {
        setNewMessage('');
        fetchMessages(); // Refresh messages after sending
      });
    }
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl mb-4'>Chat</h1>
      <div className='mb-4'>
        {messages.length === 0 ? (
          <p className='text-gray-500'>No messages yet.</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className='border p-2 mb-2 rounded'>
              {msg.body}
            </div>
          ))
        )}
      </div>
      <div className='flex'>
        <input
          type='text'
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className='block w-full border rounded p-2 mr-2'
          placeholder='Type your message...'
        />
        <button
          onClick={sendMessage}
          className='bg-brand text-white p-2 rounded'>
          Send
        </button>
      </div>
    </div>
  );
}
