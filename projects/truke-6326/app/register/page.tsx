"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BRAND = "#FF6F61";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, name: form.name, profile: {} }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "No pudimos crear la cuenta"); return; }
      router.push("/");
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-3xl font-extrabold mb-1" style={{ color: BRAND }}>Truke</Link>
        <p className="text-center text-[#4A4A4A] mb-6">Deslizá, encontrá, intercambiá. Gratis.</p>
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-md p-6 space-y-3">
          <h1 className="text-xl font-bold text-[#4A4A4A]">Crear cuenta</h1>
          <input className="w-full border border-black/10 rounded-lg px-3 py-2.5 outline-none focus:border-[#FF6F61]" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="w-full border border-black/10 rounded-lg px-3 py-2.5 outline-none focus:border-[#FF6F61]" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="w-full border border-black/10 rounded-lg px-3 py-2.5 outline-none focus:border-[#FF6F61]" type="password" placeholder="Contraseña" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full text-white font-semibold py-2.5 rounded-lg transition-transform hover:scale-[1.02] disabled:opacity-60" style={{ background: BRAND }} disabled={loading}>{loading ? "…" : "Empezar gratis"}</button>
          <p className="text-center text-sm text-[#4A4A4A]">¿Ya tenés cuenta? <Link href="/login" className="font-semibold" style={{ color: BRAND }}>Iniciar sesión</Link></p>
        </form>
      </div>
    </main>
  );
}
