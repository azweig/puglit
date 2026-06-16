"use client"
/**
 * /generate — AI-driven conversational interview.
 * Step 1 is just the product name. From there an LLM (gpt-4o-mini) reads the
 * founder's free text, reflects what it understood, and proposes A/B/C/D options
 * (+ "Other"). Brand color is asked LAST, as 3 AI-suggested palettes with
 * rationale — and the founder can upload an existing logo / website screenshot.
 * On "done" we assemble the config deterministically, save it, and show it live.
 */
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mark } from "@/components/Mark"

type Msg = { role: "user" | "assistant"; content: string }
type Opt = { id: string; label: string; detail?: string; color?: string | null }
type Step = { reflection?: string; question?: string; field?: string; kind?: string; options?: Opt[]; allowOther?: boolean; answers?: Record<string, unknown>; done?: boolean }
type Entry = { who: "ai" | "you"; text: string }

const card = "rounded-2xl border border-white/10 bg-ink2 p-4"

// --- client image helpers ---
function fileToDataURL(file: File, maxDim: number, mime = "image/png", q = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const r = new FileReader()
    r.onload = () => { img.onload = () => {
      const s = Math.min(1, maxDim / Math.max(img.width, img.height))
      const c = document.createElement("canvas")
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s)
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL(mime, q))
    }; img.onerror = reject; img.src = r.result as string }
    r.onerror = reject; r.readAsDataURL(file)
  })
}
function avgColor(dataURL: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = 12; c.height = 12
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, 12, 12)
      const d = ctx.getImageData(0, 0, 12, 12).data
      let r = 0, g = 0, b = 0, n = 0
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 40) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++ }
      if (!n) return resolve("#7C3AED")
      const h = (x: number) => Math.round(x / n).toString(16).padStart(2, "0")
      resolve(`#${h(r)}${h(g)}${h(b)}`)
    }
    img.onerror = () => resolve("#7C3AED"); img.src = dataURL
  })
}

