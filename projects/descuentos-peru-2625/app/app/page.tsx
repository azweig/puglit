"use client";

import { useEffect, useState } from "react";

interface Discount {
  id: number;
  title: string;
  price: string;
  image_url: string;
}

const DiscoverPage = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        setLoading(true);
        const locationResponse = await fetch("/api/location");
        if (!locationResponse.ok) throw new Error("Failed to fetch location");

        const membershipsResponse = await fetch("/api/user_memberships");
        if (!membershipsResponse.ok) throw new Error("Failed to fetch memberships");

        const discountsResponse = await fetch("/api/discounts");
        if (!discountsResponse.ok) throw new Error("Failed to fetch discounts");

        const discountsData: Discount[] = await discountsResponse.json();
        setDiscounts(discountsData ?? []);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % discounts.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? discounts.length - 1 : prevIndex - 1
    );
  };

  if (loading) return <div className="text-center text-[#FFFFFF]">Cargando ofertas...</div>;
  if (error) return <div className="text-center text-[#C70039]">Error: {error}</div>;
  if (discounts.length === 0) return <div className="text-center text-[#C70039]">No hay descuentos disponibles.</div>;

  const currentDiscount = discounts[currentIndex];

  return (
    <div className="w-full h-full bg-[#581845] flex flex-col items-center justify-center">
      <div className="relative w-full max-w-md h-96 bg-[#FFFFFF] rounded-3xl shadow-lg overflow-hidden">
        <img
          src={currentDiscount?.image_url ?? "/placeholder.png"}
          alt={currentDiscount?.title ?? "Sin título"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#581845] to-transparent p-4 flex flex-col justify-end">
          <h2 className="text-2xl font-bold text-[#FFFFFF] mb-2">
            {currentDiscount?.title ?? "Sin título"}
          </h2>
          <p className="text-lg text-[#FFFFFF]">
            {currentDiscount?.price ?? "Sin precio"}
          </p>
        </div>
        <div className="absolute top-2 right-2 flex space-x-2">
          <button
            onClick={handlePrev}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF5733] text-[#FFFFFF]"
          >
            ←
          </button>
          <button
            onClick={handleNext}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF5733] text-[#FFFFFF]"
          >
            →
          </button>
        </div>
      </div>
      <div className="mt-4 flex space-x-4">
        <button className="px-4 py-2 rounded-full bg-[#FF5733] text-[#FFFFFF]">
          Actualizar ubicación
        </button>
        <button className="px-4 py-2 rounded-full bg-[#C70039] text-[#FFFFFF]">
          Gestionar membresías
        </button>
      </div>
    </div>
  );
};

export default DiscoverPage;