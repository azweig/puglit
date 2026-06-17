"use client";

import { useState } from "react";

export default function CreateLeague() {
  const [leagueName, setLeagueName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/leagues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: leagueName,
          logo,
        }),
      });
      if (response.ok) {
        setStatusMessage("League created successfully!");
        setLeagueName("");
        setLogo(null);
      } else {
        setStatusMessage("Failed to create league.");
      }
    } catch (error) {
      setStatusMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <h1 className="text-2xl font-bold text-[#000000] mb-4">Create League</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[#000000] mb-1">League Name</label>
          <input
            type="text"
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            className="border-2 border-[#CCCCCC] rounded-lg py-2 px-4 w-full"
            required
          />
        </div>
        <div>
          <label className="block text-[#000000] mb-1">League Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border-2 border-[#CCCCCC] rounded-lg py-2 px-4 w-full"
          />
          {logo && <img src={logo} alt="League Logo Preview" className="mt-2 rounded-3xl shadow-md" />}
        </div>
        <button type="submit" className="bg-[#FF0000] text-[#FFFFFF] rounded-full py-2 px-6 transition-all duration-200 ease-in-out hover:scale-105">
          Create League
        </button>
      </form>
      {statusMessage && <p className="mt-4 text-[#000000]">{statusMessage}</p>}
    </div>
  );
}
