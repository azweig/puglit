"use client"
/**
 * I'm Still Alive — control panel. Check-in button + status, your check-in
 * settings (channel/contact/frequency/time/silence), recipients (name/channel/
 * contact/message), and a "send a test now" button. All persisted via the API.
 */
import { useEffect, useState } from "react"

type Channel = "email" | "sms" | "whatsapp"
type Settings = { checkin_channel: Channel; checkin_contact: string; frequency_days: number; checkin_time: string; silence_days: number; last_check_in?: string }
type Recipient = { id: number; data: { name: string; channel: Channel; contact: string; message: string } }
type TestResult = { name: string; channel: Channel; contact: string; sent: boolean; reason?: string }

const CHANNELS: Channel[] = ["email", "sms", "whatsapp"]
const field = "w-full border border-black/15 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand"
const lbl = "block text-xs font-semibold text-ink/70 mb-1"
const card = "bg-white border border-black/5 rounded-2xl p-5 shadow-sm"

function ChannelPicker({ value, onChange }: { value: Channel; onChange: (c: Channel) => void }) {
  return (
    <div className="flex gap-2">
      {CHANNELS.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)} className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize ${value === c ? "text-white" : "text-ink/60 border border-black/10"}`} style={value === c ? { background: "var(--brand)" } : undefined}>{c === "whatsapp" ? "WhatsApp" : c.toUpperCase()}</button>
      ))}
    </div>
  )
}

export default function Panel() {
  const [status, setStatus] = useState<{ lastCheckIn: string | null; daysSinceCheckIn: number | null; silenceDays: number } | null>(null)
  const [settings, setSettings] = useState<Settings>({ checkin_channel: "email", checkin_contact: "", frequency_days: 7, checkin_time: "09:00", silence_days: 30 })
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [form, setForm] = useState({ name: "", channel: "email" as Channel, contact: "", message: "" })
  const [test, setTest] = useState<TestResult[] | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState("")

  async function loadStatus() {
    const d = await (await fetch("/api/checkin")).json()
    setStatus({ lastCheckIn: d.lastCheckIn, daysSinceCheckIn: d.daysSinceCheckIn, silenceDays: d.silenceDays })
    if (d.settings) setSettings((s) => ({ ...s, ...d.settings }))
  }
  async function loadRecipients() {
    const d = await (await fetch("/api/records/Recipient")).json()
    setRecipients(d.records || [])
  }
  useEffect(() => { loadStatus(); loadRecipients() }, [])

  async function checkin() {
    setBusy("checkin"); await fetch("/api/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "checkin" }) })
    await loadStatus(); setBusy("")
  }
  async function saveSettings(e: React.FormEvent) {
    e.preventDefault(); setBusy("settings")
    await fetch("/api/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings }) })
    await loadStatus(); setSaved(true); setTimeout(() => setSaved(false), 1500); setBusy("")
  }
  async function addRecipient(e: React.FormEvent) {
    e.preventDefault(); if (!form.name || !form.contact || !form.message) return; setBusy("recip")
    await fetch("/api/records/Recipient", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: form }) })
    setForm({ name: "", channel: "email", contact: "", message: "" }); await loadRecipients(); setBusy("")
  }
  async function delRecipient(id: number) {
    await fetch("/api/records/Recipient", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    await loadRecipients()
  }
  async function sendTest() {
    setBusy("test"); const d = await (await fetch("/api/deliver-test", { method: "POST" })).json(); setTest(d.results || []); setBusy("")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Your dead man’s switch</h1>

      {/* check-in */}
      <div className={card}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-ink/60">{status?.lastCheckIn ? `Last check-in ${status.daysSinceCheckIn} day(s) ago` : "You haven't checked in yet"}</p>
            <p className="text-xs text-ink/45 mt-0.5">Messages deliver after <b>{status?.silenceDays ?? settings.silence_days}</b> days of silence.</p>
          </div>
          <button onClick={checkin} disabled={busy === "checkin"} className="px-6 py-3 rounded-xl text-white font-bold disabled:opacity-60" style={{ background: "var(--brand)" }}>{busy === "checkin" ? "…" : "I’m still alive ✓"}</button>
        </div>
      </div>

      {/* settings */}
      <form onSubmit={saveSettings} className={card}>
        <h2 className="font-bold mb-4">How &amp; when we check on you</h2>
        <div className="space-y-3">
          <div><label className={lbl}>How should we ping you?</label><ChannelPicker value={settings.checkin_channel} onChange={(c) => setSettings({ ...settings, checkin_channel: c })} /></div>
          <div><label className={lbl}>Your {settings.checkin_channel === "email" ? "email" : "phone number"}</label><input className={field} value={settings.checkin_contact} onChange={(e) => setSettings({ ...settings, checkin_contact: e.target.value })} placeholder={settings.checkin_channel === "email" ? "you@email.com" : "+15551234567"} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>Every (days)</label><input type="number" min={1} className={field} value={settings.frequency_days} onChange={(e) => setSettings({ ...settings, frequency_days: Number(e.target.value) })} /></div>
            <div><label className={lbl}>At time</label><input type="time" className={field} value={settings.checkin_time} onChange={(e) => setSettings({ ...settings, checkin_time: e.target.value })} /></div>
            <div><label className={lbl}>Deliver after (days silent)</label><input type="number" min={1} className={field} value={settings.silence_days} onChange={(e) => setSettings({ ...settings, silence_days: Number(e.target.value) })} /></div>
          </div>
        </div>
        <button disabled={busy === "settings"} className="mt-4 px-5 py-2.5 rounded-lg text-white font-semibold disabled:opacity-60" style={{ background: "var(--brand)" }}>{saved ? "Saved ✓" : "Save settings"}</button>
      </form>

      {/* recipients */}
      <div className={card}>
        <h2 className="font-bold mb-4">Who gets a message &amp; what it says</h2>
        <form onSubmit={addRecipient} className="grid sm:grid-cols-2 gap-3">
          <div><label className={lbl}>Name</label><input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className={lbl}>Channel</label><ChannelPicker value={form.channel} onChange={(c) => setForm({ ...form, channel: c })} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Their {form.channel === "email" ? "email" : "phone (+country)"}</label><input className={field} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder={form.channel === "email" ? "them@email.com" : "+15551234567"} /></div>
          <div className="sm:col-span-2"><label className={lbl}>Message for them</label><textarea rows={3} className={field} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="What you want them to read…" /></div>
          <button disabled={busy === "recip"} className="sm:col-span-2 py-2.5 rounded-lg text-white font-semibold disabled:opacity-60" style={{ background: "var(--brand)" }}>Add recipient</button>
        </form>

        {recipients.length > 0 && (
          <div className="mt-5 space-y-2">
            {recipients.map((r) => (
              <div key={r.id} className="flex justify-between gap-3 border border-black/5 rounded-xl p-3 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold">{r.data.name} <span className="text-ink/40 font-normal">· {r.data.channel} · {r.data.contact}</span></div>
                  <div className="text-ink/65 truncate">{r.data.message}</div>
                </div>
                <button onClick={() => delRecipient(r.id)} className="text-ink/30 hover:text-red-500 shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* test */}
      <div className={card}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-ink/60">Send everyone their message right now, to test delivery.</p>
          <button onClick={sendTest} disabled={busy === "test" || recipients.length === 0} className="px-5 py-2.5 rounded-lg font-semibold border border-black/15 disabled:opacity-50" style={{ color: "var(--brand)" }}>{busy === "test" ? "Sending…" : "Send a test now"}</button>
        </div>
        {test && (
          <div className="mt-4 space-y-1.5 text-sm">
            {test.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <span>{t.sent ? "✅" : "⚠️"}</span>
                <span className="font-semibold">{t.name}</span>
                <span className="text-ink/50">{t.channel} · {t.contact}</span>
                {!t.sent && <span className="text-amber-600 text-xs">({t.reason === "not_configured" ? `${t.channel} needs setup` : t.reason})</span>}
              </div>
            ))}
            {test.length === 0 && <p className="text-ink/50">Add a recipient first.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
