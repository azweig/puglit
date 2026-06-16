"use client"
/**
 * Client island for the live demos. Intercepts clicks on any [data-demo-cta]
 * element in the rendered landing and opens a real register/login modal that
 * hits /api/demo/auth (backed by Puglit's DB). Shows a logged-in state so the
 * demo is genuinely functional — "Get started" actually creates an account.
 */
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type User = { email: string; name: string } | null

export function DemoAuthOverlay({ slug, productName, entity, color }: { slug: string; productName: string; entity?: string; color?: string }) {
  const brand = color || "#7C3AED"
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"register" | "login">("register")
  const [user, setUser] = useState<User>(null)
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`/api/demo/me?slug=${encodeURIComponent(slug)}`).then((r) => r.json()).then((d) => setUser(d.user)).catch(() => {})
  }, [slug])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement)?.closest("[data-demo-cta]")
      if (t) { e.preventDefault(); if (user) router.push(`/x/${slug}/app`); else { setErr(""); setOpen(true) } }
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [user, slug, router])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true)
    try {
      const r = await fetch("/api/demo/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: mode, ...form }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) { setErr(d.error || "Error"); return }
      setUser(d.user)
      router.push(`/x/${slug}/app`) // into the functional dashboard
    } catch { setErr("Network error") } finally { setBusy(false) }
  }
  async function logout() {
    await fetch("/api/demo/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) }).catch(() => {})
    setUser(null); setOpen(false)
  }

  return (
    <>
      {user && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-white shadow-xl border border-black/10 rounded-full pl-4 pr-2 py-2 text-sm">
          <span className="text-ink/70">Hi, <b className="text-ink">{user.name}</b></span>
          <a href={`/x/${slug}/app`} className="text-white text-xs font-semibold rounded-full px-3 py-1.5" style={{ background: brand }}>Open app →</a>
          <button onClick={logout} className="text-ink/50 hover:text-ink text-xs font-semibold px-2">Log out</button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white text-ink rounded-2xl max-w-sm w-full p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {user ? (
              <div className="text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-xl font-extrabold">You’re in, {user.name}!</h3>
                <p className="text-ink/65 text-sm mt-2">Your <b>{productName}</b> account is live and your {entity || "data"} are ready to manage.</p>
                <a href={`/x/${slug}/app`} className="mt-5 inline-block w-full py-2.5 rounded-lg text-white font-semibold" style={{ background: brand }}>Open your dashboard →</a>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-extrabold">{mode === "register" ? `Create your ${productName} account` : `Sign in to ${productName}`}</h3>
                <p className="text-ink/55 text-xs mt-1">Live demo · powered by Puglit</p>
                <form onSubmit={submit} className="mt-4 space-y-2.5">
                  {mode === "register" && <input className="w-full border border-black/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-current" style={{ color: brand }} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
                  <input className="w-full border border-black/15 rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <input className="w-full border border-black/15 rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  {err && <p className="text-red-600 text-sm">{err}</p>}
                  <button disabled={busy} className="w-full py-2.5 rounded-lg text-white font-semibold disabled:opacity-60" style={{ background: brand }}>{busy ? "…" : mode === "register" ? "Create account" : "Sign in"}</button>
                </form>
                <button onClick={() => { setMode(mode === "register" ? "login" : "register"); setErr("") }} className="mt-3 text-sm text-ink/60 hover:text-ink w-full text-center">
                  {mode === "register" ? "Already have an account? Sign in" : "No account? Create one"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
