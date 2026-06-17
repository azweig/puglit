"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        router.replace("/login");
      } else {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="bg-[#FFFFFF] min-h-screen flex flex-col">
      <main className="flex-grow">
        {children}
      </main>
      <nav className="bg-[#F5A623] p-4 fixed bottom-0 w-full flex justify-around">
        <Link href="/app" className={`font-bold text-2xl ${pathname === "/app" ? "text-[#FF6F61]" : "text-[#4A4A4A]"}`}>Descubrir</Link>
        <Link href="/app/publicar" className={`font-bold text-2xl ${pathname === "/app/publicar" ? "text-[#FF6F61]" : "text-[#4A4A4A]"}`}>Publicar</Link>
        <Link href="/app/matches" className={`font-bold text-2xl ${pathname === "/app/matches" ? "text-[#FF6F61]" : "text-[#4A4A4A]"}`}>Mis Matches</Link>
      </nav>
    </div>
  );
}