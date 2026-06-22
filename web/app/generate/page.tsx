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
type Step = { reflection?: string; question?: string; field?: string; kind?: string; options?: Opt[]; allowOther?: boolean; answers?: Record<string, unknown>; done?: boolean; progress?: number; styleVersion?: number }
type Entry = { who: "ai" | "you"; text: string }

const card = "rounded-2xl border border-white/10 bg-ink2 p-4"

// Random-but-coherent product ideas for the ?demo=1 quickstart (skips the interview).
const DEMO_IDEAS: { name: string; what: string; audience: string; benefits: string[]; monetization: "free" | "freemium" | "subscription"; price: number; modules: string[]; languages: "es" | "en" | "both"; color: string }[] = [
  { name: "Mesa", what: "Una webapp de reservas para restaurantes: el comensal reserva online y el local gestiona su salón y turnos.", audience: "Dueños de restaurantes y sus comensales.", benefits: ["Reservas online 24/7", "Menos no-shows con recordatorios", "Panel de salón en tiempo real"], monetization: "subscription", price: 29, modules: ["payments", "emailLifecycle", "profiling"], languages: "es", color: "#E11D48" },
  { name: "FitPulse", what: "App de rutinas de entrenamiento y seguimiento de progreso con planes personalizados.", audience: "Personas que entrenan en casa o gym y quieren seguir su progreso.", benefits: ["Rutinas personalizadas", "Seguimiento de progreso y récords", "Recordatorios y rachas"], monetization: "freemium", price: 8, modules: ["gamification", "profiling", "mobile"], languages: "both", color: "#22C55E" },
  { name: "Cobra", what: "Facturación y cobranzas para freelancers de LATAM: emitís facturas y seguís los pagos.", audience: "Freelancers y pequeños estudios en Latinoamérica.", benefits: ["Facturas en segundos", "Seguimiento de cobranzas", "Recordatorios de pago automáticos"], monetization: "subscription", price: 12, modules: ["payments", "emailLifecycle"], languages: "es", color: "#7C3AED" },
  { name: "Aula", what: "Plataforma para que profesores creen y vendan cursos online con lecciones y quizzes.", audience: "Profesores independientes y sus alumnos.", benefits: ["Crear cursos sin código", "Cobrar por suscripción o curso", "Progreso y certificados"], monetization: "freemium", price: 0, modules: ["contentBlog", "payments", "gamification"], languages: "es", color: "#0EA5E9" },
  { name: "Reparto", what: "Gestión de logística de última milla para pymes: cargás pedidos y optimizás rutas.", audience: "Pymes que hacen envíos propios.", benefits: ["Optimización de rutas", "Seguimiento en vivo del repartidor", "Avisos al cliente"], monetization: "subscription", price: 39, modules: ["geo", "mobile", "emailLifecycle"], languages: "es", color: "#F97316" },
  { name: "Huerto", what: "Marketplace de productores locales: la gente compra verduras y productos directo del productor cercano.", audience: "Consumidores conscientes y productores locales.", benefits: ["Comprar directo del productor", "Productos cercanos por geolocalización", "Apoyo a la economía local"], monetization: "freemium", price: 0, modules: ["geo", "payments", "profiling"], languages: "es", color: "#16A34A" },
]
type Idea = (typeof DEMO_IDEAS)[number]

