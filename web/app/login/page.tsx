"use client"
/** /login — passwordless: email → 6-digit code → in. No password. */
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"email" | "code">("email")
  const [msg, setMsg] = useState("")
  const [dev, setDev] = useState("")
  const [busy, setBusy] = useState(false)
  const [next, setNext] = useState("/campus")
  const router = useRouter()
  // read ?next from the URL client-side (avoids useSearchParams, which needs a Suspense
  // boundary and otherwise fails `next build`)
  useEffect(() => { const n = new URLSearchParams(window.location.search).get("next"); if (n) setNext(n) }, [])

  async function request() {
    setBusy(true); setMsg(""); setDev("")
    try {
      const d = await fetch("/api/auth/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) }).then((r) => r.json())
      if (!d.ok) { setMsg(d.error || "error"); return }
      setStep("code")
      setMsg(d.sent ? "Te mandamos un código por mail." : "Sin proveedor de mail (beta): usá el código de abajo.")
      if (d.devCode) setDev(d.devCode)
    } catch { setMsg("error de red") } finally { setBusy(false) }
  }
  async function verify() {
    setBusy(true); setMsg("")
    try {
      const d = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), code: code.trim() }) }).then((r) => r.json())
      if (!d.ok) { setMsg(d.error || "código inválido"); return }
      router.push(next)
    } catch { setMsg("error de red") } finally { setBusy(false) }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070a12] px-4 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink2 p-6">
        <h1 className="text-xl font-extrabold">🧬 Entrar a Puglit</h1>
        <p className="mb-5 mt-1 text-sm text-white/50">Sin contraseña — te llega un código por mail.</p>
        {step === "email" ? (
          <>
            <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && request()} placeholder="tu@email.com" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm" />
            <button onClick={request} disabled={busy || !email.trim()} className="mt-3 w-full rounded-xl px-5 py-2.5 font-bold text-white disabled:opacity-40" style={{ background: "var(--violet)" }}>{busy ? "…" : "Mandar código →"}</button>
          </>
        ) : (
          <>
            <input autoFocus inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && verify()} placeholder="000000" maxLength={6} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-center text-lg tracking-[6px]" />
            <button onClick={verify} disabled={busy || code.trim().length < 6} className="mt-3 w-full rounded-xl px-5 py-2.5 font-bold text-white disabled:opacity-40" style={{ background: "var(--violet)" }}>{busy ? "…" : "Entrar"}</button>
            <button onClick={() => { setStep("email"); setMsg(""); setDev("") }} className="mt-2 w-full text-xs text-white/40">← otro email</button>
          </>
        )}
        {msg && <p className="mt-3 text-xs text-white/60">{msg}</p>}
        {dev && <p className="mt-1 rounded bg-amber-500/15 px-2 py-1 text-center font-mono text-amber-300">{dev}</p>}
      </div>
    </main>
  )
}
