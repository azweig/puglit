"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        router.replace("/login");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="bg-[#F5F7FA] min-h-screen flex flex-col">
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md flex justify-around p-4 z-10">
        <Link href="/"
            className={`text-base font-medium ${pathname === "/" ? "text-[#FF6F61]" : "text-[#4A4A4A]"}`}
          >
            Inicio
          </Link>
        <Link href="/publicar"
            className={`text-base font-medium ${pathname === "/publicar" ? "text-[#FF6F61]" : "text-[#4A4A4A]"}`}
          >
            Publicar
          </Link>
        <Link href="/matches"
            className={`text-base font-medium ${pathname === "/matches" ? "text-[#FF6F61]" : "text-[#4A4A4A]"}`}
          >
            Matches
          </Link>
      </nav>
      <main className="flex-1 mt-16 mb-16">
        {children}
      </main>
      <div className="fixed bottom-0 left-0 right-0 flex justify-center mb-4">
        <button className="bg-[#FF6F61] text-white py-2 px-4 rounded-full transform hover:scale-105 transition-transform">
          +
        </button>
      </div>
    </div>
  );
}
