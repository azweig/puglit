"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";


interface Message {
  id: number;
  match_id: number;
  sender_id: number;
  body: string;
  created_at: string;
}

export default function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?matchId=${matchId}`);
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setMessages(list);
      } catch (error: any) {
        setError("Error fetching messages.");
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 2500);

    return () => clearInterval(intervalId);
  }, [matchId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const response = await fetch(`/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matchId: Number(matchId), body: newMessage }),
      });
      if (response.ok) {
        setNewMessage("");
        setError("");
      } else {
        setError("Failed to send message.");
      }
    } catch (error: any) {
      setError("Failed to send message.");
    }
  };

  return (
    <div className="bg-[#F5F7FA] min-h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg mb-2 max-w-xs ${
              message.sender_id === 1 ? "bg-[#FF6F61] self-end" : "bg-[#F5F7FA]"
            }`}
          >
            <p className="text-[#4A4A4A]">{message.body}</p>
          </div>
        ))}
      </div>
      <div className="p-4 bg-white shadow-md flex items-center">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-lg py-2 px-3 focus:border-[#4A90E2]"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-[#FF6F61] text-white py-2 px-4 rounded-full hover:bg-[#e65c52] transition-bg"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
