"use client";

import { useEffect, useState } from 'react';

interface Offer {
  id: string;
  title: string;
  discount_label: string;
  program_name: string;
  address: string;
  image_url: string;
}

export default function Descubrir() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch('/api/offers');
        if (!response.ok) throw new Error('Failed to fetch offers');
        const data = await response.json();
        setOffers(data.offers ?? []);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchOffers();
    const interval = setInterval(fetchOffers, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#581845] min-h-screen text-[#FFFFFF]">
      <h1 className="text-2xl font-bold text-center py-4">Ofertas Cercanas</h1>
      <div className="flex flex-col items-center">
        {error ? (
          <div className="text-center text-[#C70039]">Error: {error}</div>
        ) : offers.length === 0 ? (
          <div className="text-center">No hay ofertas cercanas disponibles.</div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="relative bg-[#FFC300] rounded-3xl shadow-lg m-4 w-full max-w-lg overflow-hidden"
            >
              <img
                src={offer.image_url ?? '/placeholder-image.png'}
                alt={offer.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-transparent to-transparent p-4">
                <h2 className="text-xl font-bold">{offer.title ?? 'Sin título'}</h2>
                <p className="font-medium">{offer.discount_label ?? 'Descuento desconocido'} en {offer.program_name ?? 'Programa desconocido'}</p>
                <p className="font-medium">{offer.address ?? 'Dirección desconocida'}</p>
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button className="bg-[#FF5733] text-[#FFFFFF] rounded-full py-3 px-6 hover:bg-[#C70039] transition-all duration-300">Like</button>
                <button className="bg-[#FF5733] text-[#FFFFFF] rounded-full py-3 px-6 hover:bg-[#C70039] transition-all duration-300">Pass</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}