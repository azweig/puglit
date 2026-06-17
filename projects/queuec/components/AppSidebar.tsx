"use client"
/**
 * Puglit Spine — AppSidebar (config-driven).
 * Mirrors the TodoAstros dashboard nav, but generated from domain.config:
 * Overview + one item per entity + Account. Fixed on desktop, drawer on mobile.
 */
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import config from "@/domain.config"
import { Mark } from "@/components/Mark"

const ENTITIES = (config.entities || []).map((e) => ({
  slug: e.name, label: e.plural || e.name,
}))

function HomeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg> }
function ListIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg> }
function GearIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10.5 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.61.74 1.05 1.39 1.09H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> }

function Body({ pathname, user, onNavigate }: { pathname: string; user: { name?: string; plan?: string } | null; onNavigate?: () => void }) {
  const items = [
    { href: "/app", label: "Overview", icon: <HomeIcon /> },
    ...ENTITIES.map((e) => ({ href: `/app/${e.slug}`, label: e.label, icon: <ListIcon /> })),
    { href: "/app/account", label: "Account", icon: <GearIcon /> },
  ]
  return (
    <>
      <Link href="/app" onClick={onNavigate} className="px-5 py-5 flex items-center gap-2 text-brand">
        <Mark size={26} /><span className="font-extrabold text-ink text-lg tracking-tight">{config.identity.name}</span>
      </Link>
      <div className="px-4 pb-4">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-black/[0.03]">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--brand)" }}>{(user?.name || "?").slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0">
            <p className="text-ink text-sm font-semibold truncate">{user?.name || "Guest"}</p>
            <p className="text-ink/40 text-[11px] uppercase tracking-wider">{(user?.plan || "free")}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {items.map((it) => {
          const active = pathname === it.href
          return (
            <Link key={it.href} href={it.href} onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? "text-brand bg-brand/10 font-semibold" : "text-ink/65 hover:text-ink hover:bg-black/[0.03]"}`}>
              <span className={active ? "text-brand" : "text-ink/40"}>{it.icon}</span>
              <span className="truncate">{it.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<{ name?: string; plan?: string } | null>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => { fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then((d) => d?.user && setUser(d.user)).catch(() => {}) }, [])
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-black/5 z-30">
        <Body pathname={pathname} user={user} />
      </aside>
      <header className="lg:hidden sticky top-0 h-14 bg-white/90 backdrop-blur border-b border-black/5 z-30 flex items-center justify-between px-4">
        <button onClick={() => setOpen(true)} aria-label="Menu" className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center hover:bg-black/5"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg></button>
        <Link href="/app" className="flex items-center gap-2 text-brand"><Mark size={22} /><span className="font-extrabold text-ink">{config.identity.name}</span></Link>
        <span className="w-9" />
      </header>
      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}
      <aside className={`lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white border-r border-black/5 z-50 flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <Body pathname={pathname} user={user} onNavigate={() => setOpen(false)} />
      </aside>
    </>
  )
}
