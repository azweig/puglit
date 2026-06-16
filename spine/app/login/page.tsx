"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthShell, fieldClass, submitClass } from "@/components/AuthShell"
import { useLanguage } from "@/lib/i18n"

export default function LoginPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const es = lang === "es"
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Error"); return }
      router.push("/app")
    } catch {
      setError(es ? "Error de red" : "Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={es ? "Iniciar sesión" : "Sign in"}
      footer={<>{es ? "¿No tenés cuenta?" : "No account?"} <Link href="/register" className="text-brand font-semibold">{es ? "Crear una" : "Create one"}</Link></>}
    >
      <form onSubmit={submit} className="space-y-3">
        <input className={fieldClass} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className={fieldClass} type="password" placeholder={es ? "Contraseña" : "Password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className={submitClass} style={{ background: "var(--brand)" }} disabled={loading}>{loading ? "…" : es ? "Entrar" : "Sign in"}</button>
        <Link href="/forgot-password" className="block text-center text-sm text-ink/60 hover:text-ink">{es ? "¿Olvidaste tu contraseña?" : "Forgot password?"}</Link>
      </form>
    </AuthShell>
  )
}
