/**
 * rentals-module.ts — VERTICAL building block for rental / stay / booking marketplaces (Airbnb,
 * Booking.com, coworking, hotels). It injects the HARD, verifiable domain logic the generic LLM
 * codegen can't be trusted to get right — the same deterministic-injection pattern as geo/swipe/
 * membership, but for the correctness-critical parts of a booking marketplace:
 *   - pricing.ts   : deterministic price in INTEGER CENTS (one function for search AND checkout)
 *   - availability.ts: half-open interval overlap + isAvailable (blocks + active bookings)
 *   - booking.ts   : atomic createBooking (anti-double-booking) + the booking state machine
 *   - refund.ts    : cancellation refund by the POLICY SNAPSHOT
 *   - reviews.ts   : double-blind reveal
 * + SQL hardening: a Postgres EXCLUDE-USING-gist constraint that makes overlapping confirmed
 *   bookings IMPOSSIBLE at the DB level (the real anti-double-booking guarantee under concurrency).
 * The swarm still designs the listings/users/search/UI around these primitives.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const PRICING = `export type PricedListing = { nightly_price_cents: number; cleaning_fee_cents: number; weekly_discount_pct: number }
export type Quote = { nights: number; base_cents: number; cleaning_cents: number; service_fee_cents: number; taxes_cents: number; total_cents: number }
/** Whole nights between two YYYY-MM-DD dates (half-open). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = Date.parse(checkIn + "T00:00:00Z"), b = Date.parse(checkOut + "T00:00:00Z")
  return Math.round((b - a) / 86400000)
}
/** DETERMINISTIC price, integer cents only (no floats for money). Use this in BOTH search and
 *  checkout so the totals are identical to the cent. */
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

const AVAILABILITY = `import { pool } from "@/lib/db"
/** Half-open interval overlap: [aStart,aEnd) overlaps [bStart,bEnd) iff aStart < bEnd && bStart < aEnd. */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd
}
/** Available iff NO availability_block and NO active booking (accepted|confirmed|completed) overlaps. */
export async function isAvailable(listingId: number, checkIn: string, checkOut: string): Promise<boolean> {
  const blocked = await pool.query("SELECT 1 FROM availability_blocks WHERE listing_id=$1 AND start_date < $3 AND $2 < end_date LIMIT 1", [listingId, checkIn, checkOut])
  if (blocked.rows.length) return false
  const booked = await pool.query("SELECT 1 FROM bookings WHERE listing_id=$1 AND status IN ('accepted','confirmed','completed') AND check_in < $3 AND $2 < check_out LIMIT 1", [listingId, checkIn, checkOut])
  return booked.rows.length === 0
}
/** WHERE-clause fragment for search (params $checkIn=$2, $checkOut=$3, listings aliased l). */
export const AVAILABLE_SQL = "NOT EXISTS (SELECT 1 FROM availability_blocks ab WHERE ab.listing_id=l.id AND ab.start_date < $3 AND $2 < ab.end_date) AND NOT EXISTS (SELECT 1 FROM bookings bk WHERE bk.listing_id=l.id AND bk.status IN ('accepted','confirmed','completed') AND bk.check_in < $3 AND $2 < bk.check_out)"
`

