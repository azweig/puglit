"use client"
import { useState } from "react"

export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true); setMsg(null)
    try {
      const r = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d.ok) setMsg({ t: "You're on the list. ✦", ok: true })
      else setMsg({ t: "Couldn't reach the list yet — try again soon.", ok: false })
    } catch { setMsg({ t: "Network error.", ok: false }) } finally { setLoading(false) }
  }

  if (msg?.ok) return <p className="mt-6 text-emerald-400 font-semibold">{msg.t}</p>
  return (
    <form onSubmit={submit} className="mt-6 mx-auto max-w-md flex gap-2 flex-col sm:flex-row">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@startup.com"
        className="flex-1 bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/35 focus:border-violet focus:outline-none" />
      <button disabled={loading} className="px-5 py-3 rounded-xl font-bold text-white disabled:opacity-60" style={{ background: "var(--violet)" }}>{loading ? "…" : "Notify me"}</button>
      {msg && !msg.ok && <span className="text-amber-400 text-sm self-center">{msg.t}</span>}
    </form>
  )
}
