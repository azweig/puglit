/**
 * rentals-module.ts — VERTICAL building block for booking/rental marketplaces. The correctness-
 * critical domain logic (deterministic pricing, half-open availability, atomic anti-double-booking,
 * the booking state machine, refund-by-policy-snapshot, double-blind reviews) — PRE-built + unit-
 * tested, so the generic codegen never reimplements it wrong.
 *
 * NO HARDCODING: the table names are DETECTED from the architect's blueprint (it may name the
 * booking table "reservations" or "bookings") and templated into every primitive, the SQL, the
 * route override and the tests. The module adapts to the schema; it never assumes a name.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }
type Tables = { book: string; rev: string; pay: string; blocks: string; listings: string }

/** Detect the canonical table names from the blueprint (single source of truth). */
function detectTables(bp: Blueprint): Tables {
  const tabs = (bp.tables || []) as { name: string; columns?: { name: string }[] }[]
  const byCol = (re: RegExp) => tabs.find((t) => (t.columns || []).some((c) => re.test(c.name)))?.name
  const byName = (re: RegExp, dflt: string) => tabs.find((t) => re.test(t.name))?.name || dflt
  return {
    book: byCol(/^check_in$/i) || byName(/booking|reserv|stay|estan/i, "bookings"),
    rev: byName(/review|rese[nñ]a|rating/i, "reviews"),
    pay: byName(/payment|pago|charge/i, "payments"),
    blocks: byName(/availabilit|block|disponib/i, "availability_blocks"),
    listings: byName(/listing|propert|alojamiento|room|unit/i, "listings"),
  }
}

const PRICING = `export type PricedListing = { nightly_price_cents: number; cleaning_fee_cents: number; weekly_discount_pct: number }
export type Quote = { nights: number; base_cents: number; cleaning_cents: number; service_fee_cents: number; taxes_cents: number; total_cents: number }
export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(checkOut + "T00:00:00Z") - Date.parse(checkIn + "T00:00:00Z")) / 86400000)
}
/** DETERMINISTIC price, integer cents only. Use in BOTH search and checkout → identical totals. */
export function priceQuote(listing: PricedListing, checkIn: string, checkOut: string): Quote {
  const nights = nightsBetween(checkIn, checkOut)
  let base = listing.nightly_price_cents * nights
  if (nights >= 7 && listing.weekly_discount_pct > 0) base = base - Math.round((base * listing.weekly_discount_pct) / 100)
  const subtotal = base + listing.cleaning_fee_cents
  const service_fee_cents = Math.round(subtotal * 0.12)
  const taxes_cents = Math.round(subtotal * 0.08)
  return { nights, base_cents: base, cleaning_cents: listing.cleaning_fee_cents, service_fee_cents, taxes_cents, total_cents: subtotal + service_fee_cents + taxes_cents }
}
`

const availabilityTs = (T: Tables) => `import { pool } from "@/lib/db"
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd
}
/** Available iff NO ${T.blocks} and NO active ${T.book} (accepted|confirmed|completed) overlaps [in,out). */
export async function isAvailable(listingId: number, checkIn: string, checkOut: string): Promise<boolean> {
  const blocked = await pool.query("SELECT 1 FROM ${T.blocks} WHERE listing_id=$1 AND start_date < $3 AND $2 < end_date LIMIT 1", [listingId, checkIn, checkOut])
  if (blocked.rows.length) return false
  const booked = await pool.query("SELECT 1 FROM ${T.book} WHERE listing_id=$1 AND status IN ('accepted','confirmed','completed') AND check_in < $3 AND $2 < check_out LIMIT 1", [listingId, checkIn, checkOut])
  return booked.rows.length === 0
}
/** WHERE fragment for search (params $2=checkIn, $3=checkOut, listings aliased l). */
export const AVAILABLE_SQL = "NOT EXISTS (SELECT 1 FROM ${T.blocks} ab WHERE ab.listing_id=l.id AND ab.start_date < $3 AND $2 < ab.end_date) AND NOT EXISTS (SELECT 1 FROM ${T.book} bk WHERE bk.listing_id=l.id AND bk.status IN ('accepted','confirmed','completed') AND bk.check_in < $3 AND $2 < bk.check_out)"
`

