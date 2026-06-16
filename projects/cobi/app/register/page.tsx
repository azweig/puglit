"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthShell, fieldClass, submitClass } from "@/components/AuthShell"
import { useLanguage } from "@/lib/i18n"

export default function RegisterPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const es = lang === "es"
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Button stays enabled (validate on click, show inline errors) — never a
  // disabled button as validation. See Puglit conventions.
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error"); return }
      router.push("/")
    } catch {
      setError(es ? "Error de red" : "Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={es ? "Crear cuenta" : "Create account"}
      footer={<>{es ? "¿Ya tenés cuenta?" : "Already have an account?"} <Link href="/login" className="text-brand font-semibold">{es ? "Iniciar sesión" : "Sign in"}</Link></>}
    >
      <form onSubmit={submit} className="space-y-3">
        <input className={fieldClass} placeholder={es ? "Nombre" : "Name"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={fieldClass} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className={fieldClass} type="password" placeholder={es ? "Contraseña (mín. 8)" : "Password (min. 8)"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className={submitClass} style={{ background: "var(--brand)" }} disabled={loading}>{loading ? "…" : es ? "Crear cuenta" : "Create account"}</button>
      </form>
    </AuthShell>
  )
}
