"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

function Page() {
  const router = useRouter();
  const { matchId } = router.query;
  const [messages, setMessages] = useState<{ id: string, sender_id: string, body: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const userId = 'currentUserId'; // Replace with actual user ID from context/auth

  useEffect(() => {
    const interval = setInterval(() => {
      if (matchId) {
        fetch(`/api/messages?match_id=${matchId}`)
          .then(res => res.json())
          .then(data => setMessages(data));
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [matchId]);

  const sendMessage = () => {
    if (newMessage.trim() !== '') {
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, body: newMessage })
      });
      setNewMessage('');
    }
  };

  return (
    <div className='flex flex-col h-screen bg-[#F5F5F5]'>
      <div className='flex-1 overflow-y-auto space-y-2 p-4'>
        {messages.length === 0 ? (
          <div className='text-center text-gray-500'>No hay mensajes aún. ¡Comienza la conversación!</div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`p-2 max-w-xs ${msg.sender_id === userId ? 'ml-auto bg-[#FF5733] text-white rounded-br-none' : 'mr-auto bg-gray-200 text-[#333333] rounded-bl-none'} rounded-lg shadow-md`}>{msg.body}</div>
          ))
        )}
      </div>
      <div className='flex items-center p-4 bg-white border-t border-gray-200'>
        <input
          type='text'
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className='flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]'
          placeholder='Escribe un mensaje...'
        />
        <button
          onClick={sendMessage}
          className='ml-2 bg-[#FF5733] text-white font-bold py-2 px-4 rounded-full shadow-md hover:bg-[#e04c30] transition-colors'
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

export default Page;