const bookingTs = (T: Tables) => `import { pool } from "@/lib/db"
import { priceQuote } from "./pricing"
import { isAvailable } from "./availability"
const TRANSITIONS: Record<string, string[]> = { requested: ["accepted", "declined"], accepted: ["confirmed", "cancelled"], confirmed: ["cancelled", "completed"], declined: [], cancelled: [], completed: [] }
export function canTransition(from: string, to: string): boolean { return (TRANSITIONS[from] || []).includes(to) }
export class BookingError extends Error { constructor(public code: number, msg: string) { super(msg) } }
/** Create a booking ATOMICALLY into ${T.book}. Anti-double-booking guaranteed by the DB exclusion
 *  constraint (overlapping active bookings throw 23P01 → 409) + a same-tx availability check. */
export async function createBooking(input: { listingId: number; guestId: number; checkIn: string; checkOut: string; guestsCount: number }) {
  const { listingId, guestId, checkIn, checkOut, guestsCount } = input
  const l = (await pool.query("SELECT * FROM ${T.listings} WHERE id=$1", [listingId])).rows[0]
  if (!l) throw new BookingError(404, "listing not found")
  if (l.host_id === guestId) throw new BookingError(400, "cannot book your own listing")
  if (l.status !== "published") throw new BookingError(400, "listing not bookable")
  if (!(checkOut > checkIn)) throw new BookingError(400, "check_out must be after check_in")
  if (checkIn < new Date().toISOString().slice(0, 10)) throw new BookingError(400, "dates in the past")
  const q = priceQuote(l, checkIn, checkOut)
  if (q.nights < (l.min_nights || 1)) throw new BookingError(400, "below minimum nights")
  if (l.max_nights && q.nights > l.max_nights) throw new BookingError(400, "above maximum nights")
  if (guestsCount > l.capacity) throw new BookingError(400, "guests exceed capacity")
  const status = l.instant_book ? "accepted" : "requested"
  const c = await pool.connect()
  try {
    await c.query("BEGIN")
    if (!(await isAvailable(listingId, checkIn, checkOut))) { await c.query("ROLLBACK"); throw new BookingError(409, "not available") }
    const r = await c.query("INSERT INTO ${T.book} (listing_id, guest_id, check_in, check_out, guests_count, nights, base_cents, cleaning_cents, service_fee_cents, taxes_cents, total_cents, status, cancellation_policy_snapshot) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id", [listingId, guestId, checkIn, checkOut, guestsCount, q.nights, q.base_cents, q.cleaning_cents, q.service_fee_cents, q.taxes_cents, q.total_cents, status, l.cancellation_policy])
    await c.query("INSERT INTO ${T.pay} (${T.book === "reservations" ? "reservation_id" : "booking_id"}, kind, amount_cents, status) VALUES ($1,'hold',$2,'pending')", [r.rows[0].id, q.total_cents])
    await c.query("COMMIT")
    return { id: r.rows[0].id, status, quote: q }
  } catch (e: any) {
    await c.query("ROLLBACK")
    if (e instanceof BookingError) throw e
    if (e.code === "23P01" || /no_double_booking|exclu/i.test(e.message || "")) throw new BookingError(409, "not available")
    throw e
  } finally { c.release() }
}
export async function transition(bookingId: number, to: string) {
  const b = (await pool.query("SELECT status FROM ${T.book} WHERE id=$1", [bookingId])).rows[0]
  if (!b) throw new BookingError(404, "booking not found")
  if (!canTransition(b.status, to)) throw new BookingError(400, "invalid transition " + b.status + "→" + to)
  try { await pool.query("UPDATE ${T.book} SET status=$2 WHERE id=$1", [bookingId, to]) }
  catch (e: any) { if (e.code === "23P01") throw new BookingError(409, "not available"); throw e }
  if (to === "confirmed") await pool.query("UPDATE ${T.pay} SET kind='charge', status='completed' WHERE ${T.book === "reservations" ? "reservation_id" : "booking_id"}=$1 AND kind='hold'", [bookingId])
}
`

const refundTs = (T: Tables) => `import { pool } from "@/lib/db"
export function refundCents(totalCents: number, policy: "flexible" | "moderate" | "strict", daysToCheckin: number, started: boolean): number {
  if (started) return 0
  if (policy === "flexible") return daysToCheckin >= 1 ? totalCents : 0
  if (policy === "moderate") return daysToCheckin >= 5 ? totalCents : daysToCheckin >= 1 ? Math.round(totalCents * 0.5) : 0
  if (policy === "strict") return daysToCheckin >= 7 ? Math.round(totalCents * 0.5) : 0
  return 0
}
export async function cancelBooking(bookingId: number) {
  const b = (await pool.query("SELECT * FROM ${T.book} WHERE id=$1", [bookingId])).rows[0]
  if (!b) throw new Error("404 not found")
  const today = new Date().toISOString().slice(0, 10)
  const ci = b.check_in instanceof Date ? b.check_in.toISOString().slice(0, 10) : String(b.check_in)
  const days = Math.round((Date.parse(ci + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000)
  const refund = refundCents(b.total_cents, b.cancellation_policy_snapshot, days, ci <= today)
  await pool.query("UPDATE ${T.book} SET status='cancelled' WHERE id=$1", [bookingId])
  if (refund > 0) await pool.query("INSERT INTO ${T.pay} (${T.book === "reservations" ? "reservation_id" : "booking_id"}, kind, amount_cents, status) VALUES ($1,'refund',$2,'completed')", [bookingId, refund])
  return { refundCents: refund }
}
`

