"use client";

import { useEffect, useState } from "react";

interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newOffer, setNewOffer] = useState<{ title: string; description: string; imageUrl: string }>({
    title: "",
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch("/api/offers");
        if (!response.ok) {
          throw new Error("Failed to fetch offers");
        }
        const data = await response.json();
        setOffers(data ?? []);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewOffer((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewOffer((prev) => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOffer),
      });
      if (!response.ok) {
        throw new Error("Failed to create offer");
      }
      const createdOffer = await response.json();
      setOffers((prev) => [...prev, createdOffer]);
      setNewOffer({ title: "", description: "", imageUrl: "" });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#581845] text-[#FFFFFF] p-4">
      <h1 className="text-3xl font-bold mb-4">Offers</h1>
      {loading ? (
        <p>Loading offers...</p>
      ) : error ? (
        <p className="text-[#C70039]">{error}</p>
      ) : offers.length === 0 ? (
        <p>No offers available</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-[#FFFFFF] rounded-3xl shadow-lg p-4">
              <img src={offer.imageUrl || "/placeholder.png"} alt={offer.title} className="w-full h-48 object-cover rounded-2xl" />
              <h2 className="text-xl font-bold mt-2">{offer.title}</h2>
              <p className="text-[#C70039]">{offer.description}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-2">Create a new offer</h2>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={newOffer.title}
          onChange={handleInputChange}
          className="border-2 border-[#900C3F] rounded-lg px-3 py-2 w-full mb-2"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={newOffer.description}
          onChange={handleInputChange}
          className="border-2 border-[#900C3F] rounded-lg px-3 py-2 w-full mb-2"
        />
        <input type="file" onChange={handleImageUpload} className="mb-2" />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 rounded-full bg-[#FF5733] text-[#FFFFFF] transition-all duration-200 ease-in-out hover:bg-[#FF5733]/80"
        >
          Add Offer
        </button>
      </div>
    </div>
  );
}
