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
type Step = { reflection?: string; question?: string; field?: string; kind?: string; options?: Opt[]; allowOther?: boolean; answers?: Record<string, unknown>; done?: boolean; progress?: number }
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
  const [phase, setPhase] = useState<"name" | "chat" | "analyzing" | "spec" | "designs" | "saving">("name")
  const [designs, setDesigns] = useState<string[]>([])
  const [analyze, setAnalyze] = useState<{ label: string; status: "pending" | "running" | "done" }[]>([])
  const [spec, setSpec] = useState<Record<string, any> | null>(null)
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, unknown>>({})
  const [history, setHistory] = useState<{ messages: Msg[]; step: Step | null; log: Entry[] }[]>([])
  const [progress, setProgress] = useState(0)
  const [creds, setCreds] = useState({ gaId: "", clarityId: "", supabaseUrl: "" })
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
  const [result, setResult] = useState<{ url: string; slug: string; emailed: boolean; name: string } | null>(null)
  const [buildMsg, setBuildMsg] = useState("")
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
      if (typeof s.progress === "number") setProgress(Math.max(progress, Math.min(100, s.progress)))
      if (s.reflection) setLog((l) => [...l, { who: "ai", text: s.reflection! }])
      if (s.done) await produceSpec(s.answers || {}, msgs)
    } catch { setErr("Network error.") } finally { setBusy(false) }
  }

  // After the interview (or "finish now"): run the ANALYSIS (spec + identity + 2 designs)
  // with a visible checklist, then show the full diagnosis. Nothing is built yet.
  const ANALYZE_LABELS = ["Analizando tus respuestas", "Definiendo identidad (logo + paleta)", "Diseñando 2 propuestas visuales"]
  async function produceSpec(answers: Record<string, unknown>, msgs: Msg[]) {
    setPendingAnswers(answers)
    setPhase("analyzing")
    const upd = (states: ("pending" | "running" | "done")[]) => setAnalyze(ANALYZE_LABELS.map((l, i) => ({ label: l, status: states[i] })))
    upd(["running", "pending", "pending"])
    try {
      const sr = await fetch("/api/spec", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgs, productName: name }) })
      const sd = await sr.json()
      if (!(sr.ok && sd.ok)) { await finalize(answers); return }
      setSpec(sd.spec)
      upd(["done", "done", "running"])
      try {
        const dr = await fetch("/api/designs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...answers, name: name.trim(), color: color || answers.color, branding: sd.spec?.branding }) })
        const dd = await dr.json()
        if (dr.ok && dd.ok && dd.designs?.length) setDesigns(dd.designs)
      } catch { /* designs optional — spec still shows */ }
      upd(["done", "done", "done"])
      setPhase("spec")
    } catch { await finalize(answers) }
  }

  async function finishNow() {
    setBusy(true); setErr("")
    try {
      const r = await fetch("/api/interview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, productName: name, finish: true }) })
      const d = await r.json()
      if (r.ok && d.step?.done) await produceSpec(d.step.answers || {}, messages)
      else setErr("Couldn't wrap up — try one more answer.")
    } catch { setErr("Network error.") } finally { setBusy(false) }
  }

  function goBack() {
    setHistory((h) => {
      if (!h.length) return h
      const prev = h[h.length - 1]
      setMessages(prev.messages); setStep(prev.step); setLog(prev.log); setOther(""); setErr("")
      return h.slice(0, -1)
    })
  }

  function start() {
    if (!name.trim()) return
    setPhase("chat")
    const first: Msg[] = [{ role: "user", content: `My product is called "${name.trim()}".` }]
    setMessages(first); callInterview(first)
  }

  function answer(sendText: string, show: string, pickedColor?: string) {
    setHistory((h) => [...h, { messages, step, log }]) // snapshot so the user can go back
    if (pickedColor) setColor(pickedColor)
    setLog((l) => [...l, { who: "you", text: show }])
    const next: Msg[] = [...messages, { role: "assistant", content: JSON.stringify(step) }, { role: "user", content: sendText }]
    setMessages(next); setOther(""); callInterview(next)
  }

  // After approving the diagnosis: generate 2 design options to choose from.
  async function startDesigns() {
    setPhase("designs"); setBusy(true); setErr(""); setDesigns([])
    try {
      const r = await fetch("/api/designs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingAnswers, name: name.trim(), color: color || pendingAnswers.color, branding: spec?.branding }),
      })
      const d = await r.json()
      if (r.ok && d.ok && d.designs?.length) setDesigns(d.designs)
      else { await startBuild() }
    } catch { setErr("Error de red generando diseños.") } finally { setBusy(false) }
  }

  // Kick off the multi-agent build job and go to the live progress URL.
  async function startBuild(landingHtml?: string) {
    setErr("")
    try {
      const r = await fetch("/api/job/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingAnswers, name: name.trim(), color: color || pendingAnswers.color, branding: spec?.branding, landingHtml, creds }),
      })
      const d = await r.json()
      if (r.ok && d.id) { router.push(`/build/${d.id}`); return }
      setErr("No se pudo iniciar el build.")
    } catch { setErr("Error de red iniciando el build.") }
  }

  async function finalize(answers: Record<string, unknown>, landingHtml?: string) {
    setPhase("saving"); setBuildMsg("Assembling your config…")
    try {
      const r = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, name: name.trim(), color: color || answers.color, logo, websiteImage: website, branding: spec?.branding, landingHtml }),
      })
      const d = await r.json()
      if (!d.ok || !d.saved) { setErr("Generated, but couldn’t save."); setPhase("chat"); return }

      // Build the complete project and push it to GitHub.
      setBuildMsg("Writing your code and pushing it to GitHub… (this takes a few seconds)")
      const b = await fetch("/api/build", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: d.slug }),
      })
      const bd = await b.json()
      if (b.ok && bd.ok) {
        setResult({ url: bd.url, slug: d.slug, emailed: !!bd.emailed, name: name.trim() })
      } else {
        // Saved + preview available even if the GitHub push isn't configured.
        setResult({ url: "", slug: d.slug, emailed: false, name: name.trim() })
      }
    } catch { setErr("Network error while building."); setPhase("chat") }
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

  if (result) {
    return (
      <main className="max-w-xl mx-auto px-5 py-20 text-center">
        <Link href="/" className="flex items-center gap-2 justify-center text-violet-bright mb-8"><Mark size={28} /><span className="font-extrabold text-white">Puglit</span></Link>
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-3xl font-extrabold">{result.name} is ready</h1>
        <p className="text-white/60 mt-3">We generated the complete code — a Next.js 16 app with auth, Postgres, analytics and your branded landing — and {result.url ? "pushed it to the Puglit repo." : "saved your config."}</p>
        <div className="mt-8 flex flex-col gap-3 items-center">
          {result.url && <a href={result.url} target="_blank" rel="noopener" className="px-7 py-3.5 rounded-xl font-bold text-white" style={{ background: "var(--violet)" }}>View your code on GitHub →</a>}
          <a href={`/x/${result.slug}`} target="_blank" rel="noopener" className="px-7 py-3.5 rounded-xl font-semibold text-white border border-white/15">Preview the landing →</a>
        </div>
        {result.emailed && <p className="text-emerald-400 text-sm mt-5">📬 We also emailed you the link.</p>}
        {!result.url && <p className="text-amber-400 text-sm mt-5">Code delivery to GitHub isn’t connected yet — your config is saved and the preview is live.</p>}
        <Link href="/generate" onClick={() => location.reload()} className="inline-block mt-8 text-violet-bright font-semibold">← Build another</Link>
      </main>
    )
  }

  if (phase === "analyzing") {
    return (
      <main className="max-w-md mx-auto px-5 py-24">
        <Link href="/" className="flex items-center gap-2 text-violet-bright mb-10 justify-center"><Mark size={26} /><span className="font-extrabold text-white">Puglit</span></Link>
        <div className="text-center mb-8">
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-violet/20 border border-violet/30 mb-4 ag-working"><Mark size={30} /></div>
          <h1 className="text-2xl font-extrabold">Analizando {name}…</h1>
          <p className="text-white/55 mt-2 text-sm">Estoy estudiando tus respuestas y preparando el diagnóstico + 2 diseños.</p>
        </div>
        <div className="space-y-2.5">
          {analyze.map((a, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${a.status === "running" ? "border-violet/50 bg-violet/10" : a.status === "done" ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-ink2"}`}>
              <span className="w-5 text-center">{a.status === "done" ? "✅" : a.status === "running" ? <span className="inline-block animate-spin">◌</span> : <span className="text-white/25">○</span>}</span>
              <span className={`text-sm font-semibold ${a.status === "pending" ? "text-white/40" : "text-white"}`}>{a.label}</span>
            </div>
          ))}
        </div>
        {err && <p className="text-red-400 text-sm mt-4 text-center">{err}</p>}
      </main>
    )
  }

  if (phase === "designs") {
    return (
      <main className="max-w-5xl mx-auto px-5 py-12">
        <Link href="/" className="flex items-center gap-2 text-violet-bright mb-6"><Mark size={24} /><span className="font-extrabold text-white">Puglit</span></Link>
        <h1 className="text-3xl font-extrabold">Elegí tu diseño</h1>
        <p className="text-white/60 mt-2 mb-5">Generamos 2 opciones para {name}. Elegí con cuál seguimos — después la convertimos en la app.</p>
        <details className="mb-6 rounded-xl border border-white/10 bg-ink2 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-white/80">🔑 Tus credenciales (opcional) — para cablear analytics y Supabase</summary>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            <input placeholder="Google Analytics ID (G-…)" value={creds.gaId} onChange={(e) => setCreds({ ...creds, gaId: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/35 focus:border-violet focus:outline-none" />
            <input placeholder="Clarity Project ID" value={creds.clarityId} onChange={(e) => setCreds({ ...creds, clarityId: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/35 focus:border-violet focus:outline-none" />
            <input placeholder="Supabase URL (https://…supabase.co)" value={creds.supabaseUrl} onChange={(e) => setCreds({ ...creds, supabaseUrl: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/35 focus:border-violet focus:outline-none" />
          </div>
          <p className="text-xs text-white/40 mt-2">Solo IDs públicos (se cablean en el código). Las claves secretas (Stripe, OpenAI, Resend…) quedan como placeholders en <code>.env.example</code> — nunca se commitean.</p>
        </details>
        {err && <p className="text-red-400 text-sm mb-4">{err}</p>}
        {busy || designs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-ink2 p-10 text-center text-white/60"><span className="inline-block animate-pulse">✦</span> Diseñando 2 opciones distintas… (unos segundos)</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {designs.map((html, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-ink2 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-violet-bright border-b border-white/10">Opción {i + 1}</div>
                <iframe srcDoc={html} sandbox="allow-same-origin" className="w-full h-[420px] bg-white border-0" title={`Opción ${i + 1}`} />
                <div className="p-3 flex gap-2">
                  <button onClick={() => startBuild(html)} className="flex-1 py-2.5 rounded-lg font-bold text-white" style={{ background: "var(--violet)" }}>Elegir esta →</button>
                  <a href={`data:text/html;charset=utf-8,${encodeURIComponent(html)}`} target="_blank" rel="noopener" className="px-3 py-2.5 rounded-lg text-sm text-white/70 border border-white/15">Ampliar</a>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => { setPhase("spec") }} className="mt-6 text-white/60 hover:text-white text-sm font-semibold">← Volver al diagnóstico</button>
      </main>
    )
  }

  if (phase === "spec" && spec) {
    const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
      <div className="mb-5"><h3 className="text-xs font-bold uppercase tracking-wider text-violet-bright mb-2">{title}</h3>{children}</div>
    )
    const List = ({ items }: { items?: string[] }) => (
      <ul className="space-y-1 text-sm text-white/75">{(items || []).map((x, i) => <li key={i} className="flex gap-2"><span className="text-violet-bright">•</span>{x}</li>)}</ul>
    )
    return (
      <main className="max-w-2xl mx-auto px-5 py-12">
        <Link href="/" className="flex items-center gap-2 text-violet-bright mb-6"><Mark size={24} /><span className="font-extrabold text-white">Puglit</span></Link>
        <span className="text-xs font-bold uppercase tracking-widest text-violet-bright">Diagnosis · before we build anything</span>
        <h1 className="text-3xl font-extrabold mt-2">{name}: what we’ll build</h1>
        <p className="text-white/60 mt-2 mb-7">Review the full spec. Nothing is generated until you approve it.</p>

        <div className="rounded-2xl border border-white/10 bg-ink2 p-6">
          {/* generated identity: logo lockup + palette */}
          {(() => {
            const primary = spec.branding?.primaryColor || color || "#7C3AED"
            const logoSvg: string | undefined = spec.branding?.logoSvg
            const mono = (spec.branding?.logo?.monogram || name.trim().slice(0, 2)).toUpperCase()
            const palette: { hex: string; label?: string }[] = Array.isArray(spec.branding?.palette) && spec.branding.palette.length
              ? spec.branding.palette : [{ hex: primary, label: "Primary" }]
            return (
              <div className="mb-6 pb-6 border-b border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-bright mb-3">Identidad (preview generado)</h3>
                <div className="flex items-center gap-3">
                  {logoSvg
                    ? <div className="w-14 h-14 shrink-0 rounded-2xl bg-white p-1.5 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: logoSvg }} />
                    : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shrink-0" style={{ background: primary }}>{mono}</div>}
                  <div>
                    <div className="text-2xl font-extrabold" style={{ color: primary }}>{name}</div>
                    {spec.branding?.tagline && <div className="text-sm text-white/55">{spec.branding.tagline}</div>}
                  </div>
                </div>
                {spec.branding?.logo?.concept && <p className="text-xs text-white/45 mt-2">Logo: {spec.branding.logo.concept}</p>}
                <div className="flex flex-wrap gap-2 mt-4">
                  {palette.map((c, i) => (
                    <div key={i} className="text-center">
                      <div className="w-12 h-12 rounded-lg border border-white/10" style={{ background: c.hex }} title={c.hex} />
                      <div className="text-[9px] text-white/40 mt-1">{c.label || c.hex}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
          <Sec title="Executive summary"><p className="text-sm text-white/80">{spec.executiveSummary}</p></Sec>
          <div className="grid sm:grid-cols-2 gap-x-6">
            <Sec title="Problem"><p className="text-sm text-white/75">{spec.problem}</p></Sec>
            <Sec title="Audience"><p className="text-sm text-white/75">{spec.audience}</p></Sec>
          </div>
          <Sec title="Use cases"><List items={spec.useCases} /></Sec>
          <Sec title="Must-have features"><List items={spec.features?.mustHave} /></Sec>
          {spec.features?.niceToHave?.length ? <Sec title="Nice to have"><List items={spec.features.niceToHave} /></Sec> : null}
          <Sec title="User roles">{(spec.roles || []).map((r: any, i: number) => <p key={i} className="text-sm text-white/75"><b className="text-white">{r.role}:</b> {(r.permissions || []).join(", ")}</p>)}</Sec>
          <Sec title="Data model">{(spec.dataModel || []).map((e: any, i: number) => <p key={i} className="text-sm text-white/75"><b className="text-white">{e.entity}</b> — {(e.fields || []).join(", ")}{e.relations?.length ? ` · rel: ${e.relations.join(", ")}` : ""}</p>)}</Sec>
          <Sec title="Screens">{(spec.screens || []).map((s2: any, i: number) => <p key={i} className="text-sm text-white/75"><b className="text-white">{s2.name}</b> — {s2.purpose}</p>)}</Sec>
          <Sec title="Key user flows"><List items={spec.userFlows} /></Sec>
          {spec.branding && <Sec title="Branding"><p className="text-sm text-white/75">{spec.branding.tagline} · {spec.branding.voice} · {spec.branding.colorRationale}</p></Sec>}
          <Sec title="Monetization"><p className="text-sm text-white/75">{spec.monetization}</p></Sec>
          {spec.integrations?.length ? <Sec title="Integrations">{spec.integrations.map((it: any, i: number) => <p key={i} className="text-sm text-white/75"><b className="text-white">{it.name}</b> — {it.purpose}</p>)}</Sec> : null}
          {spec.ai ? <Sec title="AI"><p className="text-sm text-white/75">{spec.ai}</p></Sec> : null}
          <Sec title="Analytics / KPIs"><List items={spec.analytics} /></Sec>
          <Sec title="Risks"><List items={spec.risks} /></Sec>
          <Sec title="Assumptions"><List items={spec.assumptions} /></Sec>
          <Sec title="What Puglit will generate"><List items={spec.generatedStack} /></Sec>
          {spec.openQuestions?.length ? <Sec title="Open questions"><List items={spec.openQuestions} /></Sec> : null}
        </div>

        {/* the 2 design proposals, generated during the analysis */}
        {designs.length > 0 && (
          <div className="mt-7">
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-bright mb-1">2 propuestas de diseño</h3>
            <p className="text-white/55 text-sm mb-3">Elegí con cuál desarrollamos — la convertimos en la app completa.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {designs.map((html, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-ink2 overflow-hidden flex flex-col">
                  <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-violet-bright border-b border-white/10">Opción {i + 1}</div>
                  <iframe srcDoc={html} sandbox="allow-same-origin" className="w-full h-[360px] bg-white border-0" title={`Opción ${i + 1}`} />
                  <button onClick={() => startBuild(html)} className="m-3 py-2.5 rounded-lg font-bold text-white" style={{ background: "var(--violet)" }}>Desarrollar con esta →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {err && <p className="text-red-400 text-sm mt-4">{err}</p>}
        <div className="flex flex-wrap gap-3 mt-7">
          {designs.length === 0 && <button onClick={() => startBuild()} className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: "var(--violet)" }}>Empezar a desarrollar →</button>}
          <button onClick={() => { setPhase("chat") }} className="px-6 py-3 rounded-xl font-semibold text-white/70 border border-white/15">Agregar más info</button>
        </div>
      </main>
    )
  }

  const s = step
  return (
    <main className="max-w-xl mx-auto px-5 py-10">
      <Link href="/" className="flex items-center gap-2 text-violet-bright mb-4"><Mark size={24} /><span className="font-extrabold text-white">Puglit</span></Link>

      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-3">
            {history.length > 0 && <button onClick={goBack} disabled={busy} className="text-white/60 hover:text-white font-semibold disabled:opacity-40">← Volver</button>}
            <span className="text-white/40">Entendido ~{progress}%</span>
          </div>
          {log.filter((e) => e.who === "you").length >= 3 && <button onClick={finishNow} disabled={busy} className="text-violet-bright font-semibold hover:underline disabled:opacity-40">Terminar y ver diagnóstico →</button>}
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--violet)" }} /></div>
      </div>

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
      {phase === "saving" && <div className={card}><span className="inline-block animate-pulse">✦</span> {buildMsg || "Building your SaaS…"}</div>}

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
              <div className="flex gap-2 pt-1">
                <input value={other} onChange={(e) => setOther(e.target.value)} onKeyDown={(e) => e.key === "Enter" && other.trim() && answer(other, other)} placeholder="✏️ Otra — escribí la tuya…" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-violet focus:outline-none" />
                <button onClick={() => other.trim() && answer(other, other)} className="px-4 rounded-xl text-sm font-bold text-white" style={{ background: "var(--violet)" }}>Send</button>
              </div>
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
