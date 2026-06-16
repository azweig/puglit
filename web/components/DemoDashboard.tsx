"use client"
/**
 * Functional CRUD dashboard for the live demo — sidebar layout (like TodoAstros),
 * generated from the project's AI-designed entities. Persists per-user via
 * /api/demo/records (Puglit's DB). Mirrors the spine's /app dashboard.
 */
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mark } from "@/components/Mark"

type Field = { name: string; type: string; required?: boolean; enumValues?: string[] }
type Entity = { name: string; plural: string; fields: Field[] }
type Rec = { id: number; data: Record<string, unknown>; created_at: string }
const label = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

export function DemoDashboard({ slug, productName, brand, userName, entities }: { slug: string; productName: string; brand: string; userName: string; entities: Entity[] }) {
  const router = useRouter()
  const [active, setActive] = useState(-1) // -1 = overview
  const [records, setRecords] = useState<Rec[]>([])
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const [drawer, setDrawer] = useState(false)
  const entity = active >= 0 ? entities[active] : null

  async function load() {
    if (!entity) return
    const r = await fetch(`/api/demo/records?slug=${encodeURIComponent(slug)}&entity=${encodeURIComponent(entity.name)}`)
    if (r.ok) setRecords((await r.json()).records || [])
  }
  useEffect(() => { setForm({}); setErr(""); setRecords([]); if (entity) load() /* eslint-disable-next-line */ }, [active])

  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!entity) return; setErr(""); setBusy(true)
    try {
      const r = await fetch("/api/demo/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, entity: entity.name, data: form }) })
      if (!r.ok) { setErr("Couldn't save"); return }
      setForm({}); await load()
    } finally { setBusy(false) }
  }
  async function del(id: number) {
    if (!entity) return
    await fetch("/api/demo/records", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, entity: entity.name, id }) })
    await load()
  }
  async function logout() {
    await fetch("/api/demo/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) })
    router.push(`/x/${slug}`)
  }

  function input(f: Field) {
    const v = form[f.name] ?? ""
    const set = (val: unknown) => setForm({ ...form, [f.name]: val })
    const base = "w-full border border-black/15 rounded-lg px-3 py-2 text-sm focus:outline-none text-ink"
    if (f.type === "longtext" || f.type === "json") return <textarea className={base} rows={3} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required} />
    if (f.type === "bool") return <input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked)} className="w-5 h-5" />
    if (f.type === "enum") return <select className={base} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required}><option value="">—</option>{(f.enumValues || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>
    const t = f.type === "int" || f.type === "float" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : f.type === "email" ? "email" : f.type === "url" ? "url" : "text"
    return <input type={t} className={base} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required} />
  }

  const navBtn = (i: number, lbl: string) => (
    <button key={i} onClick={() => { setActive(i); setDrawer(false) }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left ${active === i ? "text-white font-semibold" : "text-ink/65 hover:bg-black/[0.03]"}`} style={active === i ? { background: brand } : undefined}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active === i ? "#fff" : brand }} />{lbl}
    </button>
  )

  const Sidebar = (
    <div className="flex flex-col h-full">
      <Link href={`/x/${slug}`} className="px-5 py-5 flex items-center gap-2" style={{ color: brand }}><Mark size={24} /><span className="font-extrabold text-ink">{productName}</span></Link>
      <div className="px-4 pb-3"><div className="flex items-center gap-3 p-2 rounded-xl bg-black/[0.03]"><div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: brand }}>{userName.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="text-ink text-sm font-semibold truncate">{userName}</p><p className="text-ink/40 text-[11px] uppercase">demo</p></div></div></div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navBtn(-1, "Overview")}
        {entities.map((e, i) => navBtn(i, e.plural))}
      </nav>
      <button onClick={logout} className="m-3 px-3 py-2 rounded-lg text-sm text-ink/60 hover:bg-black/[0.03] text-left">Log out</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-paper text-ink" style={{ ["--brand" as string]: brand }}>
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-black/5 z-30">{Sidebar}</aside>
      <header className="lg:hidden sticky top-0 h-14 bg-white border-b border-black/5 z-30 flex items-center justify-between px-4">
        <button onClick={() => setDrawer(true)} className="w-9 h-9 -ml-1 flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg></button>
        <span className="font-extrabold" style={{ color: brand }}>{productName}</span><span className="w-9" />
      </header>
      {drawer && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setDrawer(false)} />}
      <aside className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-white border-r border-black/5 z-50 transition-transform ${drawer ? "translate-x-0" : "-translate-x-full"}`}>{Sidebar}</aside>

      <main className="lg:pl-64"><div className="max-w-4xl mx-auto px-5 py-8">
        {!entity ? (
          <div>
            <h1 className="text-2xl font-extrabold">Welcome to {productName}</h1>
            <p className="text-ink/60 mt-1">This is your real, working dashboard — manage everything below.</p>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {entities.map((e, i) => (
                <button key={e.name} onClick={() => setActive(i)} className="text-left bg-white border border-black/5 rounded-2xl p-5 shadow-sm hover:border-current transition" style={{ color: brand }}>
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: brand }}>{e.name.slice(0, 1)}</div><div><div className="font-bold text-ink">{e.plural}</div><div className="text-ink/50 text-sm">{e.fields.length} fields</div></div></div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-extrabold mb-6">{entity.plural}</h1>
            <div className="grid md:grid-cols-2 gap-6">
              <form onSubmit={add} className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm h-fit">
                <h2 className="font-bold mb-4">New {entity.name}</h2>
                <div className="space-y-3">{entity.fields.map((f) => (<div key={f.name}><label className="block text-xs font-semibold text-ink/70 mb-1">{label(f.name)}{f.required && " *"}</label>{input(f)}</div>))}</div>
                {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
                <button disabled={busy} className="mt-4 w-full py-2.5 rounded-lg text-white font-semibold disabled:opacity-60" style={{ background: brand }}>{busy ? "…" : `Add ${entity.name}`}</button>
              </form>
              <div>
                <h2 className="font-bold mb-4">Your {entity.plural} <span className="text-ink/40 font-normal">({records.length})</span></h2>
                {records.length === 0 ? <p className="text-ink/50 text-sm bg-white border border-black/5 rounded-2xl p-5">Nothing yet — add your first {entity.name.toLowerCase()}.</p> : (
                  <div className="space-y-2">{records.map((r) => (<div key={r.id} className="bg-white border border-black/5 rounded-xl p-4 text-sm flex justify-between gap-3"><div className="space-y-0.5 min-w-0">{entity.fields.map((f) => r.data[f.name] != null && String(r.data[f.name]) !== "" && (<div key={f.name} className="truncate"><span className="text-ink/45">{label(f.name)}:</span> <span className="text-ink/85">{String(r.data[f.name])}</span></div>))}</div><button onClick={() => del(r.id)} className="text-ink/30 hover:text-red-500 shrink-0">✕</button></div>))}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div></main>
    </div>
  )
}
