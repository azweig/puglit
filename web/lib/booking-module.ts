/**
 * booking-module.ts — scheduling & appointments (Cal.com-style primitive), Postgres-native.
 * Define availability windows, list free slots, book (with double-booking prevention via a unique
 * constraint). For services, consultations, demos, reservations, rentals.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const BOOK = `import { pool } from "@/lib/db"
/** Free slots for a host on a date, given a slot length (minutes), from availability windows. */
export async function freeSlots(hostId: string, date: string, slotMin = 30): Promise<string[]> {
  const { rows } = await pool().query("SELECT start_min, end_min FROM availability WHERE host_id=$1 AND weekday=EXTRACT(DOW FROM $2::date)", [hostId, date])
  const taken = (await pool().query("SELECT to_char(starts_at,'HH24:MI') AS t FROM bookings WHERE host_id=$1 AND starts_at::date=$2 AND status<>'canceled'", [hostId, date])).rows.map((r: any) => r.t)
  const slots: string[] = []
  for (const w of rows) for (let m = w.start_min; m + slotMin <= w.end_min; m += slotMin) {
    const t = String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0")
    if (!taken.includes(t)) slots.push(t)
  }
  return slots
}
/** Book a slot. Throws on double-booking (unique index). */
export async function book(hostId: string, guestId: string, startsAt: string, durationMin = 30, title = "") {
  const { rows } = await pool().query("INSERT INTO bookings (host_id, guest_id, starts_at, duration_min, title) VALUES ($1,$2,$3,$4,$5) RETURNING id", [hostId, guestId, startsAt, durationMin, title])
  return rows[0].id
}
export async function cancel(id: number) { await pool().query("UPDATE bookings SET status='canceled' WHERE id=$1", [id]) }
`
const SQL = `CREATE TABLE IF NOT EXISTS availability (
  id BIGSERIAL PRIMARY KEY, host_id TEXT NOT NULL,
  weekday INT NOT NULL, start_min INT NOT NULL, end_min INT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY, host_id TEXT NOT NULL, guest_id TEXT,
  starts_at TIMESTAMPTZ NOT NULL, duration_min INT NOT NULL DEFAULT 30,
  title TEXT, status VARCHAR(12) DEFAULT 'confirmed', created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (host_id, starts_at)
);`

export function deterministicBooking(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /book|booking|reserv|cita|appointment|schedul|agenda|turno|slot|calendar|consult|demo|rental|alquiler|disponibilidad|availability/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/booking.ts", content: BOOK }], extraSql: SQL }
}
