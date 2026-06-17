"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  const navItems = [
    { name: 'Descubrir', path: '/app' },
    { name: 'Mis Programas', path: '/app/memberships' },
    { name: 'Ubicación', path: '/app/location' },
    { name: 'Merchants', path: '/app/merchants' },
    { name: 'Branches', path: '/app/branches' },
    { name: 'Offers', path: '/app/offers' },
  ];

  return (
    <div className="bg-[#F5F5F5] min-h-screen flex flex-col">
      <header className="bg-[#FFC300] sticky top-0 w-full shadow-md">
        <nav className="flex justify-around py-4">
          {navItems.map((item) => (
            <Link key={item.name} href={item.path}
                className={`text-lg font-bold ${
                  pathname === item.path ? 'text-[#900C3F]' : 'text-[#333333]'
                } hover:text-[#FF5733] transition duration-200 ease-in-out`}
              >
                {item.name}
              </Link>
          ))}
        </nav>
      </header>
      <main className="flex-grow">
        {children}
      </main>
      <footer className="sticky bottom-0 bg-[#FFC300] flex justify-around py-2">
        <Link href="/app" className="text-[#333333] hover:text-[#FF5733] transition duration-200 ease-in-out">Home</Link>
        <Link href="/app/search" className="text-[#333333] hover:text-[#FF5733] transition duration-200 ease-in-out">Search</Link>
        <Link href="/app/profile" className="text-[#333333] hover:text-[#FF5733] transition duration-200 ease-in-out">Profile</Link>
      </footer>
    </div>
  );
}