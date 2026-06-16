"use client"
/**
 * /generate — the interview. Collects the answers, posts to /api/generate, and
 * (when the DB is connected) sends the founder straight to their live example.
 * Free while in beta — the generated project becomes a public Puglit example.
 */
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mark } from "@/components/Mark"

const MODULES: [string, string][] = [
  ["aiLayer", "AI features"],
  ["payments", "Payments & subscriptions"],
  ["emailLifecycle", "Email lifecycle"],
  ["contentBlog", "Blog with AI authors"],
  ["engine", "Custom engine / algorithm"],
  ["gamification", "Streaks & gamification"],
  ["profiling", "Profiling & recommendations"],
  ["growth", "Growth & A/B tests"],
  ["geo", "Location / maps"],
  ["mobile", "Mobile app"],
]

const field = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/35 focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/30"
const label = "block text-sm font-semibold text-white/80 mb-1.5"

export default function Generate() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const [result, setResult] = useState<{ slug: string; config: unknown; saved: boolean } | null>(null)

  const [f, setF] = useState({
    name: "", what: "", audience: "",
    b0: "", b1: "", b2: "",
    color: "#7C3AED", languages: "en",
    monetization: "freemium", price: 9,
    modules: ["aiLayer", "payments"] as string[],
    email: "",
  })
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }))
  const toggleMod = (m: string) => set("modules", f.modules.includes(m) ? f.modules.filter((x) => x !== m) : [...f.modules, m])

  const canNext = step === 0 ? f.name.trim() && f.what.trim() : step === 1 ? (f.b0 || f.b1 || f.b2) : true

  async function generate() {
    setErr(""); setLoading(true)
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name, what: f.what, audience: f.audience,
          benefits: [f.b0, f.b1, f.b2], color: f.color, languages: f.languages,
          monetization: f.monetization, price: Number(f.price), modules: f.modules, email: f.email,
        }),
      })
      const d = await res.json()
      if (!res.ok) { setErr(d.error || "Error"); return }
      if (d.saved) { router.push(`/x/${d.slug}`); return }
      setResult(d) // DB not connected yet → show the config inline
    } catch { setErr("Network error") } finally { setLoading(false) }
  }

  if (result) {
    return (
      <main className="max-w-2xl mx-auto px-5 py-16">
        <Link href="/" className="flex items-center gap-2 text-violet-bright mb-8"><Mark size={26} /><span className="font-extrabold">Puglit</span></Link>
        <h1 className="text-2xl font-extrabold">Generated: {f.name} 🎉</h1>
        <p className="text-white/60 mt-2">Your <code className="text-violet-bright">domain.config.ts</code> is ready. (Database isn’t connected yet, so it wasn’t saved to the gallery — once it is, you’ll get a live preview link.)</p>
        <pre className="mt-6 bg-black/40 border border-white/10 rounded-xl p-4 text-xs overflow-x-auto text-white/80">{JSON.stringify(result.config, null, 2)}</pre>
        <Link href="/generate" className="inline-block mt-6 text-violet-bright font-semibold">← Generate another</Link>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <Link href="/" className="flex items-center gap-2 text-violet-bright mb-8"><Mark size={26} /><span className="font-extrabold">Puglit</span></Link>
      <div className="flex items-center gap-2 mb-7">
        {[0, 1, 2].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-violet" : "bg-white/10"}`} />)}
      </div>

      {step === 0 && (
        <div className="space-y-5">
          <h1 className="text-2xl font-extrabold">Tell us your idea</h1>
          <div><label className={label}>Product name</label><input className={field} placeholder="e.g. Mesa" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div><label className={label}>In one line, what does it do?</label><input className={field} placeholder="AI meal planning for busy families" value={f.what} onChange={(e) => set("what", e.target.value)} /></div>
          <div><label className={label}>Who is it for?</label><input className={field} placeholder="busy parents who hate deciding what to cook" value={f.audience} onChange={(e) => set("audience", e.target.value)} /></div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <h1 className="text-2xl font-extrabold">What makes it great</h1>
          <div><label className={label}>3 key benefits</label>
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <input key={i} className={field} placeholder={["Personalized in seconds", "Zero food waste", "Shopping list, automatic"][i]} value={f[`b${i}` as "b0"]} onChange={(e) => set(`b${i}`, e.target.value)} />)}
            </div>
          </div>
          <div className="flex gap-5 flex-wrap">
            <div><label className={label}>Brand color</label><input type="color" className="h-12 w-20 bg-transparent rounded-lg cursor-pointer" value={f.color} onChange={(e) => set("color", e.target.value)} /></div>
            <div className="flex-1 min-w-[180px]"><label className={label}>Languages</label>
              <div className="flex gap-2">
                {[["en", "English"], ["es", "Español"], ["both", "Both"]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set("languages", v)} className={`flex-1 py-3 rounded-xl border text-sm font-semibold ${f.languages === v ? "border-violet bg-violet/15 text-white" : "border-white/10 text-white/60"}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-extrabold">Business & build</h1>
          <div><label className={label}>Monetization</label>
            <div className="flex gap-2">
              {[["free", "Free"], ["freemium", "Freemium"], ["subscription", "Subscription"]].map(([v, l]) => (
                <button key={v} type="button" onClick={() => set("monetization", v)} className={`flex-1 py-3 rounded-xl border text-sm font-semibold ${f.monetization === v ? "border-violet bg-violet/15 text-white" : "border-white/10 text-white/60"}`}>{l}</button>
              ))}
            </div>
          </div>
          {f.monetization !== "free" && (
            <div><label className={label}>Monthly price (USD)</label><input type="number" min={1} className={field} value={f.price} onChange={(e) => set("price", e.target.value)} /></div>
          )}
          <div><label className={label}>What should it include?</label>
            <div className="grid grid-cols-2 gap-2">
              {MODULES.map(([k, l]) => (
                <button key={k} type="button" onClick={() => toggleMod(k)} className={`text-left px-3 py-2.5 rounded-xl border text-sm font-medium ${f.modules.includes(k) ? "border-violet bg-violet/15 text-white" : "border-white/10 text-white/60"}`}>
                  <span className="mr-1.5">{f.modules.includes(k) ? "✓" : "+"}</span>{l}
                </button>
              ))}
            </div>
          </div>
          <div><label className={label}>Your email <span className="text-white/40 font-normal">(optional — to reach you when paid generation opens)</span></label><input type="email" className={field} placeholder="you@startup.com" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
        </div>
      )}

      {err && <p className="text-red-400 text-sm mt-4">{err}</p>}

      <div className="flex justify-between mt-8">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} className={`px-5 py-3 rounded-xl font-semibold text-white/70 ${step === 0 ? "invisible" : ""}`}>← Back</button>
        {step < 2 ? (
          <button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} className="px-6 py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: "var(--violet)" }}>Next →</button>
        ) : (
          <button onClick={generate} disabled={loading} className="px-7 py-3 rounded-xl font-bold text-white disabled:opacity-60" style={{ background: "var(--violet)" }}>{loading ? "Generating…" : "Generate my SaaS ✦"}</button>
        )}
      </div>
    </main>
  )
}
