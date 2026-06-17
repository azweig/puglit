"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email, password: form.password, name: form.name, profile: {} }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "No pudimos crear la cuenta"); return; }
      router.push("/");
    } catch { setError("Error de red"); } finally { setLoading(false); }
  }
  return (
    <main className="min-h-screen bg-[#581845] flex flex-col items-center justify-center px-6 text-white">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-3xl font-extrabold mb-1 text-[#FFC300]">Descuentos Perú</Link>
        <p className="text-center text-white/70 mb-6">Encontrá descuentos con tus tarjetas, cerca tuyo.</p>
        <form onSubmit={submit} className="bg-[#900C3F] rounded-2xl shadow-lg p-6 space-y-3">
          <h1 className="text-xl font-bold">Crear cuenta</h1>
          <input className="w-full rounded-lg px-3 py-2.5 text-[#581845] outline-none" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="w-full rounded-lg px-3 py-2.5 text-[#581845] outline-none" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="w-full rounded-lg px-3 py-2.5 text-[#581845] outline-none" type="password" placeholder="Contraseña" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="text-sm text-yellow-200">{error}</p>}
          <button className="w-full bg-[#FF5733] text-white font-semibold py-2.5 rounded-lg hover:bg-[#C70039] transition-colors disabled:opacity-60" disabled={loading}>{loading ? "…" : "Crear cuenta"}</button>
          <p className="text-center text-sm text-white/80">¿Ya tenés cuenta? <Link href="/login" className="font-semibold text-[#FFC300]">Iniciar sesión</Link></p>
        </form>
      </div>
    </main>
  );
}
