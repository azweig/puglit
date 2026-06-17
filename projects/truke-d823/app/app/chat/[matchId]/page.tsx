"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const ChatPage = () => {
  const router = useRouter();
  const { matchId } = router.query as { matchId: string };
  const [messages, setMessages] = useState<{ id: string; body: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages?match_id=${matchId}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        setMessages(data);
      } catch (error) {
        console.error(error);
      }
    };

    const interval = setInterval(fetchMessages, 2500);
    fetchMessages(); // Initial fetch
    return () => clearInterval(interval);
  }, [matchId]);

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, body: newMessage }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setNewMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className='flex flex-col items-center p-4'>
      <h1 className='text-2xl mb-4'>Chat</h1>
      <div className='flex flex-col w-full max-w-md mb-4'>
        {messages.length === 0 ? (
          <p className='text-gray-500'>No messages yet.</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className='p-2 border-b'>
              {msg.body}
            </div>
          ))
        )}
      </div>
      <input
        type='text'
        value={newMessage}
        onChange={e => setNewMessage(e.target.value)}
        className='border p-2 w-full max-w-md mb-2'
        placeholder='Type your message...'
      />
      <button
        onClick={sendMessage}
        className='bg-blue-500 text-white p-2 w-full max-w-md'
      >
        Send
      </button>
    </div>
  );
};

export default ChatPage;
