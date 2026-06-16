"use client"
/**
 * SplitSnap — the calculator.
 * No login. Snap a receipt (OCR via /api/ocr) or add items by hand, add the
 * people at the table, tap who shares each item, set tax/tip, and see each
 * person's exact share recomputed live via lib/split.computeSplit.
 */
import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import config from "@/domain.config"
import { Mark } from "@/components/Mark"
import { computeSplit, type SplitItem } from "@/lib/split"
import { PersonChip } from "@/components/split/PersonChip"

let _seq = 0
const newId = () => `it_${Date.now().toString(36)}_${(_seq++).toString(36)}`

const fmt = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" })

type OcrItem = { name?: string; price?: number }
type OcrResponse = { items?: OcrItem[]; tax?: number; total?: number }

export default function SplitPage() {
  const { identity } = config

  const [items, setItems] = useState<SplitItem[]>([])
  const [people, setPeople] = useState<string[]>([])
  const [newPerson, setNewPerson] = useState("")
  const [taxPct, setTaxPct] = useState<number>(0)
  const [tipPct, setTipPct] = useState<number>(0)

  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ---- Receipt scanning ----
  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-picking the same file
    if (!file) return

    setScanError(null)
    setScanning(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = () => reject(new Error("Could not read the image"))
        r.readAsDataURL(file)
      })

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      })
      if (!res.ok) throw new Error(`Scan failed (${res.status})`)
      const data: OcrResponse = await res.json()

      const scanned: SplitItem[] = (data.items ?? [])
        .filter((i) => i && (i.name || typeof i.price === "number"))
        .map((i) => ({
          id: newId(),
          name: i.name?.trim() || "Item",
          price: Number.isFinite(i.price) ? Number(i.price) : 0,
          sharedBy: [],
        }))

      if (scanned.length === 0) {
        setScanError("No items found on the receipt — add them manually below.")
      } else {
        setItems(scanned)
      }
      if (typeof data.tax === "number" && data.tax > 0 && typeof data.total === "number" && data.total > 0) {
        // Derive a tax % from absolute tax/total when both are present.
        const subtotal = data.total - data.tax
        if (subtotal > 0) setTaxPct(Math.round((data.tax / subtotal) * 1000) / 10)
      }
    } catch (err) {
      setScanError(
        (err instanceof Error ? err.message : "Scan failed") +
          " — you can still add items manually below."
      )
    } finally {
      setScanning(false)
    }
  }

  // ---- Items ----
  const addItem = () =>
    setItems((prev) => [...prev, { id: newId(), name: "", price: 0, sharedBy: [] }])
  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id))
  const setItemName = (id: string, name: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name } : i)))
  const setItemPrice = (id: string, price: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, price } : i)))
  const toggleSharer = (id: string, name: string) =>
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const has = i.sharedBy.includes(name)
        return {
          ...i,
          sharedBy: has ? i.sharedBy.filter((n) => n !== name) : [...i.sharedBy, name],
        }
      })
    )

  // ---- People ----
  const addPerson = () => {
    const name = newPerson.trim()
    if (!name || people.includes(name)) {
      setNewPerson("")
      return
    }
    setPeople((prev) => [...prev, name])
    setNewPerson("")
  }
  const removePerson = (name: string) => {
    setPeople((prev) => prev.filter((n) => n !== name))
    // also drop them from any item assignments
    setItems((prev) =>
      prev.map((i) => ({ ...i, sharedBy: i.sharedBy.filter((n) => n !== name) }))
    )
  }

  const startOver = () => {
    setItems([])
    setPeople([])
    setNewPerson("")
    setTaxPct(0)
    setTipPct(0)
    setScanError(null)
  }

  // ---- Live result ----
  const { shares, grandTotal } = useMemo(
    () => computeSplit({ items, people, taxPct, tipPct }),
    [items, people, taxPct, tipPct]
  )

  const inputClass =
    "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-paper/85 border-b border-black/5">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-brand">
            <Mark size={26} />
            <span className="font-extrabold text-ink text-lg tracking-tight">{identity.name}</span>
          </Link>
          <button
            type="button"
            onClick={startOver}
            className="text-sm font-semibold text-ink/60 hover:text-ink"
          >
            Start over
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pb-32 pt-5 space-y-7">
        {/* Scan */}
        <section>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPickFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="w-full rounded-2xl py-4 text-lg font-bold text-white shadow-sm disabled:opacity-70"
            style={{ background: "var(--brand)" }}
          >
            {scanning ? "Reading receipt…" : "📷 Scan receipt"}
          </button>
          {scanError && (
            <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {scanError}
            </p>
          )}
        </section>

        {/* People */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">People</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addPerson()
                }
              }}
              placeholder="Add a name"
              className={inputClass}
              aria-label="Person name"
            />
            <button
              type="button"
              onClick={addPerson}
              className="shrink-0 rounded-xl px-4 font-bold text-white"
              style={{ background: "var(--brand)" }}
            >
              Add
            </button>
          </div>
          {people.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {people.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-black/10 pl-3 pr-2 py-1.5 text-sm font-semibold"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => removePerson(name)}
                    aria-label={`Remove ${name}`}
                    className="grid place-items-center w-5 h-5 rounded-full bg-black/5 text-ink/60 hover:bg-black/10"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Items */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm font-bold text-brand"
            >
              + Add item
            </button>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-ink/50">
              Scan a receipt or add items manually.
            </p>
          )}

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/10 bg-white p-3 space-y-3">
                <div className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => setItemName(item.id, e.target.value)}
                    placeholder="Item name"
                    className={inputClass}
                    aria-label="Item name"
                  />
                  <div className="relative shrink-0 w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={item.price === 0 || !Number.isFinite(item.price) ? "" : item.price}
                      onChange={(e) =>
                        setItemPrice(item.id, e.target.value === "" ? 0 : parseFloat(e.target.value))
                      }
                      placeholder="0.00"
                      className={`${inputClass} pl-7`}
                      aria-label="Item price"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove item"
                    className="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-black/5 text-ink/50 hover:bg-black/10"
                  >
                    🗑
                  </button>
                </div>

                {/* Assignment */}
                {people.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {people.map((name) => (
                      <PersonChip
                        key={name}
                        name={name}
                        active={item.sharedBy.includes(name)}
                        onToggle={() => toggleSharer(item.id, name)}
                      />
                    ))}
                    <span className="self-center text-xs text-ink/40">
                      {item.sharedBy.length === 0 ? "split among everyone" : ""}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Tax & Tip */}
        <section className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-bold uppercase tracking-wide text-ink/50">Tax %</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={taxPct === 0 ? "" : taxPct}
              onChange={(e) => setTaxPct(e.target.value === "" ? 0 : parseFloat(e.target.value))}
              placeholder="0"
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold uppercase tracking-wide text-ink/50">Tip %</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="1"
              value={tipPct === 0 ? "" : tipPct}
              onChange={(e) => setTipPct(e.target.value === "" ? 0 : parseFloat(e.target.value))}
              placeholder="0"
              className={`${inputClass} mt-1`}
            />
          </label>
        </section>

        {/* Result */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">Each person owes</h2>
          {shares.length === 0 ? (
            <p className="text-sm text-ink/50">Add at least one person to see the split.</p>
          ) : (
            <div className="rounded-2xl border border-black/10 bg-white divide-y divide-black/5 overflow-hidden">
              {shares.map((s) => (
                <div key={s.name} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-bold text-ink">{s.name}</div>
                    <div className="text-xs text-ink/45">
                      {fmt(s.subtotal)} + {fmt(s.tax)} tax + {fmt(s.tip)} tip
                    </div>
                  </div>
                  <div className="text-lg font-extrabold" style={{ color: "var(--brand)" }}>
                    {fmt(s.total)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Sticky grand total */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-black/10 bg-paper/95 backdrop-blur">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wide text-ink/50">Grand total</span>
          <span className="text-2xl font-extrabold text-ink">{fmt(grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}
