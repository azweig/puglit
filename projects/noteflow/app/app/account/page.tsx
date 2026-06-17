"use client"
/** Puglit Spine — /app/account: current user + logout. */
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Account() {
  const router = useRouter()
  const [user, setUser] = useState<{ name?: string; email?: string; plan?: string } | null>(null)
  useEffect(() => { fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then((d) => d?.user && setUser(d.user)).catch(() => {}) }, [])
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    router.push("/")
  }
  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Account</h1>
      <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm max-w-md space-y-3">
        <Row k="Name" v={user?.name} /><Row k="Email" v={user?.email} /><Row k="Plan" v={user?.plan} />
        <button onClick={logout} className="mt-2 px-5 py-2.5 rounded-lg text-white font-semibold" style={{ background: "var(--brand)" }}>Log out</button>
      </div>
    </div>
  )
}
function Row({ k, v }: { k: string; v?: string }) {
  return <div className="flex justify-between border-b border-black/5 pb-2"><span className="text-ink/50 text-sm">{k}</span><span className="font-semibold text-sm">{v || "—"}</span></div>
}