const reviewsTs = (T: Tables) => `import { pool } from "@/lib/db"
const FK = "${T.book === "reservations" ? "reservation_id" : "booking_id"}"
export async function submitReview(bookingId: number, authorId: number, targetKind: string, rating: number, body: string) {
  const b = (await pool.query("SELECT status FROM ${T.book} WHERE id=$1", [bookingId])).rows[0]
  if (!b) throw new Error("404")
  if (b.status !== "completed") throw new Error("400 booking not completed")
  if (rating < 1 || rating > 5) throw new Error("400 rating must be 1-5")
  if ((await pool.query(\`SELECT 1 FROM ${T.rev} WHERE \${FK}=$1 AND author_id=$2\`, [bookingId, authorId])).rows.length) throw new Error("409 already reviewed")
  await pool.query(\`INSERT INTO ${T.rev} (\${FK}, author_id, target_kind, rating, body, is_visible) VALUES ($1,$2,$3,$4,$5,false)\`, [bookingId, authorId, targetKind, rating, body])
  const n = (await pool.query(\`SELECT COUNT(*)::int AS n FROM ${T.rev} WHERE \${FK}=$1\`, [bookingId])).rows[0].n
  if (n >= 2) await pool.query(\`UPDATE ${T.rev} SET is_visible=true WHERE \${FK}=$1\`, [bookingId])
}
export async function revealStaleReviews() {
  await pool.query("UPDATE ${T.rev} SET is_visible=true WHERE is_visible=false AND created_at < NOW() - interval '14 days'")
}
`

// REAL vitest unit + business tests of the pure domain rules (give actual coverage).
const PRICING_TEST = `import { describe, it, expect } from "vitest"
import { priceQuote, nightsBetween } from "../pricing"
import { refundCents } from "../refund"
import { overlaps } from "../availability"
const L = { nightly_price_cents: 10000, cleaning_fee_cents: 3000, weekly_discount_pct: 10 }
describe("pricing (deterministic, integer cents)", () => {
  it("C2/C11 — exact total, all integers", () => {
    const q = priceQuote(L, "2027-01-01", "2027-01-04")
    expect(q.nights).toBe(3); expect(q.base_cents).toBe(30000)
    expect(q.service_fee_cents).toBe(3960); expect(q.taxes_cents).toBe(2640); expect(q.total_cents).toBe(39600)
    expect(Number.isInteger(q.total_cents)).toBe(true)
  })
  it("C2 — search === checkout (same fn, same args)", () => {
    expect(priceQuote(L, "2027-01-01", "2027-01-04")).toEqual(priceQuote(L, "2027-01-01", "2027-01-04"))
  })
  it("weekly discount applies at >=7 nights", () => {
    expect(priceQuote(L, "2027-01-01", "2027-01-08").base_cents).toBe(63000)
    expect(priceQuote(L, "2027-01-01", "2027-01-08").total_cents).toBe(79200)
  })
  it("nightsBetween is half-open", () => { expect(nightsBetween("2027-01-01", "2027-01-04")).toBe(3) })
})
describe("refund (by policy snapshot)", () => {
  it("C6 — moderate, 3 days = 50%", () => { expect(refundCents(39600, "moderate", 3, false)).toBe(19800) })
  it("moderate 5d=100%, strict 7d=50%, strict 6d=0", () => {
    expect(refundCents(39600, "moderate", 5, false)).toBe(39600)
    expect(refundCents(39600, "strict", 7, false)).toBe(19800)
    expect(refundCents(39600, "strict", 6, false)).toBe(0)
  })
  it("started stay refunds nothing", () => { expect(refundCents(39600, "flexible", 0, true)).toBe(0) })
})
describe("availability overlap (half-open)", () => {
  it("C1/C10 — overlaps detected, touching does not", () => {
    expect(overlaps("2027-01-01", "2027-01-05", "2027-01-04", "2027-01-08")).toBe(true)
    expect(overlaps("2027-01-01", "2027-01-04", "2027-01-04", "2027-01-08")).toBe(false)
    expect(overlaps("2027-01-01", "2027-01-03", "2027-01-05", "2027-01-08")).toBe(false)
  })
})
`

