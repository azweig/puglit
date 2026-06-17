"use client"
/**
 * Puglit Spine — EntityManager: generic CRUD UI for one entity, driven by its
 * fields. Used by every /app/[entity] page. Talks to /api/records/[entity].
 */
import { useEffect, useState } from "react"
import type { Field } from "@/domain-types"

const label = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
type Rec = { id: number; data: Record<string, unknown>; created_at: string }

export function EntityManager({ name, plural, fields }: { name: string; plural: string; fields: Field[] }) {
  const [records, setRecords] = useState<Rec[]>([])
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")

  async function load() {
    const r = await fetch(`/api/records/${encodeURIComponent(name)}`)
    if (r.ok) setRecords((await r.json()).records || [])
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [name])

  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true)
    try {
      const r = await fetch(`/api/records/${encodeURIComponent(name)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: form }) })
      if (!r.ok) { setErr("Couldn't save"); return }
      setForm({}); await load()
    } finally { setBusy(false) }
  }
  async function del(id: number) {
    await fetch(`/api/records/${encodeURIComponent(name)}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    await load()
  }

  function input(f: Field) {
    const v = form[f.name] ?? ""
    const set = (val: unknown) => setForm({ ...form, [f.name]: val })
    const base = "w-full border border-black/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand text-ink"
    if (f.type === "longtext" || f.type === "json") return <textarea className={base} rows={3} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required} />
    if (f.type === "bool") return <input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked)} className="w-5 h-5 accent-current text-brand" />
    if (f.type === "enum") return <select className={base} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required}><option value="">—</option>{(f.enumValues || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>
    const t = f.type === "int" || f.type === "float" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : f.type === "email" ? "email" : f.type === "url" ? "url" : "text"
    return <input type={t} className={base} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required} />
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={add} className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm h-fit">
        <h2 className="font-bold mb-4">New {name}</h2>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-xs font-semibold text-ink/70 mb-1">{label(f.name)}{f.required && " *"}</label>
              {input(f)}
            </div>
          ))}
        </div>
        {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
        <button disabled={busy} className="mt-4 w-full py-2.5 rounded-lg text-white font-semibold disabled:opacity-60" style={{ background: "var(--brand)" }}>{busy ? "…" : `Add ${name}`}</button>
      </form>

      <div>
        <h2 className="font-bold mb-4">Your {plural} <span className="text-ink/40 font-normal">({records.length})</span></h2>
        {records.length === 0 ? (
          <p className="text-ink/50 text-sm bg-white border border-black/5 rounded-2xl p-5">Nothing yet — add your first {name.toLowerCase()}.</p>
        ) : (
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className="bg-white border border-black/5 rounded-xl p-4 text-sm flex justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  {fields.map((f) => r.data[f.name] != null && String(r.data[f.name]) !== "" && (
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
  )
}
