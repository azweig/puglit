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

  const navItems = [
    { name: "Partidos en Vivo", path: "/app" },
    { name: "Torneos", path: "/app/tournaments" },
    { name: "Tabla de Posiciones", path: "/app/standings" },
    { name: "Goleadores", path: "/app/scorers" },
  ];

  return (
    <div className="bg-[#FFFFFF] min-h-screen flex flex-col">
      <header className="sticky top-0 bg-[#1E90FF] text-[#FFFFFF] shadow-md">
        <nav className="flex justify-around py-4">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`$text-lg font-bold transition-all duration-200 ease-in-out hover:text-[#104E8B] ${
                  pathname === item.path ? "text-[#FF4500]" : ""
                }`}
              >
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  );
}