// Canned spec + designs (no OpenAI) so the demo lands on the summary INSTANTLY.
function cannedSpec(idea: Idea) {
  const mono = idea.name.slice(0, 2).toUpperCase()
  const lighten = (hex: string, p = 0.4) => {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
    const m = (c: number) => Math.round(c + (255 - c) * p).toString(16).padStart(2, "0")
    return `#${m(r)}${m(g)}${m(b)}`
  }
  return {
    executiveSummary: `${idea.what} ${idea.name} resuelve el dolor de ${idea.audience.toLowerCase()} con una experiencia simple y rápida.`,
    problem: `Hoy ${idea.audience.toLowerCase()} resuelven esto con planillas, WhatsApp o herramientas caras y dispersas.`,
    audience: idea.audience,
    useCases: idea.benefits.concat(["Onboarding en minutos", "Panel para administrar todo"]),
    features: { mustHave: idea.benefits.concat(["Cuentas y login", "Panel principal", "Notificaciones"]), niceToHave: ["Exportar datos", "Integraciones", "Modo oscuro"], future: ["App mobile", "IA de recomendación"] },
    roles: [{ role: "Usuario", permissions: ["Crear y ver su contenido", "Editar su perfil"] }, { role: "Admin", permissions: ["Gestionar usuarios", "Ver métricas"] }],
    dataModel: [{ entity: "users", fields: ["id", "email", "name", "plan"], relations: ["1-N items"] }, { entity: "items", fields: ["id", "owner_id", "title", "created_at"], relations: ["N-1 users"] }],
    screens: [{ name: "Home", purpose: "El producto en sí, listo para usar" }, { name: "Crear", purpose: "Dar de alta contenido" }, { name: "Detalle", purpose: "Ver un ítem" }, { name: "Cuenta", purpose: "Perfil y plan" }],
    userFlows: ["Registro → onboarding → primer valor", "Crear → publicar → compartir", idea.monetization !== "free" ? "Upgrade → checkout → plan activo" : "Uso recurrente → retención"],
    branding: { name: idea.name, tagline: idea.benefits[0], voice: "Cercano, claro, confiable", primaryColor: idea.color, colorRationale: "Color de marca elegido para transmitir confianza y energía.", palette: [{ hex: idea.color, label: "Primary" }, { hex: lighten(idea.color), label: "Accent" }, { hex: "#0B0912", label: "Fondo" }, { hex: "#FAF9FD", label: "Texto" }], logo: { monogram: mono, concept: `Monograma ${mono} en una marca limpia y moderna.` } },
    monetization: idea.monetization === "free" ? "Gratis (crecimiento primero)" : idea.monetization === "subscription" ? `Suscripción a $${idea.price}/mes` : `Freemium${idea.price ? ` · Pro a $${idea.price}/mes` : ""}`,
    integrations: idea.modules.includes("payments") ? [{ name: "Stripe", purpose: "Cobros y suscripciones" }] : [],
    ai: "", analytics: ["Activación", "Retención D7", "Conversión a pago"], risks: ["Adquisición de los primeros usuarios", "Mantener la data actualizada"], assumptions: ["El público tiene el problema y paga por resolverlo"],
    generatedStack: ["Next.js 16 + TypeScript", "PostgreSQL", "Auth + Stripe + Resend", "Landing + dashboard a medida"], openQuestions: [],
  }
}
function cannedDesign(idea: Idea, variant: number) {
  const c = idea.color, dark = variant === 0
  const bg = dark ? "#0b0912" : "#faf9fd", fg = dark ? "#f4f2fb" : "#161126", muted = dark ? "#a39fb8" : "#5b5570", surf = dark ? "#15101f" : "#ffffff"
  return `<!doctype html><html><head><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;box-sizing:border-box;font-family:system-ui,sans-serif}body{background:${bg};color:${fg}}
.wrap{max-width:880px;margin:0 auto;padding:28px 22px}
.nav{display:flex;align-items:center;gap:8px;font-weight:800}.dot{width:22px;height:22px;border-radius:7px;background:${c};color:#fff;display:grid;place-items:center;font-size:12px}
.hero{text-align:center;padding:46px 0 30px}.hero h1{font-size:40px;line-height:1.05;letter-spacing:-1px;margin-bottom:14px}.hero h1 b{color:${c}}
.hero p{color:${muted};font-size:17px;max-width:540px;margin:0 auto 22px}
.cta{display:inline-block;background:${c};color:#fff;font-weight:700;padding:13px 26px;border-radius:12px;text-decoration:none}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:18px}
.card{background:${surf};border:1px solid ${dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.07)"};border-radius:16px;padding:18px}
.card .ic{width:34px;height:34px;border-radius:9px;background:${c}22;color:${c};display:grid;place-items:center;font-weight:800;margin-bottom:9px}
.card h3{font-size:15px;margin-bottom:5px}.card p{color:${muted};font-size:13px}
</style></head><body><div class="wrap">
<div class="nav"><span class="dot">${idea.name.slice(0, 1)}</span>${idea.name}</div>
<div class="hero"><h1>${idea.benefits[0].split(" ").slice(0, 3).join(" ")} <b>con ${idea.name}</b></h1><p>${idea.what}</p><a class="cta" href="#">Empezar gratis →</a></div>
<div class="grid">${idea.benefits.map((b, i) => `<div class="card"><div class="ic">${["✦", "◆", "●"][i] || "★"}</div><h3>${b.split(" ").slice(0, 4).join(" ")}</h3><p>${b}</p></div>`).join("")}</div>
</div></body></html>`
}

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
  const [rated, setRated] = useState<boolean | null>(null)
  const rateQuestion = (up: boolean, st: Step) => {
    setRated(up)
    fetch("/api/interview/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ up, kind: st.kind || st.field || "general", ver: st.styleVersion || 0 }) }).catch(() => {})
  }
  const [log, setLog] = useState<Entry[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const [other, setOther] = useState("")
  const [logo, setLogo] = useState<string | null>(null)
  const [website, setWebsite] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string; slug: string; emailed: boolean; name: string } | null>(null)
  const [buildMsg, setBuildMsg] = useState("")
  // references the founder gives up front (URLs / docs / images) — feed interpretation + suggestions
  const [showRefs, setShowRefs] = useState(false)
  const [refUrls, setRefUrls] = useState("")
  const [refText, setRefText] = useState("")
  const [refFiles, setRefFiles] = useState<{ type: "image" | "text"; value: string; name?: string }[]>([])
  const [references, setReferences] = useState("")
  const [refSuggestions, setRefSuggestions] = useState<string[]>([])
  const [refBusy, setRefBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [log, step, busy])

  // ?demo=1 — skip the interview: pick a random coherent idea, synthesize the Q&A, and jump
  // straight into the analysis → spec → designs → build screens (to review what comes AFTER).
  const demoFired = useRef(false)
  useEffect(() => {
    if (demoFired.current) return
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo")) {
      demoFired.current = true; startDemo()
    }
  }, [])

  async function startDemo() {
    const idea = DEMO_IDEAS[Math.floor(Math.random() * DEMO_IDEAS.length)]
    setName(idea.name); setColor(idea.color)
    setPendingAnswers({ what: idea.what, audience: idea.audience, benefits: idea.benefits, monetization: idea.monetization, price: idea.price, modules: idea.modules, languages: idea.languages, color: idea.color })
    // INSTANT: canned spec + 2 designs (no OpenAI) so the demo doesn't wait on generation.
    setSpec(cannedSpec(idea))
    setDesigns([cannedDesign(idea, 0), cannedDesign(idea, 1)])
    setPhase("analyzing")
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const upd = (st: ("pending" | "running" | "done")[]) => setAnalyze(ANALYZE_LABELS.map((l, i) => ({ label: l, status: st[i] })))
    upd(["running", "pending", "pending"]); await sleep(420)
    upd(["done", "running", "pending"]); await sleep(420)
    upd(["done", "done", "running"]); await sleep(420)
    upd(["done", "done", "done"]); await sleep(200)
    setPhase("spec")
  }

  // --- references ingestion (optional, up front) ---
  async function onRefImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    for (const f of files) { const url = await fileToDataURL(f, 1100, "image/jpeg", 0.72); setRefFiles((r) => [...r, { type: "image", value: url, name: f.name }]) }
    e.target.value = ""
  }
  async function onRefDocs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    for (const f of files) { try { const txt = await f.text(); setRefFiles((r) => [...r, { type: "text", value: txt.slice(0, 8000), name: f.name }]) } catch { /* skip */ } }
    e.target.value = ""
  }
  function refCount() { return refFiles.length + refUrls.split(/[\n,\s]+/).filter(Boolean).length + (refText.trim() ? 1 : 0) }
  async function ingestReferences(): Promise<string> {
    const items = [
      ...refUrls.split(/[\n,\s]+/).map((u) => u.trim()).filter(Boolean).map((u) => ({ type: "url" as const, value: u })),
      ...(refText.trim() ? [{ type: "text" as const, value: refText.trim() }] : []),
      ...refFiles,
    ]
    if (!items.length) return ""
    setRefBusy(true)
    try {
      const r = await fetch("/api/references", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, productName: name.trim() }) })
      const d = await r.json()
      if (r.ok && d.ok) { setReferences(d.digest || ""); setRefSuggestions(Array.isArray(d.suggestions) ? d.suggestions : []); return d.digest || "" }
    } catch { /* references are optional */ } finally { setRefBusy(false) }
    return ""
  }

  async function callInterview(msgs: Msg[], refs: string = references) {
    setBusy(true); setErr("")
    try {
      const r = await fetch("/api/interview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, productName: name, hasLogo: !!logo, hasWebsite: !!website, references: refs }),
      })
      const d = await r.json()
      if (!r.ok) { setErr(d.error === "ai_not_configured" ? "The AI interview isn’t connected yet (missing OpenAI key)." : "AI error — try again."); return }
      const s: Step = d.step
      setStep(s); setRated(null)
      if (typeof s.progress === "number") setProgress(Math.max(progress, Math.min(100, s.progress)))
      if (s.reflection) setLog((l) => [...l, { who: "ai", text: s.reflection! }])
      if (s.done) presentReview(s.answers || {}, msgs)
    } catch { setErr("Network error.") } finally { setBusy(false) }
  }

  // GRILL: the founder wants to go deeper (or frowned) → relentless follow-up, never wraps up.
  async function grillMore() {
    setBusy(true); setErr("")
    try {
      const r = await fetch("/api/interview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, productName: name, hasLogo: !!logo, hasWebsite: !!website, references, grill: true }),
      })
      const d = await r.json()
      if (!r.ok) { setErr("AI error — try again."); return }
      const s: Step = d.step
      setStep(s); setRated(null)
      if (s.reflection) setLog((l) => [...l, { who: "ai", text: s.reflection! }])
      // grill never auto-builds, even if the model returns done — keep digging
    } catch { setErr("Network error.") } finally { setBusy(false) }
  }

  // After the interview (or "finish now"): run the ANALYSIS (spec + identity + 2 designs)
  // with a visible checklist, then show the full diagnosis. Nothing is built yet.
  // #6 spec/PRD review: show the captured plan (editable) BEFORE building, instead of auto-building.
  const [review, setReview] = useState<{ answers: Record<string, unknown>; msgs: Msg[]; text: string } | null>(null)
  function presentReview(answers: Record<string, unknown>, msgs: Msg[]) {
    setReview({ answers, msgs, text: JSON.stringify(answers, null, 2) })
  }
  function buildFromReview() {
    if (!review) return
    let a = review.answers
    try { a = JSON.parse(review.text) } catch { /* keep original if edited JSON is invalid */ }
    const msgs = review.msgs; setReview(null); produceSpec(a, msgs)
  }
  const ANALYZE_LABELS = ["Analizando tus respuestas", "Definiendo identidad (logo + paleta)", "Diseñando 2 propuestas visuales"]
  async function produceSpec(answers: Record<string, unknown>, msgs: Msg[], nm: string = name) {
    setPendingAnswers(answers)
    setPhase("analyzing")
    const upd = (states: ("pending" | "running" | "done")[]) => setAnalyze(ANALYZE_LABELS.map((l, i) => ({ label: l, status: states[i] })))
    upd(["running", "pending", "pending"])
    try {
      const sr = await fetch("/api/spec", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgs, productName: nm, references }) })
      const sd = await sr.json()
      if (!(sr.ok && sd.ok)) { await finalize(answers); return }
      setSpec(sd.spec)
      upd(["done", "done", "running"])
      try {
        const dr = await fetch("/api/designs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...answers, name: nm.trim(), color: color || answers.color, branding: sd.spec?.branding }) })
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
      if (r.ok && d.step?.done) presentReview(d.step.answers || {}, messages)
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

  async function start() {
    if (!name.trim()) return
    let refs = references
    if (!refs && refCount() > 0) refs = await ingestReferences()
    setPhase("chat")
    const first: Msg[] = [{ role: "user", content: `My product is called "${name.trim()}".${refs ? " (I also gave references up front — use them.)" : ""}` }]
    setMessages(first); callInterview(first, refs)
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
    // demo flow: don't create a real job (the heavy pipeline) — go to the simulated build
    // so the office/flow screens can be reviewed end-to-end.
    if (demoFired.current) { router.push("/build/demo?demo=1"); return }
    try {
      const r = await fetch("/api/job/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingAnswers, name: name.trim(), color: color || pendingAnswers.color, branding: spec?.branding, landingHtml, creds, references, archetype: spec?.archetype }),
      })
      const d = await r.json()
      if (r.ok && d.id) { router.push(`/build/${d.id}`); return }
      setErr("No se pudo iniciar el build.")
    } catch { setErr("Error de red iniciando el build.") }
  }

  // launch the GENETIC tournament with this diagnosis → the 3 teams compete to design it,
  // watched live in the 2.5D campus. (The interview/diagnosis is the "creation"; this is
  // where it feeds the evolutionary council.)
  async function startGeneticTournament() {
    setErr("")
    try {
      const what = String(pendingAnswers.what || spec?.executiveSummary || "")
      await fetch("/api/genetic/tournament", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), what, audience: String(pendingAnswers.audience || "usuarios"), monetization: String(pendingAnswers.monetization || "free") }),
      })
      router.push("/campus")
    } catch { setErr("No se pudo lanzar el torneo genético.") }
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
        <input autoFocus className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/35 focus:border-violet focus:outline-none" placeholder="e.g. Mesa" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !showRefs && start()} />

        {/* Optional references — given up front, used to interpret the idea + suggest */}
        <div className="mt-5 rounded-xl border border-white/10 bg-ink2">
          <button onClick={() => setShowRefs((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 text-left">
            <span className="text-sm font-semibold text-white/85">📎 ¿Tenés referencias? <span className="text-white/45 font-normal">(opcional)</span></span>
            <span className="text-white/40 text-xs">{refCount() ? `${refCount()} agregada(s)` : "URLs · imágenes · docs · texto"}{showRefs ? "  ▲" : "  ▼"}</span>
          </button>
          {showRefs && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-white/50">Pegá links de sitios/productos que te gustan, subí capturas o mockups, documentos, o pegá texto. Los leo (las imágenes con visión) y los uso para interpretar tu idea y sugerirte cosas.</p>
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1">URLs / páginas web (una por línea)</label>
                <textarea value={refUrls} onChange={(e) => setRefUrls(e.target.value)} rows={2} placeholder="https://status.claude.com&#10;https://miproducto.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-violet focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1">Texto / documentación</label>
                <textarea value={refText} onChange={(e) => setRefText(e.target.value)} rows={2} placeholder="Pegá specs, notas, requisitos…" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-violet focus:outline-none" />
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-lg border border-white/10 hover:border-violet/50">🖼️ Imágenes / capturas<input type="file" accept="image/*" multiple className="hidden" onChange={onRefImages} /></label>
                <label className="cursor-pointer text-xs font-semibold px-3 py-2 rounded-lg border border-white/10 hover:border-violet/50">📄 Documentos (.txt/.md)<input type="file" accept=".txt,.md,.csv,.json,text/*" multiple className="hidden" onChange={onRefDocs} /></label>
              </div>
              {refFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {refFiles.map((f, i) => (
                    <span key={i} className="text-[11px] bg-white/5 border border-white/10 rounded-md px-2 py-1 flex items-center gap-1">
                      {f.type === "image" ? "🖼️" : "📄"} {f.name || (f.type === "image" ? "imagen" : "texto")}
                      <button onClick={() => setRefFiles((r) => r.filter((_, j) => j !== i))} className="text-white/40 hover:text-red-400">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={start} disabled={!name.trim() || refBusy} className="mt-5 px-6 py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: "var(--violet)" }}>{refBusy ? "Leyendo referencias…" : refCount() ? "Start con referencias →" : "Start →"}</button>
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
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {spec.archetype && spec.archetype !== "other" && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet/20 border border-violet/30 text-violet-bright">{({ game: "🎮 Juego", status_monitoring: "📈 Status / Monitoring", marketplace: "🛒 Marketplace", social: "💬 Social", content_feed: "📰 Contenido / Feed", directory: "📂 Directorio", dashboard: "📊 Dashboard", ecommerce: "🛍️ E-commerce", tool: "🛠️ Herramienta", saas_accounts: "🔐 SaaS con cuentas" } as Record<string, string>)[spec.archetype] || spec.archetype}</span>}
          {references && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">📎 Basado también en tus referencias</span>}
        </div>
        <p className="text-white/60 mt-3 mb-7">Review the full spec. Nothing is generated until you approve it.</p>

        {/* Honest, decision-critical callouts: OSS alternatives + what only you can provide */}
        {Array.isArray(spec.ossAlternatives) && spec.ossAlternatives.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 mb-4">
            <h3 className="text-sm font-bold text-amber-300 mb-1">⚠️ Ya existe open-source que hace casi esto</h3>
            <p className="text-xs text-white/55 mb-3">Honestidad ante todo: adoptarlo/forkearlo puede ganarle a construir de cero. Igual podemos hacerte una versión a medida si querés.</p>
            <div className="space-y-2">
              {spec.ossAlternatives.map((o: any, i: number) => (
                <div key={i} className="text-sm text-white/80"><a href={o.url} target="_blank" rel="noopener" className="font-bold text-amber-200 hover:underline">{o.name} ↗</a> — {o.why}</div>
              ))}
            </div>
          </div>
        )}
        {Array.isArray(spec.neededFromYou) && spec.neededFromYou.length > 0 && (
          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-5 mb-4">
            <h3 className="text-sm font-bold text-sky-300 mb-1">📥 Lo que necesitamos de vos para que funcione de verdad</h3>
            <p className="text-xs text-white/55 mb-3">Mientras tanto se construye con datos de ejemplo; cuando nos pases esto, queda real.</p>
            <ul className="space-y-1 text-sm text-white/80">{spec.neededFromYou.map((x: string, i: number) => <li key={i} className="flex gap-2"><span className="text-sky-300">→</span>{x}</li>)}</ul>
          </div>
        )}
        {refSuggestions.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 mb-4">
            <h3 className="text-sm font-bold text-emerald-300 mb-2">💡 Sugerencias a partir de tus referencias</h3>
            <ul className="space-y-1 text-sm text-white/80">{refSuggestions.map((x, i) => <li key={i} className="flex gap-2"><span className="text-emerald-300">•</span>{x}</li>)}</ul>
          </div>
        )}

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
          <button onClick={startGeneticTournament} className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: "linear-gradient(90deg,#7c3aed,#db2777)" }}>🧬 Competir — torneo genético →</button>
          {designs.length === 0 && <button onClick={() => startBuild()} className="px-6 py-3 rounded-xl font-semibold text-white/70 border border-white/15">desarrollo simple (1 equipo)</button>}
          <button onClick={() => { setPhase("chat") }} className="px-6 py-3 rounded-xl font-semibold text-white/70 border border-white/15">Agregar más info</button>
        </div>
      </main>
    )
  }

  const s = step
  return (
    <main className="max-w-xl mx-auto px-5 pt-10 pb-32">
      <Link href="/" className="flex items-center gap-2 text-violet-bright mb-4"><Mark size={24} /><span className="font-extrabold text-white">Puglit</span></Link>

      {/* progress "thermometer" — DOCKED at the bottom so it's always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-ink/90 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-5 py-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-3">
              {history.length > 0 && <button onClick={goBack} disabled={busy} className="text-white/60 hover:text-white font-semibold disabled:opacity-40">← Volver</button>}
              <span className="text-white/50 font-semibold">Entendido ~{progress}%</span>
            </div>
            {log.filter((e) => e.who === "you").length >= 3 && (
              <div className="flex items-center gap-4">
                <button onClick={grillMore} disabled={busy} className={`font-semibold hover:underline disabled:opacity-40 ${rated === false ? "text-orange-400" : "text-white/60"}`} title="Que profundice en lo que falta">🔥 Profundizar más</button>
                <button onClick={finishNow} disabled={busy} className="text-violet-bright font-semibold hover:underline disabled:opacity-40">Terminar →</button>
              </div>
            )}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--violet)" }} /></div>
        </div>
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

      {/* #6 spec/PRD review — confirm/edit the captured plan before building */}
      {phase === "chat" && review && !busy && (
        <div className={card}>
          <p className="font-bold mb-1">📋 Revisá el plan antes de construir</p>
          <p className="text-xs text-white/50 mb-3">Esto es lo que entendí. Editalo si querés (es JSON) y construimos con esto.</p>
          <textarea value={review.text} onChange={(e) => setReview((r) => r && ({ ...r, text: e.target.value }))} rows={12} className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-xs font-mono outline-none focus:border-violet/50" />
          <div className="flex gap-2 mt-3">
            <button onClick={buildFromReview} className="px-5 py-2.5 rounded-xl font-bold text-white" style={{ background: "var(--violet)" }}>Construir con esto →</button>
            <button onClick={() => { const r = review; setReview(null); if (r) grillMore() }} className="px-5 py-2.5 rounded-xl font-semibold text-white/70 border border-white/15">🔥 Mejor profundizá más</button>
          </div>
        </div>
      )}

      {phase === "chat" && !review && !busy && s && !s.done && (
        <div className={card}>
          {s.question && (
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="font-semibold">{s.question}</p>
              {/* the founder's 😀/😞 on this question → evolves the interviewer's style */}
              {rated === null ? (
                <div className="flex gap-1 shrink-0 text-lg" title="¿Te gustó cómo te pregunté?">
                  <button onClick={() => rateQuestion(true, s)} className="opacity-50 hover:opacity-100 transition" aria-label="me gustó la pregunta">😀</button>
                  <button onClick={() => rateQuestion(false, s)} className="opacity-50 hover:opacity-100 transition" aria-label="no me gustó la pregunta">😞</button>
                </div>
              ) : <span className="text-xs text-white/40 shrink-0">¡gracias!</span>}
            </div>
          )}

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
