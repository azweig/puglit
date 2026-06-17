"use client";

import { useState } from "react";

export default function CreateOffer() {
  const [title, setTitle] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [programName, setProgramName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const offerData = {
      title,
      discount_label: discountLabel,
      merchant: { name: merchantName, category },
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      program_name: programName,
    };

    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(offerData),
      });

      if (!response.ok) {
        throw new Error("Failed to create offer");
      }

      // Reset form on success
      setTitle("");
      setDiscountLabel("");
      setMerchantName("");
      setCategory("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      setProgramName("");
    } catch (error: unknown) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <h1 className="text-3xl font-bold mb-6">Create Offer</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[#FFC300]">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
            required
          />
        </div>
        <div>
          <label className="block text-[#FFC300]">Discount Label</label>
          <input
            type="text"
            value={discountLabel}
            onChange={(e) => setDiscountLabel(e.target.value)}
            className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
            required
          />
        </div>
        <div>
          <label className="block text-[#FFC300]">Merchant Name</label>
          <input
            type="text"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
            required
          />
        </div>
        <div>
          <label className="block text-[#FFC300]">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
            required
          />
        </div>
        <div>
          <label className="block text-[#FFC300]">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
            required
          />
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-[#FFC300]">Latitude</label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-[#FFC300]">Longitude</label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-[#FFC300]">Program Name</label>
          <input
            type="text"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            className="border-2 border-[#900C3F] bg-[#FFFFFF] text-[#581845] py-2 px-4 rounded-lg focus:outline-none focus:border-[#FF5733] w-full"
            required
          />
        </div>
        {error && <p className="text-[#FF5733]">{error}</p>}
        <button
          type="submit"
          className="bg-[#FF5733] text-[#FFFFFF] font-bold py-3 px-6 rounded-full shadow-md transition-transform transform hover:scale-105 w-full"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Offer"}
        </button>
      </form>
    </div>
  );
}
