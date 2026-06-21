"use client"
/**
 * /build/[id] — live progress URL. Polls the job, advancing one step (agent) per
 * call, and shows each step's status until the whole build is done.
 */
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Mark } from "@/components/Mark"
import { FlowGraph } from "@/components/FlowGraph"
import { OfficeStage } from "@/components/OfficeStage"

type Step = { key: string; label: string; status: "pending" | "running" | "done" | "error"; detail?: string }
type Job = { status: string; steps: Step[]; artifacts?: { githubUrl?: string; previewUrl?: string }; name?: string; slug?: string }

export default function BuildPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [art, setArt] = useState<{ sql?: string; erd?: string; engine?: { path: string; code: string }; findings?: { severity: string; desc: string }[]; ciGreen?: boolean | null; ciErrors?: { path: string; line: number; message: string }[] } | null>(null)
  const [tab, setTab] = useState<"engine" | "findings" | "erd" | "sql">("engine")
  const [view, setView] = useState<"oficina" | "flujo">("oficina")
  const [err, setErr] = useState("")
  const running = useRef(false)

  const demo = typeof window !== "undefined" && (new URLSearchParams(window.location.search).get("demo") === "1" || id === "demo")

  // DEMO: simulate the whole pipeline on a timer so the office/flow animate end-to-end
  // (no real job, no OpenAI cost) — for reviewing the screens after the questionnaire.
  useEffect(() => {
    if (!demo) return
    let cancelled = false
    const KEYS = ["data-model", "research", "contracts", "brand", "design", "schema", "seed", "erd", "auth", "payments", "email", "crons", "admin", "dashboard", "analytics", "seo", "security", "engine", "stakeholder", "docs-tech", "docs-biz", "env", "deliver", "ci-verify"]
    const LABELS: Record<string, string> = { "data-model": "Arquitecto · modelo de datos", research: "Researcher · fuentes de datos reales", contracts: "Contracts · tipos + contrato de API", brand: "Marca · logo + paleta", design: "Diseño · landing", schema: "DBA · esquema SQL", seed: "DBA · datos de ejemplo", erd: "Arquitecto · diagrama ER", auth: "Auth · cuentas + JWT", payments: "Pagos · Stripe + gating", email: "Email · Resend", crons: "Crons · fire-and-forget", admin: "Admin · panel", dashboard: "Frontend · dashboard", analytics: "Analytics · funnels", seo: "SEO · metadata", security: "Seguridad · RLS + headers", engine: "Engine · lógica única del producto", stakeholder: "Stakeholder · 4 especialistas ×3", "docs-tech": "Technical Writer · docs", "docs-biz": "Business · FODA + pitch", env: "DevOps · .env", deliver: "DevOps · push a GitHub", "ci-verify": "QA · compilación real (CI)" }
    const det = (k: string) => ({ "data-model": "diseñando entidades y relaciones…", research: "buscando fuentes/API reales…", engine: "escribiendo la lógica única…", "ci-verify": "compilando con tsc en CI…" } as Record<string, string>)[k] || "trabajando…"
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const base: Step[] = KEYS.map((k) => ({ key: k, label: LABELS[k], status: "pending" }))
    setJob({ status: "running", name: "Mesa (demo)", steps: base })
    ;(async () => {
      for (let i = 0; i < KEYS.length && !cancelled; i++) {
        setJob((j) => j && ({ ...j, status: "running", steps: j.steps.map((s, idx) => ({ ...s, status: idx < i ? "done" : idx === i ? "running" : "pending", detail: idx === i ? det(s.key) : s.detail })) }))
        if (KEYS[i] === "stakeholder") { for (const r of [1, 2, 3]) { await sleep(1800); if (cancelled) return; setJob((j) => j && ({ ...j, steps: j.steps.map((s) => s.key === "stakeholder" ? { ...s, detail: `ronda ${r}/3 · 5 especialistas revisando` } : s) })) } }
        else if (i < 3) await sleep(2700) // planning: hold so the kickoff meeting assembles & is visible
        else await sleep(1100)
      }
      if (!cancelled) setJob((j) => j && ({ ...j, status: "done", steps: j.steps.map((s) => ({ ...s, status: "done" })) }))
    })()
    return () => { cancelled = true }
  }, [id, demo])

  useEffect(() => {
    if (demo) return
    let stop = false
    async function tick() {
      if (running.current) return
      running.current = true
      try {
        const r = await fetch(`/api/job/${id}/advance`, { method: "POST" })
        const d = await r.json()
        if (!r.ok) { setErr("No se encontró el build."); return }
        setJob(d)
        if (!stop && (d.status === "running" || d.status === "queued")) setTimeout(tick, d.status === "queued" ? 2500 : 600)
      } catch { if (!stop) setTimeout(tick, 1500) } finally { running.current = false }
    }
    tick()
    return () => { stop = true }
  }, [id, demo])

  useEffect(() => {
    if (demo) return
    if (job?.status === "done" && !art) {
      fetch(`/api/job/${id}`).then((r) => r.json()).then((d) => d.ok && setArt({ sql: d.sql, erd: d.erd, engine: d.engine, findings: d.findings, ciGreen: d.ciGreen, ciErrors: d.ciErrors })).catch(() => {})
    }
  }, [job?.status, art, id, demo])

  const done = job?.status === "done"
  const b64 = (s: string) => { try { return btoa(unescape(encodeURIComponent(s))) } catch { return "" } }
  const total = job?.steps?.length || 1
  const completed = job?.steps?.filter((s) => s.status === "done").length || 0
  const pct = Math.round((completed / total) * 100)

  return (
    <main className="max-w-5xl mx-auto px-5 py-12">
      <Link href="/" className="flex items-center gap-2 text-violet-bright mb-6"><Mark size={24} /><span className="font-extrabold text-white">Puglit</span></Link>
      <h1 className="text-3xl font-extrabold">{done ? "✅ " : job?.status === "queued" ? "⏳ " : ""}Construyendo {job?.name || "tu proyecto"}…</h1>
      <p className="text-white/60 mt-2 mb-6">{done ? "Listo. El código fue entregado (sin compilar). Compilá y exportalo a TU cuenta abajo." : job?.status === "queued" ? "En cola — esperando un cupo de agentes. Esto sigue solo aunque cierres la pestaña (el watchdog lo continúa)." : job?.status === "error" ? "Hubo un error; el watchdog reintentará los pasos trabados." : "Los agentes están trabajando. Podés cerrar esta pestaña — te avisamos por mail si dejaste tu email."}</p>

      {done && <ExportPanel jobId={id} />}

      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-6"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--violet)" }} /></div>

      {/* live visual swarm — flow (n8n) / office (animated) tabs */}
      {!!job?.steps?.length && (
        <div className="mb-6">
          <div className="flex gap-2 mb-3">
            <button onClick={() => setView("oficina")} className={`text-xs font-bold px-3.5 py-1.5 rounded-lg ${view === "oficina" ? "text-white" : "text-white/55 border border-white/15"}`} style={view === "oficina" ? { background: "var(--violet)" } : undefined}>🏢 Vista oficina</button>
            <button onClick={() => setView("flujo")} className={`text-xs font-bold px-3.5 py-1.5 rounded-lg ${view === "flujo" ? "text-white" : "text-white/55 border border-white/15"}`} style={view === "flujo" ? { background: "var(--violet)" } : undefined}>🔀 Vista flujo</button>
          </div>
          {view === "oficina" ? <OfficeStage steps={job.steps} /> : <FlowGraph steps={job.steps} />}
        </div>
      )}

      {/* detailed step log (text + checks) */}
      <details open className="group">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-white/45 mb-3 select-none">Detalle paso a paso ({completed}/{total})</summary>
      <div className="space-y-2">
        {(job?.steps || Array.from({ length: 9 }, (_, i) => ({ key: i, label: "…", status: "pending" } as any))).map((s: Step, i: number) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-ink2 p-3">
            <span className="mt-0.5 w-5 text-center">
              {s.status === "done" ? "✅" : s.status === "running" ? <span className="inline-block animate-spin">◌</span> : s.status === "error" ? "⚠️" : <span className="text-white/25">○</span>}
            </span>
            <div className="min-w-0">
              <div className={`text-sm font-semibold ${s.status === "pending" ? "text-white/40" : "text-white"}`}>{s.label}</div>
              {s.detail && <div className="text-xs text-white/45">{s.detail}</div>}
            </div>
          </div>
        ))}
      </div>
      </details>

      {err && <p className="text-red-400 text-sm mt-4">{err}</p>}

      {done && (
        <div className="mt-7 flex flex-wrap gap-3">
          {job?.artifacts?.previewUrl && <a href={job.artifacts.previewUrl} target="_blank" rel="noopener" className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: "var(--violet)" }}>Ver tu sitio →</a>}
          {job?.artifacts?.githubUrl && <a href={job.artifacts.githubUrl} target="_blank" rel="noopener" className="px-6 py-3 rounded-xl font-semibold text-white border border-white/15">Ver el código en GitHub</a>}
        </div>
      )}

      {done && art && art.ciGreen != null && (
        <div className={`mt-6 rounded-xl border p-3 text-sm ${art.ciGreen ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300" : "border-amber-500/40 bg-amber-500/5 text-amber-300"}`}>
          {art.ciGreen ? "✅ Compila — verificado con tsc en CI real" : `⚠️ El CI no llegó a verde (${(art.ciErrors || []).length} errores tsc). El código está, pero requiere revisión.`}
        </div>
      )}

      {done && art && (art.sql || art.erd || art.engine || art.findings?.length) && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {art.engine && <button onClick={() => setTab("engine")} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${tab === "engine" ? "text-white" : "text-white/50 border border-white/15"}`} style={tab === "engine" ? { background: "var(--violet)" } : undefined}>Código del engine</button>}
            {!!art.findings?.length && <button onClick={() => setTab("findings")} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${tab === "findings" ? "text-white" : "text-white/50 border border-white/15"}`} style={tab === "findings" ? { background: "var(--violet)" } : undefined}>Findings ({art.findings.length})</button>}
            <button onClick={() => setTab("erd")} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${tab === "erd" ? "text-white" : "text-white/50 border border-white/15"}`} style={tab === "erd" ? { background: "var(--violet)" } : undefined}>Diagrama ER (UML)</button>
            <button onClick={() => setTab("sql")} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${tab === "sql" ? "text-white" : "text-white/50 border border-white/15"}`} style={tab === "sql" ? { background: "var(--violet)" } : undefined}>SQL / migraciones</button>
          </div>
          {tab === "engine" && art.engine && (
            <div>
              <div className="text-xs text-white/45 mb-1 font-mono">{art.engine.path}</div>
              <pre className="rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/80 overflow-x-auto max-h-96">{art.engine.code}</pre>
            </div>
          )}
          {tab === "findings" && (
            <div className="space-y-2">
              {(art.findings || []).map((f, i) => (
                <div key={i} className={`rounded-lg border p-3 text-sm ${f.severity === "BLOCKING" ? "border-red-500/40 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
                  <span className={`text-[10px] font-bold ${f.severity === "BLOCKING" ? "text-red-400" : "text-amber-400"}`}>{f.severity}</span>
                  <span className="text-white/75 ml-2">{f.desc}</span>
                </div>
              ))}
              <p className="text-xs text-white/40">BLOCKING se reparan antes de entregar; ADVISORY quedan en el backlog (no bloquean).</p>
            </div>
          )}
          {tab === "erd" && art.erd && (
            <div className="rounded-xl border border-white/10 bg-white p-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://mermaid.ink/img/${b64(art.erd)}?type=png`} alt="ER diagram" className="max-w-full inline-block" />
            </div>
          )}
          {tab === "sql" && art.sql && (
            <div>
              <pre className="rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/80 overflow-x-auto max-h-96">{art.sql}</pre>
              <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(art.sql)}`} download={`${job?.slug || "schema"}.sql`} className="inline-block mt-2 text-violet-bright font-semibold text-sm">↓ Descargar .sql</a>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

/** Compile & export the delivered code to the USER's own GitHub / Vercel (BYO tokens). */
function ExportPanel({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false)
  const [gh, setGh] = useState("")
  const [vc, setVc] = useState("")
  const [st, setSt] = useState<{ status?: string; githubUrl?: string | null; vercelUrl?: string | null; note?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const poll = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { poll.current && clearInterval(poll.current) }, [])

  async function run() {
    if (!gh.trim() && !vc.trim()) { setSt({ note: "Pegá al menos un token (GitHub y/o Vercel)." }); return }
    setBusy(true); setSt({ status: "starting" })
    const d = await fetch("/api/genetic/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId, githubToken: gh.trim() || undefined, vercelToken: vc.trim() || undefined }) }).then((r) => r.json()).catch(() => ({}))
    if (!d.ok) { setBusy(false); setSt({ note: d.error || "no arrancó" }); return }
    poll.current = setInterval(async () => {
      const s = await fetch(`/api/genetic/export?jobId=${jobId}`).then((r) => r.json()).catch(() => null)
      if (s) { setSt(s); if (s.status === "done" || s.status === "error") { clearInterval(poll.current!); setBusy(false) } }
    }, 3000)
  }

  const done = st?.status === "done"
  return (
    <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.06] p-4">
      {!open ? (
        <button onClick={() => setOpen(true)} className="rounded-xl bg-emerald-500 px-5 py-2.5 font-bold text-black">🚀 Compilar y exportar →</button>
      ) : (
        <div>
          <div className="mb-1 font-bold text-white">Compilar y exportar a TU cuenta</div>
          <p className="mb-3 text-xs text-white/55">Pegá tu token de GitHub (cualquier app) y/o Vercel (solo apps web). Se usan una vez y <b>nunca se guardan</b>. Puglit no paga nada — es tu deploy.</p>
          <input value={gh} onChange={(e) => setGh(e.target.value)} placeholder="GitHub token (ghp_…) — opcional" className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
          <input value={vc} onChange={(e) => setVc(e.target.value)} placeholder="Vercel token — opcional" className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" />
          <button onClick={run} disabled={busy} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black disabled:opacity-50">{busy ? "compilando + exportando…" : "Exportar"}</button>
          {st?.status && st.status !== "done" && st.status !== "error" && <span className="ml-3 text-xs text-white/60">⏱ {st.status === "deploying" ? "compilando y subiendo…" : "arrancando…"} (podés cerrar, sigue en el server)</span>}
          {st?.note && <p className="mt-2 text-xs text-amber-300">{st.note}</p>}
          {done && (
            <div className="mt-3 space-y-1 text-sm">
              {st?.githubUrl && <div>✅ GitHub: <a href={st.githubUrl} target="_blank" rel="noreferrer" className="text-violet-bright underline">{st.githubUrl}</a></div>}
              {st?.vercelUrl && <div>✅ Vercel: <a href={st.vercelUrl} target="_blank" rel="noreferrer" className="text-violet-bright underline">{st.vercelUrl}</a></div>}
              {!st?.githubUrl && !st?.vercelUrl && <div className="text-amber-300">Terminó pero sin URLs — revisá los tokens.</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
