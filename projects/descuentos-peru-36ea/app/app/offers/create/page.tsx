"use client";

import { useState, useEffect } from "react";

interface Offer {
  title: string;
  description: string;
  discountLabel: string;
  image: string;
}

export default function CreateOffer() {
  const [offer, setOffer] = useState<Offer>({
    title: "",
    description: "",
    discountLabel: "",
    image: "",
  });
  const [previewImage, setPreviewImage] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOffer({ ...offer, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setOffer({ ...offer, image: result });
        setPreviewImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(offer),
      });
      if (response.ok) {
        setMessage("Offer created successfully!");
      } else {
        setMessage("Failed to create offer.");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-6 bg-[#F5F5F5] min-h-screen">
      <h1 className="text-[#333333] font-bold text-2xl">Create Offer</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          type="text"
          name="title"
          value={offer.title}
          onChange={handleInputChange}
          placeholder="Offer Title"
          className="border border-[#900C3F] rounded-lg px-4 py-2 focus:border-[#FF5733] focus:ring focus:ring-[#FF5733]/50 transition"
        />
        <textarea
          name="description"
          value={offer.description}
          onChange={handleInputChange}
          placeholder="Offer Description"
          className="border border-[#900C3F] rounded-lg px-4 py-2 focus:border-[#FF5733] focus:ring focus:ring-[#FF5733]/50 transition"
        />
        <input
          type="text"
          name="discountLabel"
          value={offer.discountLabel}
          onChange={handleInputChange}
          placeholder="Discount Label"
          className="border border-[#900C3F] rounded-lg px-4 py-2 focus:border-[#FF5733] focus:ring focus:ring-[#FF5733]/50 transition"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="border border-[#900C3F] rounded-lg px-4 py-2 focus:border-[#FF5733] focus:ring focus:ring-[#FF5733]/50 transition"
        />
        {previewImage && <img src={previewImage} alt="Offer Preview" className="w-full h-48 object-cover rounded-3xl shadow-lg" />}
        <button type="submit" className="bg-[#FF5733] text-white py-3 px-6 rounded-full shadow-md hover:bg-opacity-90 transition">
          Create Offer
        </button>
      </form>
      {message && <div className="text-[#333333] mt-4">{message}</div>}
    </div>
  );
}
