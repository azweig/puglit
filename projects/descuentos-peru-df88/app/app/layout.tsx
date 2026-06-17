"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.replace('/login');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="bg-[#581845] text-[#FFFFFF] min-h-screen">
      <header className="sticky top-0 bg-[#900C3F] p-4">
        <nav className="flex justify-around">
          <Link href="/" className={`font-bold text-lg ${pathname === '/' ? 'border-b-2 border-[#FFC300]' : ''}`}>Inicio</Link>
          <Link href="/mis-programas" className={`font-bold text-lg ${pathname === '/mis-programas' ? 'border-b-2 border-[#FFC300]' : ''}`}>Mis Programas</Link>
          <Link href="/establecer-ubicacion" className={`font-bold text-lg ${pathname === '/establecer-ubicacion' ? 'border-b-2 border-[#FFC300]' : ''}`}>Establecer Ubicación</Link>
        </nav>
      </header>
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}