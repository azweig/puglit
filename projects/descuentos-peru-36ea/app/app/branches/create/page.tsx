"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BranchForm {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

export default function CreateBranch() {
  const [form, setForm] = useState<BranchForm>({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
  });
  const [message, setMessage] = useState<string>("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        setMessage("Branch created successfully!");
        router.push("/app/location");
      } else {
        setMessage("Failed to create branch.");
      }
    } catch (error) {
      setMessage("An error occurred.");
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-6 bg-[#F5F5F5] h-screen">
      <h1 className="text-[#333333] text-2xl font-bold">Create Branch</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Branch Name"
          className="border border-[#900C3F] rounded-lg px-4 py-2 focus:border-[#FF5733] focus:ring focus:ring-[#FF5733]/50 transition"
        />
        <input
          type="text"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Address"
          className="border border-[#900C3F] rounded-lg px-4 py-2 focus:border-[#FF5733] focus:ring focus:ring-[#FF5733]/50 transition"
        />
        <input
          type="text"
          name="latitude"
          value={form.latitude}
          onChange={handleChange}
          placeholder="Latitude"
          className="border border-[#900C3F] rounded-lg px-4 py-2 focus:border-[#FF5733] focus:ring focus:ring-[#FF5733]/50 transition"
        />
        <input
          type="text"
          name="longitude"
          value={form.longitude}
          onChange={handleChange}
          placeholder="Longitude"
          className="border border-[#900C3F] rounded-lg px-4 py-2 focus:border-[#FF5733] focus:ring focus:ring-[#FF5733]/50 transition"
        />
        <button
          type="submit"
          className="bg-[#FF5733] text-white py-3 px-6 rounded-full shadow-md hover:bg-opacity-90 transition"
        >
          Create Branch
        </button>
      </form>
      {message && <p className="text-[#900C3F] mt-4">{message}</p>}
    </div>
  );
}