export default function Generate() {
  const router = useRouter()
  const [phase, setPhase] = useState<"name" | "chat" | "saving">("name")
  const [name, setName] = useState("")
  const [messages, setMessages] = useState<Msg[]>([])
  const [step, setStep] = useState<Step | null>(null)
  const [log, setLog] = useState<Entry[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const [other, setOther] = useState("")
  const [logo, setLogo] = useState<string | null>(null)
  const [website, setWebsite] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [log, step, busy])

  async function callInterview(msgs: Msg[]) {
    setBusy(true); setErr("")
    try {
      const r = await fetch("/api/interview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, productName: name, hasLogo: !!logo, hasWebsite: !!website }),
      })
      const d = await r.json()
      if (!r.ok) { setErr(d.error === "ai_not_configured" ? "The AI interview isn’t connected yet (missing OpenAI key)." : "AI error — try again."); return }
      const s: Step = d.step
      setStep(s)
      if (s.reflection) setLog((l) => [...l, { who: "ai", text: s.reflection! }])
      if (s.done) { await finalize(s.answers || {}) }
    } catch { setErr("Network error.") } finally { setBusy(false) }
  }

  function start() {
    if (!name.trim()) return
    setPhase("chat")
    const first: Msg[] = [{ role: "user", content: `My product is called "${name.trim()}".` }]
    setMessages(first); callInterview(first)
  }

  function answer(sendText: string, show: string, pickedColor?: string) {
    if (pickedColor) setColor(pickedColor)
    setLog((l) => [...l, { who: "you", text: show }])
    const next: Msg[] = [...messages, { role: "assistant", content: JSON.stringify(step) }, { role: "user", content: sendText }]
    setMessages(next); setOther(""); callInterview(next)
  }

  async function finalize(answers: Record<string, unknown>) {
    setPhase("saving")
    try {
      const r = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, name: name.trim(), color: color || answers.color, logo, websiteImage: website }),
      })
      const d = await r.json()
      if (d.ok && d.saved) { router.push(`/x/${d.slug}`); return }
      setErr("Generated, but couldn’t save to the gallery."); setPhase("chat")
    } catch { setErr("Network error while saving."); setPhase("chat") }
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const url = await fileToDataURL(f, 400, "image/png"); setLogo(url)
    const c = await avgColor(url); setColor(c)
    setLog((l) => [...l, { who: "you", text: "Uploaded my logo ✓" }])
  }
  async function onWebsite(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const url = await fileToDataURL(f, 800, "image/jpeg", 0.7); setWebsite(url)
    setLog((l) => [...l, { who: "you", text: "Uploaded a screenshot of my site ✓" }])
  }

  // ---------- render ----------
  if (phase === "name") {
    return (
      <main className="max-w-xl mx-auto px-5 py-20">
        <Link href="/" className="flex items-center gap-2 text-violet-bright mb-10"><Mark size={26} /><span className="font-extrabold text-white">Puglit</span></Link>
        <h1 className="text-3xl font-extrabold">Let’s build your SaaS.</h1>
        <p className="text-white/60 mt-2">It’s a quick chat — I’ll read your answers and suggest options as we go. First:</p>
        <label className="block text-sm font-semibold text-white/80 mt-8 mb-2">What’s your product called?</label>
        <input autoFocus className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/35 focus:border-violet focus:outline-none" placeholder="e.g. Mesa" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && start()} />
        <button onClick={start} disabled={!name.trim()} className="mt-5 px-6 py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: "var(--violet)" }}>Start →</button>
      </main>
    )
  }

  const s = step
  return (
    <main className="max-w-xl mx-auto px-5 py-10">
      <Link href="/" className="flex items-center gap-2 text-violet-bright mb-6"><Mark size={24} /><span className="font-extrabold text-white">Puglit</span></Link>

      {/* transcript */}
      <div className="space-y-3 mb-5">
        {log.map((e, i) => (
          <div key={i} className={e.who === "ai" ? "flex gap-2" : "flex gap-2 justify-end"}>
            {e.who === "ai" && <span className="text-violet-bright mt-0.5"><Mark size={20} /></span>}
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${e.who === "ai" ? "bg-ink2 border border-white/10" : "bg-violet/20 border border-violet/30"}`}>{e.text}</div>
          </div>
        ))}
        {busy && <div className="flex gap-2"><span className="text-violet-bright mt-0.5"><Mark size={20} /></span><div className="bg-ink2 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white/50">thinking…</div></div>}
      </div>

      {/* current question + input */}
      {phase === "saving" && <div className={card}>Building your SaaS… ✦</div>}

      {phase === "chat" && !busy && s && !s.done && (
        <div className={card}>
          {s.question && <p className="font-semibold mb-3">{s.question}</p>}

          {s.kind === "color" ? (
            <div className="space-y-3">
              <div className="grid gap-2">
                {(s.options || []).map((o) => (
                  <button key={o.id} onClick={() => answer(`I'll go with ${o.label} (${o.color})`, `${o.label}`, o.color || undefined)} className="flex items-center gap-3 text-left rounded-xl border border-white/10 hover:border-violet/50 p-3">
                    <span className="w-8 h-8 rounded-lg shrink-0 border border-white/15" style={{ background: o.color || "#7C3AED" }} />
                    <span><span className="font-semibold text-sm">{o.label}</span>{o.detail && <span className="block text-xs text-white/55">{o.detail}</span>}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <label className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-lg border border-white/10 hover:border-violet/50">📎 Upload my logo<input type="file" accept="image/*" className="hidden" onChange={onLogo} /></label>
                <label className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-lg border border-white/10 hover:border-violet/50">🖼️ Upload my website<input type="file" accept="image/*" className="hidden" onChange={onWebsite} /></label>
                <label className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-white/10">Pick<input type="color" value={color || "#7C3AED"} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 bg-transparent" /></label>
                {(logo || color) && <button onClick={() => answer(`I'll use ${logo ? "my uploaded logo and color " : ""}${color || "#7C3AED"}`, logo ? "Use my logo & color" : `Color ${color}`, color || undefined)} className="text-xs font-bold px-3 py-2 rounded-lg text-white" style={{ background: "var(--violet)" }}>Continue →</button>}
              </div>
            </div>
          ) : s.kind === "choice" && s.options?.length ? (
            <div className="space-y-2">
              {s.options.map((o) => (
                <button key={o.id} onClick={() => answer(o.label, o.label)} className="block w-full text-left rounded-xl border border-white/10 hover:border-violet/50 p-3">
                  <span className="font-semibold text-sm">{o.label}</span>{o.detail && <span className="block text-xs text-white/55 mt-0.5">{o.detail}</span>}
                </button>
              ))}
              {s.allowOther !== false && (
                <div className="flex gap-2 pt-1">
                  <input value={other} onChange={(e) => setOther(e.target.value)} onKeyDown={(e) => e.key === "Enter" && other.trim() && answer(other, other)} placeholder="Something else…" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-violet focus:outline-none" />
                  <button onClick={() => other.trim() && answer(other, other)} className="px-4 rounded-xl text-sm font-bold text-white" style={{ background: "var(--violet)" }}>Send</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input autoFocus value={other} onChange={(e) => setOther(e.target.value)} onKeyDown={(e) => e.key === "Enter" && other.trim() && answer(other, other)} placeholder="Type your answer…" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-violet focus:outline-none" />
              <button onClick={() => other.trim() && answer(other, other)} className="px-4 rounded-xl text-sm font-bold text-white" style={{ background: "var(--violet)" }}>Send</button>
            </div>
          )}
        </div>
      )}

      {err && <p className="text-red-400 text-sm mt-4">{err}</p>}
      {(logo || website) && <p className="text-xs text-white/40 mt-3">{logo && "logo attached · "}{website && "website attached"}</p>}
      <div ref={endRef} />
    </main>
  )
}