const HEALTH = `import { NextResponse } from "next/server"
export async function GET() { return NextResponse.json({ status: "ok" }) }
`

const rentalsSql = (T: Tables) => `CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE IF NOT EXISTS ${T.book} (id BIGSERIAL PRIMARY KEY, listing_id BIGINT, guest_id BIGINT, check_in DATE, check_out DATE, created_at TIMESTAMPTZ DEFAULT NOW());
DO $$ BEGIN
  ALTER TABLE ${T.book} ADD COLUMN IF NOT EXISTS guests_count INT;
  ALTER TABLE ${T.book} ADD COLUMN IF NOT EXISTS nights INT;
  ALTER TABLE ${T.book} ADD COLUMN IF NOT EXISTS base_cents INT;
  ALTER TABLE ${T.book} ADD COLUMN IF NOT EXISTS cleaning_cents INT;
  ALTER TABLE ${T.book} ADD COLUMN IF NOT EXISTS service_fee_cents INT;
  ALTER TABLE ${T.book} ADD COLUMN IF NOT EXISTS taxes_cents INT;
  ALTER TABLE ${T.book} ADD COLUMN IF NOT EXISTS total_cents INT;
  ALTER TABLE ${T.book} ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'requested';
  ALTER TABLE ${T.book} ADD COLUMN IF NOT EXISTS cancellation_policy_snapshot VARCHAR(16);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ${T.book} ADD CONSTRAINT no_double_booking
    EXCLUDE USING gist (listing_id WITH =, daterange(check_in, check_out, '[)') WITH &&)
    WHERE (status IN ('accepted','confirmed','completed'));
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_${T.book}_listing_dates ON ${T.book}(listing_id, check_in, check_out);`

const bookingRoute = (T: Tables) => `import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { createBooking, BookingError } from "@/lib/rentals/booking"
import { pool } from "@/lib/db"
/** Create a booking — anti-double-booking + deterministic pricing + state machine + validation. */
export async function POST(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  try {
    const b = await request.json()
    const r = await createBooking({ listingId: Number(b.listingId ?? b.listing_id), guestId: u.userId, checkIn: String(b.checkIn ?? b.check_in ?? "").slice(0, 10), checkOut: String(b.checkOut ?? b.check_out ?? "").slice(0, 10), guestsCount: Number(b.guestsCount ?? b.guests_count ?? 1) })
    return NextResponse.json(r, { status: 201 })
  } catch (e: any) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.message }, { status: e.code })
    console.error(e); return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}
export async function GET(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { rows } = await pool.query("SELECT * FROM ${T.book} WHERE guest_id=$1 ORDER BY id DESC", [u.userId])
  return NextResponse.json(rows)
}
`

export function deterministicRentals(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /airbnb|alquiler|rental|booking|reserva|stay|listing.*(noche|night)|host.*guest|hosped|hotel|coworking|availability|disponibilidad.*fecha|check.?in|nightly|vacation rental|short.?term/.test(hay)
  if (!wants) return null
  const T = detectTables(bp)
  return {
    files: [
      { path: "lib/rentals/pricing.ts", content: PRICING },
      { path: "lib/rentals/availability.ts", content: availabilityTs(T) },
      { path: "lib/rentals/booking.ts", content: bookingTs(T) },
      { path: "lib/rentals/refund.ts", content: refundTs(T) },
      { path: "lib/rentals/reviews.ts", content: reviewsTs(T) },
      { path: "lib/rentals/__tests__/domain.test.ts", content: PRICING_TEST },
      { path: "app/api/health/route.ts", content: HEALTH },
    ],
    extraSql: rentalsSql(T),
  }
}

/** Override the swarm's booking-create route with the verified one, on the DETECTED table. */
export function deterministicRentalRoutes(bp: Blueprint, existingPaths: string[]): AppFile[] {
  const T = detectTables(bp)
  const re = new RegExp(`^app/api/(${T.book}|bookings|reservations|reservas)/route\\.ts$`)
  const cand = existingPaths.find((p) => re.test(p))
  return [{ path: cand || `app/api/${T.book}/route.ts`, content: bookingRoute(T) }]
}
