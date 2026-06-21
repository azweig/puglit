"use client"
/** /projects — the user's own project history (their builds). */
import { useEffect, useState } from "react"

interface Job { id: string; name: string; status: string; completion: number; error: string | null; created_at: string; logoImage?: string | null; logoSvg?: string | null }

function Logo({ j }: { j: Job }) {
  if (j.logoImage) return <img src={j.logoImage} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
  if (j.logoSvg) return <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: j.logoSvg }} />
  return <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet/25 text-sm font-extrabold text-violet-bright">{(j.name[0] || "·").toUpperCase()}</div>
}
const STATUS: Record<string, { label: string; tint: string }> = {
  done: { label: "listo", tint: "#22c55e" }, running: { label: "construyendo", tint: "#a78bfa" },
  queued: { label: "en cola", tint: "#fbbf24" }, error: { label: "error", tint: "#f43f5e" },
}

export default function ProjectsPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [email, setEmail] = useState("")

  useEffect(() => {
    fetch("/api/projects/mine").then((r) => r.json()).then((d) => {
      if (d.ok) { setJobs(d.jobs); setEmail(d.email) } else setJobs([])
    }).catch(() => setJobs([]))
  }, [])

  return (
    <main className="min-h-screen bg-[#070a12] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Mis proyectos</h1>
            {email && <p className="mt-0.5 text-sm text-white/45">{email}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetch("/api/auth/me", { method: "POST" }).then(() => (window.location.href = "/login"))} className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white/60">Salir</button>
            <a href="/generate" className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: "var(--violet)" }}>+ Nuevo</a>
          </div>
        </div>

        {jobs === null && <p className="text-white/40">Cargando…</p>}
        {jobs?.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-ink2 p-8 text-center text-white/50">
            Todavía no tenés proyectos. <a href="/generate" className="text-violet-bright underline">Creá el primero →</a>
          </div>
        )}
        <div className="space-y-2">
          {jobs?.map((j) => {
            const st = STATUS[j.status] || { label: j.status, tint: "#94a3b8" }
            return (
              <a key={j.id} href={`/build/${j.id}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink2 px-4 py-3 transition hover:border-violet/50">
                <Logo j={j} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{j.name}</div>
                  <div className="text-[11px] text-white/40">{new Date(j.created_at).toLocaleString()}</div>
                </div>
                {j.status !== "done" && j.status !== "error" && <div className="text-xs tabular-nums text-white/50">{j.completion}%</div>}
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: st.tint + "22", color: st.tint }}>{st.label}</span>
              </a>
            )
          })}
        </div>
      </div>
    </main>
  )
}