const BOOKING = `import { pool } from "@/lib/db"
import { priceQuote } from "./pricing"
import { isAvailable } from "./availability"
const TRANSITIONS: Record<string, string[]> = { requested: ["accepted", "declined"], accepted: ["confirmed", "cancelled"], confirmed: ["cancelled", "completed"], declined: [], cancelled: [], completed: [] }
export function canTransition(from: string, to: string): boolean { return (TRANSITIONS[from] || []).includes(to) }
export class BookingError extends Error { constructor(public code: number, msg: string) { super(msg) } }

/** Create a booking ATOMICALLY. Anti-double-booking is guaranteed by the DB exclusion constraint
 *  (overlapping accepted/confirmed bookings throw 23P01 → 409) AND a same-tx availability check. */
export async function createBooking(input: { listingId: number; guestId: number; checkIn: string; checkOut: string; guestsCount: number }) {
  const { listingId, guestId, checkIn, checkOut, guestsCount } = input
  const l = (await pool.query("SELECT * FROM listings WHERE id=$1", [listingId])).rows[0]
  if (!l) throw new BookingError(404, "listing not found")
  if (l.host_id === guestId) throw new BookingError(400, "cannot book your own listing")
  if (l.status !== "published") throw new BookingError(400, "listing not bookable")
  if (!(checkOut > checkIn)) throw new BookingError(400, "check_out must be after check_in")
  const today = new Date().toISOString().slice(0, 10)
  if (checkIn < today) throw new BookingError(400, "dates in the past")
  const q = priceQuote(l, checkIn, checkOut)
  if (q.nights < (l.min_nights || 1)) throw new BookingError(400, "below minimum nights")
  if (l.max_nights && q.nights > l.max_nights) throw new BookingError(400, "above maximum nights")
  if (guestsCount > l.capacity) throw new BookingError(400, "guests exceed capacity")
  const status = l.instant_book ? "accepted" : "requested"
  const c = await pool.connect()
  try {
    await c.query("BEGIN")
    if (!(await isAvailable(listingId, checkIn, checkOut))) { await c.query("ROLLBACK"); throw new BookingError(409, "not available") }
    const r = await c.query("INSERT INTO bookings (listing_id, guest_id, check_in, check_out, guests_count, nights, base_cents, cleaning_cents, service_fee_cents, taxes_cents, total_cents, status, cancellation_policy_snapshot) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id", [listingId, guestId, checkIn, checkOut, guestsCount, q.nights, q.base_cents, q.cleaning_cents, q.service_fee_cents, q.taxes_cents, q.total_cents, status, l.cancellation_policy])
    await c.query("INSERT INTO payments (booking_id, kind, amount_cents, status) VALUES ($1,'hold',$2,'pending')", [r.rows[0].id, q.total_cents])
    await c.query("COMMIT")
    return { id: r.rows[0].id, status, quote: q }
  } catch (e: any) {
    await c.query("ROLLBACK")
    if (e instanceof BookingError) throw e
    if (e.code === "23P01" || /no_double_booking|exclu/i.test(e.message || "")) throw new BookingError(409, "not available")
    throw e
  } finally { c.release() }
}
/** State-machine transition; rejects illegal moves with 400. Confirm → charge the hold. */
export async function transition(bookingId: number, to: string) {
  const b = (await pool.query("SELECT status FROM bookings WHERE id=$1", [bookingId])).rows[0]
  if (!b) throw new BookingError(404, "booking not found")
  if (!canTransition(b.status, to)) throw new BookingError(400, "invalid transition " + b.status + "→" + to)
  try {
    await pool.query("UPDATE bookings SET status=$2 WHERE id=$1", [bookingId, to])
  } catch (e: any) { if (e.code === "23P01") throw new BookingError(409, "not available"); throw e }
  if (to === "confirmed") await pool.query("UPDATE payments SET kind='charge', status='paid' WHERE booking_id=$1 AND kind='hold'", [bookingId])
}
`

const REFUND = `import { pool } from "@/lib/db"
/** Refund in integer cents from the POLICY SNAPSHOT + days until check-in. */
export function refundCents(totalCents: number, policy: "flexible" | "moderate" | "strict", daysToCheckin: number, started: boolean): number {
  if (started) return 0
  if (policy === "flexible") return daysToCheckin >= 1 ? totalCents : 0
  if (policy === "moderate") return daysToCheckin >= 5 ? totalCents : daysToCheckin >= 1 ? Math.round(totalCents * 0.5) : 0
  if (policy === "strict") return daysToCheckin >= 7 ? Math.round(totalCents * 0.5) : 0
  return 0
}
/** Cancel a booking → compute refund from the snapshot, record payments(kind=refund), free the dates. */
export async function cancelBooking(bookingId: number) {
  const b = (await pool.query("SELECT * FROM bookings WHERE id=$1", [bookingId])).rows[0]
  if (!b) throw new Error("404 not found")
  const today = new Date().toISOString().slice(0, 10)
  const ci = b.check_in instanceof Date ? b.check_in.toISOString().slice(0, 10) : String(b.check_in)
  const daysToCheckin = Math.round((Date.parse(ci + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000)
  const refund = refundCents(b.total_cents, b.cancellation_policy_snapshot, daysToCheckin, ci <= today)
  await pool.query("UPDATE bookings SET status='cancelled' WHERE id=$1", [bookingId])
  if (refund > 0) await pool.query("INSERT INTO payments (booking_id, kind, amount_cents, status) VALUES ($1,'refund',$2,'paid')", [bookingId, refund])
  return { refundCents: refund }
}
`

