"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const ITEMS = [{ label: "Descubrir", href: "/app" }, { label: "Publicar", href: "/app/publicar" }, { label: "Mis Matches", href: "/app/matches" }]

export default function AppNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-around border-t border-black/10 bg-white/90 backdrop-blur py-2 md:static md:justify-start md:gap-2 md:border-0 md:bg-transparent md:py-4">
      {ITEMS.map((it) => {
        const active = path === it.href || (it.href !== "/app" && path.startsWith(it.href))
        return (
          <Link key={it.href} href={it.href} className={`px-4 py-2 rounded-xl text-sm font-semibold ${active ? "text-white" : "text-black/60 hover:text-black"}`} style={active ? { background: "var(--brand, #7C3AED)" } : undefined}>
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
