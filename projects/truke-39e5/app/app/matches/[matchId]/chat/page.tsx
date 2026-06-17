"use client";

import { useEffect, useState } from 'react';

interface Message {
  id: string;
  body: string;
  isSenderUser: boolean;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const matchId = window.location.pathname.split('/')[3];

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/messages?matchId=${matchId}`)
        .then(res => res.json())
        .then(data => setMessages(data));
    }, 2500);

    return () => clearInterval(interval);
  }, [matchId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matchId, body: newMessage }),
    }).then(() => {
      setNewMessage('');
    });
  };

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Chat</h1>
      <div className='mt-4'>
        {messages.map(msg => (
          <div key={msg.id} className={`mb-2 ${msg.isSenderUser ? 'text-right' : 'text-left'}`}>
            <p className='inline-block p-2 bg-gray-200 rounded'>{msg.body}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className='mt-4'>
        <input
          type='text'
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder='Escribe un mensaje...'
          className='w-full p-2 mb-2 border'
        />
        <button type='submit' className='bg-blue-500 text-white p-2 rounded'>Enviar</button>
      </form>
    </div>
  );
};

export default ChatPage;
