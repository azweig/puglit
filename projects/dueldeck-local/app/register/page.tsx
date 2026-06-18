"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BRAND = "#7C3AED";

export default function Page() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email, password: form.password, name: form.name, profile: {} }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Algo salió mal"); return; }
      router.push("/");
    } catch { setError("Error de red"); } finally { setLoading(false); }
  }
  return (
    <main className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-3xl font-extrabold mb-1" style={{ color: BRAND }}>DuelDeck</Link>
        <p className="text-center text-black/60 mb-6">Webapp estilo Yu-Gi-Oh para explorar un catalogo curado de cartas (cada carta con nombre, ATK, DEF, atributo, tipo, nivel e imagen), buscarlas y filtrarlas, ver el detalle de una carta, y armar mazos agregando cartas</p>
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-md p-6 space-y-3">
          <h1 className="text-xl font-bold text-black/80">Crear cuenta</h1>
          <input className="w-full border border-black/10 rounded-lg px-3 py-2.5 outline-none focus:border-[#7C3AED]" type="text" placeholder="Nombre" value={form.name || ""} onChange={set("name")} />
          <input className="w-full border border-black/10 rounded-lg px-3 py-2.5 outline-none focus:border-[#7C3AED]" type="email" placeholder="Email" value={form.email || ""} onChange={set("email")} />
          <input className="w-full border border-black/10 rounded-lg px-3 py-2.5 outline-none focus:border-[#7C3AED]" type="password" placeholder="Contraseña" value={form.password || ""} onChange={set("password")} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full text-white font-semibold py-2.5 rounded-lg transition-transform hover:scale-[1.02] disabled:opacity-60" style={{ background: BRAND }} disabled={loading}>{loading ? "…" : "Empezar gratis"}</button>
          <p className="text-center text-sm text-black/60">¿Ya tenés cuenta? <Link href="/login" className="font-semibold" style={{ color: BRAND }}>Iniciar sesión</Link></p>
        </form>
      </div>
    </main>
  );
}