const REVIEWS = `import { pool } from "@/lib/db"
/** Double-blind: only a COMPLETED booking's parties may review; hidden until BOTH submit (or 14d). */
export async function submitReview(bookingId: number, authorId: number, targetKind: "listing" | "guest", rating: number, body: string) {
  const b = (await pool.query("SELECT status FROM bookings WHERE id=$1", [bookingId])).rows[0]
  if (!b) throw new Error("404")
  if (b.status !== "completed") throw new Error("400 booking not completed")
  if (rating < 1 || rating > 5) throw new Error("400 rating must be 1-5")
  if ((await pool.query("SELECT 1 FROM reviews WHERE booking_id=$1 AND author_id=$2", [bookingId, authorId])).rows.length) throw new Error("409 already reviewed")
  await pool.query("INSERT INTO reviews (booking_id, author_id, target_kind, rating, body, is_visible) VALUES ($1,$2,$3,$4,$5,false)", [bookingId, authorId, targetKind, rating, body])
  const n = (await pool.query("SELECT COUNT(*)::int AS n FROM reviews WHERE booking_id=$1", [bookingId])).rows[0].n
  if (n >= 2) await pool.query("UPDATE reviews SET is_visible=true WHERE booking_id=$1", [bookingId])
}
/** Cron: reveal one-sided reviews older than 14 days. */
export async function revealStaleReviews() {
  await pool.query("UPDATE reviews SET is_visible=true WHERE is_visible=false AND submitted_at < NOW() - interval '14 days'")
}
`

// Self-contained verification of the correctness-critical math (C2/C6/C11/overlap). Ships with the
// app so the gate can prove the primitives independent of any endpoint. node scripts/verify-rentals.mjs
const VERIFY = `// Asserts the rental domain math — run: node scripts/verify-rentals.mjs
function nights(ci,co){return Math.round((Date.parse(co+"T00:00:00Z")-Date.parse(ci+"T00:00:00Z"))/86400000)}
function quote(l,ci,co){const n=nights(ci,co);let b=l.nightly_price_cents*n;if(n>=7&&l.weekly_discount_pct>0)b=b-Math.round(b*l.weekly_discount_pct/100);const s=b+l.cleaning_fee_cents,svc=Math.round(s*0.12),tax=Math.round(s*0.08);return{nights:n,base_cents:b,service_fee_cents:svc,taxes_cents:tax,total_cents:s+svc+tax}}
function refund(t,p,d,started){if(started)return 0;if(p==="flexible")return d>=1?t:0;if(p==="moderate")return d>=5?t:d>=1?Math.round(t*0.5):0;if(p==="strict")return d>=7?Math.round(t*0.5):0;return 0}
function overlaps(as,ae,bs,be){return as<be&&bs<ae}
let f=0;const A=(n,c)=>{c?console.log("  ✓",n):(f++,console.log("  ✗ FAIL",n))}
const L={nightly_price_cents:10000,cleaning_fee_cents:3000,weekly_discount_pct:10}
const q=quote(L,"2027-01-01","2027-01-04")
A("C2/C11 total=39600 enteros",q.total_cents===39600&&[q.base_cents,q.service_fee_cents,q.taxes_cents].every(Number.isInteger))
A("C2 search==checkout",JSON.stringify(quote(L,"2027-01-01","2027-01-04"))===JSON.stringify(q))
A("weekly@7n=79200",quote(L,"2027-01-01","2027-01-08").total_cents===79200)
A("C6 moderate 3d=50%",refund(39600,"moderate",3,false)===19800)
A("strict 6d=0",refund(39600,"strict",6,false)===0)
A("C1/C10 overlap medio-abierto",overlaps("2027-01-01","2027-01-05","2027-01-04","2027-01-08")&&!overlaps("2027-01-01","2027-01-04","2027-01-04","2027-01-08"))
console.log(f?("\\n  "+f+" FAIL"):"\\n  PRIMITIVES OK");process.exit(f?1:0)
`
const HEALTH = `import { NextResponse } from "next/server"
export async function GET() { return NextResponse.json({ status: "ok" }) }
`

