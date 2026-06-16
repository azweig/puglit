/**
 * I'm Still Alive — deadman.ts
 * The dead man's switch. Settings + recipients live in the generic `records`
 * table (entities "_settings" and "Recipient"). If the user goes silent past
 * silence_days, each recipient's message is delivered on their channel.
 */
import { pool } from "@/lib/db"
import { listRecords } from "@/lib/records"
import { notify, type Channel } from "@/lib/notify"

export interface Settings {
  checkin_channel: Channel
  checkin_contact: string
  frequency_days: number
  checkin_time: string
  silence_days: number
  last_check_in: string
  delivered: boolean
}
const DEFAULTS: Settings = { checkin_channel: "email", checkin_contact: "", frequency_days: 7, checkin_time: "09:00", silence_days: 30, last_check_in: new Date().toISOString(), delivered: false }

async function settingsRow(userId: number): Promise<{ id: number; data: Settings } | null> {
  const rows = await listRecords(userId, "_settings")
  return rows[0] ? { id: rows[0].id, data: rows[0].data as Settings } : null
}

export async function getSettings(userId: number): Promise<Settings | null> {
  const r = await settingsRow(userId)
  return r ? r.data : null
}

export async function saveSettings(userId: number, partial: Partial<Settings>): Promise<Settings> {
  const existing = await settingsRow(userId)
  if (!existing) {
    const data: Settings = { ...DEFAULTS, ...partial, last_check_in: new Date().toISOString(), delivered: false }
    await pool.query(`INSERT INTO records (user_id, entity, data) VALUES ($1,'_settings',$2)`, [userId, JSON.stringify(data)])
    return data
  }
  const data: Settings = { ...DEFAULTS, ...existing.data, ...partial }
  await pool.query(`UPDATE records SET data=$1 WHERE id=$2 AND user_id=$3`, [JSON.stringify(data), existing.id, userId])
  return data
}

export async function checkIn(userId: number): Promise<Settings> {
  return saveSettings(userId, { last_check_in: new Date().toISOString(), delivered: false })
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export async function getStatus(userId: number) {
  const settings = await getSettings(userId)
  return {
    settings,
    lastCheckIn: settings?.last_check_in ?? null,
    daysSinceCheckIn: settings ? daysSince(settings.last_check_in) : null,
    silenceDays: settings?.silence_days ?? DEFAULTS.silence_days,
  }
}

export interface DeliveryResult { name: string; channel: Channel; contact: string; sent: boolean; reason?: string }

export async function deliverFor(userId: number): Promise<DeliveryResult[]> {
  const recipients = await listRecords(userId, "Recipient")
  const results: DeliveryResult[] = []
  for (const r of recipients) {
    const d = r.data as { name: string; channel: Channel; contact: string; message: string }
    const res = await notify(d.channel, d.contact, `A message from a loved one`, d.message)
    results.push({ name: d.name, channel: d.channel, contact: d.contact, sent: res.sent, reason: res.reason })
  }
  await saveSettings(userId, { delivered: true })
  return results
}

export async function runDeliveries(): Promise<number> {
  const { rows } = await pool.query(`SELECT DISTINCT user_id FROM records WHERE entity='_settings'`)
  let count = 0
  for (const { user_id } of rows) {
    const s = await getSettings(user_id)
    if (!s || s.delivered) continue
    if (daysSince(s.last_check_in) > s.silence_days) {
      const res = await deliverFor(user_id)
      count += res.filter((r) => r.sent).length
    }
  }
  return count
}
