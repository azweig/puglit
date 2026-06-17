"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppNav from "@/components/AppNav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let alive = true
    fetch("/api/auth/me").then((r) => {
      if (!alive) return
      if (r.ok) setOk(true); else router.replace("/login")
    }).catch(() => router.replace("/login"))
    return () => { alive = false }
  }, [router])
  if (!ok) return <div className="min-h-screen grid place-items-center text-black/40">…</div>
  return (
    <div className="min-h-screen pb-20 md:pb-0 md:flex md:flex-col">
      <header className="hidden md:block border-b border-black/10"><div className="max-w-3xl mx-auto px-4"><AppNav /></div></header>
      <main className="max-w-3xl mx-auto w-full px-4 py-5 flex-1">{children}</main>
      <div className="md:hidden"><AppNav /></div>
    </div>
  )
}
