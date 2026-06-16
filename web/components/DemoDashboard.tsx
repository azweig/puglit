"use client"
/**
 * Functional CRUD dashboard for the live demo. Renders a form per entity from
 * its fields and lists/persists the user's records via /api/demo/records.
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
  const [active, setActive] = useState(0)
  const [records, setRecords] = useState<Rec[]>([])
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const entity = entities[active]

  async function load() {
    if (!entity) return
    const r = await fetch(`/api/demo/records?slug=${encodeURIComponent(slug)}&entity=${encodeURIComponent(entity.name)}`)
    if (r.ok) setRecords((await r.json()).records || [])
  }
  useEffect(() => { setForm({}); setErr(""); load() /* eslint-disable-next-line */ }, [active])

  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true)
    try {
      const r = await fetch("/api/demo/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, entity: entity.name, data: form }) })
      if (!r.ok) { setErr("Couldn't save"); return }
      setForm({}); await load()
    } finally { setBusy(false) }
  }
  async function del(id: number) {
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
    const base = "w-full border border-black/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-current text-ink"
    if (f.type === "longtext" || f.type === "json") return <textarea className={base} rows={3} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required} />
    if (f.type === "bool") return <input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked)} className="w-5 h-5" />
    if (f.type === "enum") return <select className={base} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required}><option value="">—</option>{(f.enumValues || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>
    const t = f.type === "int" || f.type === "float" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : f.type === "email" ? "email" : f.type === "url" ? "url" : "text"
    return <input type={t} className={base} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required} />
  }

  return (
    <div className="min-h-screen bg-paper text-ink" style={{ ["--brand" as string]: brand }}>
      <header className="border-b border-black/5 bg-white">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href={`/x/${slug}`} className="flex items-center gap-2" style={{ color: brand }}><Mark size={26} /><span className="font-extrabold text-ink">{productName}</span></Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink/60">Hi, <b className="text-ink">{userName}</b></span>
            <button onClick={logout} className="text-white text-xs font-semibold rounded-lg px-3 py-2" style={{ background: brand }}>Log out</button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {entities.map((e, i) => (
            <button key={e.name} onClick={() => setActive(i)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${i === active ? "text-white" : "text-ink/70 border border-black/10"}`} style={i === active ? { background: brand } : undefined}>{e.plural}</button>
          ))}
        </div>

        {!entity ? (
          <p className="text-ink/60">No entities defined for this product.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={add} className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm h-fit">
              <h2 className="font-bold mb-4">New {entity.name}</h2>
              <div className="space-y-3">
                {entity.fields.map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-semibold text-ink/70 mb-1">{label(f.name)}{f.required && " *"}</label>
                    {input(f)}
                  </div>
                ))}
              </div>
              {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
              <button disabled={busy} className="mt-4 w-full py-2.5 rounded-lg text-white font-semibold disabled:opacity-60" style={{ background: brand }}>{busy ? "…" : `Add ${entity.name}`}</button>
            </form>

            <div>
              <h2 className="font-bold mb-4">Your {entity.plural} <span className="text-ink/40 font-normal">({records.length})</span></h2>
              {records.length === 0 ? (
                <p className="text-ink/50 text-sm bg-white border border-black/5 rounded-2xl p-5">Nothing yet — add your first {entity.name.toLowerCase()}.</p>
              ) : (
                <div className="space-y-2">
                  {records.map((r) => (
                    <div key={r.id} className="bg-white border border-black/5 rounded-xl p-4 text-sm flex justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        {entity.fields.map((f) => r.data[f.name] != null && String(r.data[f.name]) !== "" && (
                          <div key={f.name} className="truncate"><span className="text-ink/45">{label(f.name)}:</span> <span className="text-ink/85">{String(r.data[f.name])}</span></div>
                        ))}
                      </div>
                      <button onClick={() => del(r.id)} className="text-ink/30 hover:text-red-500 shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