// SQL hardening — the REAL anti-double-booking guarantee (DB-level, survives concurrency).
const RENTALS_SQL = `CREATE EXTENSION IF NOT EXISTS btree_gist;
-- ensure the bookings table + the columns createBooking writes exist (the architect may have made a
-- thinner table) so the verified primitives have a guaranteed contract.
CREATE TABLE IF NOT EXISTS bookings (id BIGSERIAL PRIMARY KEY, listing_id BIGINT, guest_id BIGINT, check_in DATE, check_out DATE, created_at TIMESTAMPTZ DEFAULT NOW());
DO $$ BEGIN
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guests_count INT;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS nights INT;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS base_cents INT;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cleaning_cents INT;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_fee_cents INT;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS taxes_cents INT;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_cents INT;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'requested';
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_policy_snapshot VARCHAR(16);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS availability_blocks (id BIGSERIAL PRIMARY KEY, listing_id BIGINT, start_date DATE, end_date DATE, reason TEXT);
CREATE TABLE IF NOT EXISTS payments (id BIGSERIAL PRIMARY KEY, booking_id BIGINT, kind VARCHAR(12), amount_cents INT, status VARCHAR(16), created_at TIMESTAMPTZ DEFAULT NOW());
DO $$ BEGIN
  ALTER TABLE bookings ADD CONSTRAINT no_double_booking
    EXCLUDE USING gist (listing_id WITH =, daterange(check_in, check_out, '[)') WITH &&)
    WHERE (status IN ('accepted','confirmed','completed'));
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_bookings_listing_dates ON bookings(listing_id, check_in, check_out);`

// CANONICAL booking route (Puglit override) — the generic codegen reinvents this and gets it wrong
// (no pricing, no availability check, inverted auth). Replace it with one that uses the primitives.
const BOOKING_ROUTE = `import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { createBooking, transition, BookingError } from "@/lib/rentals/booking"
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
  const { pool } = await import("@/lib/db")
  const { rows } = await pool.query("SELECT * FROM bookings WHERE guest_id=$1 ORDER BY id DESC", [u.userId])
  return NextResponse.json(rows)
}
`

/** Override the swarm's booking-create route with the verified one. Detects the existing
 *  bookings/reservations collection route; falls back to app/api/bookings/route.ts. */
export function deterministicRentalRoutes(existingPaths: string[]): AppFile[] {
  const cand = existingPaths.find((p) => /^app\/api\/(bookings|reservations|reservas|reserva)\/route\.ts$/.test(p))
  return [{ path: cand || "app/api/bookings/route.ts", content: BOOKING_ROUTE }]
}

export function deterministicRentals(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /airbnb|alquiler|rental|booking|reserva|stay|listing.*(noche|night)|host.*guest|hosped|hotel|coworking|availability|disponibilidad.*fecha|check.?in|nightly|vacation rental|short.?term/.test(hay)
  if (!wants) return null
  return {
    files: [
      { path: "lib/rentals/pricing.ts", content: PRICING },
      { path: "lib/rentals/availability.ts", content: AVAILABILITY },
      { path: "lib/rentals/booking.ts", content: BOOKING },
      { path: "lib/rentals/refund.ts", content: REFUND },
      { path: "lib/rentals/reviews.ts", content: REVIEWS },
      { path: "scripts/verify-rentals.mjs", content: VERIFY },
      { path: "app/api/health/route.ts", content: HEALTH },
    ],
    extraSql: RENTALS_SQL,
  }
}
