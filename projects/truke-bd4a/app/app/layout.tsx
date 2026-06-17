"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <div className="bg-[#F7F7F7] min-h-screen flex flex-col">
      <div className="flex-grow">
        {children}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg flex justify-around py-2">
        <Link href="/app" className={`text-base font-medium ${pathname === '/app' ? 'text-[#FF6F61]' : 'text-gray-600'}`}>Descubrir</Link>
        <Link href="/app/publicar" className={`text-base font-medium ${pathname === '/app/publicar' ? 'text-[#FF6F61]' : 'text-gray-600'}`}>Publicar</Link>
        <Link href="/app/matches" className={`text-base font-medium ${pathname === '/app/matches' ? 'text-[#FF6F61]' : 'text-gray-600'}`}>Matches</Link>
      </div>
    </div>
  );
}