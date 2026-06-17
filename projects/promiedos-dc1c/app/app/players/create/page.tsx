"use client";

import { useState } from "react";

export default function CreatePlayer() {
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          team,
          photo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create player");
      }

      // Reset form on success
      setName("");
      setTeam("");
      setPhoto(null);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-[#FFFFFF] min-h-screen">
      <h1 className="text-2xl font-bold text-[#000000] mb-4">Create Player</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-[#CCCCCC] rounded-3xl shadow-md p-6 mb-4">
          <label className="block text-[#000000] font-medium mb-2">Player Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-2 border-[#CCCCCC] rounded-lg py-2 px-4 w-full"
            required
          />
        </div>
        <div className="bg-[#CCCCCC] rounded-3xl shadow-md p-6 mb-4">
          <label className="block text-[#000000] font-medium mb-2">Team</label>
          <input
            type="text"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="border-2 border-[#CCCCCC] rounded-lg py-2 px-4 w-full"
            required
          />
        </div>
        <div className="bg-[#CCCCCC] rounded-3xl shadow-md p-6 mb-4">
          <label className="block text-[#000000] font-medium mb-2">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="block w-full text-[#CCCCCC]"
          />
          {photo && <img src={photo} alt="Player Preview" className="mt-2 w-32 h-32 object-cover rounded-full" />}
        </div>
        <button
          type="submit"
          className="bg-[#FF0000] text-[#FFFFFF] rounded-full py-2 px-6 transition-all duration-200 ease-in-out hover:bg-[#FF4D4D]"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Player"}
        </button>
        {error && <p className="text-[#FF0000] mt-2">{error}</p>}
      </form>
    </div>
  );
}
