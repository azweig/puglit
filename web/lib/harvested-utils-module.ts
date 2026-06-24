/**
 * harvested-utils-module.ts — small, zero-dependency utilities the genetic swarm BUILT and promoted
 * during training (slugify, keyset pagination, CSV export, ICS calendar). Re-adapted for the web:
 * they return strings/Responses instead of writing to the filesystem (the swarm's originals used
 * fs streams, which don't work in serverless routes). Gated by keyword so they only land when the
 * product actually needs them — same pattern as deterministicCharts/deterministicQueue.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const SLUGIFY = `import { createHash } from "crypto"
/** URL-friendly slug from any string. */
export function slugify(input: string): string {
  return (input || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}
/** Stable, collision-resistant slug (appends an 8-char content hash). */
export function uniqueSlugify(input: string): string {
  return slugify(input) + "-" + createHash("sha256").update(input).digest("hex").slice(0, 8)
}
`

const PAGINATION = `import { pool } from "@/lib/db"
/** Keyset (cursor) pagination — fast on large tables, no OFFSET scan. The cursor is the last row's
 *  orderBy value; row values are parameterized (\\$1,\\$2). table/orderBy are DEVELOPER-controlled
 *  identifiers (never user input) — pass them from a fixed allow-list, never from the request. */
export interface Page<T> { data: T[]; nextCursor: string | null }
export async function paginate<T>(opts: { table: string; orderBy: string; limit: number; cursor?: string | null; where?: string; params?: any[] }): Promise<Page<T>> {
  const p: any[] = [...(opts.params || [])]
  let sql = "SELECT * FROM " + opts.table + " WHERE 1=1"
  if (opts.where) sql += " AND (" + opts.where + ")"
  if (opts.cursor) { p.push(opts.cursor); sql += " AND " + opts.orderBy + " > $" + p.length }
  p.push(opts.limit); sql += " ORDER BY " + opts.orderBy + " ASC LIMIT $" + p.length
  const { rows } = await pool.query(sql, p)
  const nextCursor = rows.length === opts.limit ? String(rows[rows.length - 1][opts.orderBy]) : null
  return { data: rows as T[], nextCursor }
}
`

const CSV = `/** Rows -> CSV string (RFC-4180 quoting). headers defaults to the keys of the first row. */
export function toCsv(rows: Record<string, any>[], headers?: string[]): string {
  if (!rows.length) return ""
  const cols = headers || Object.keys(rows[0])
  const esc = (v: any) => { const s = v == null ? "" : String(v); return /[",\\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\\n")
}
/** A downloadable CSV Response — return it straight from a route handler. */
export function csvResponse(rows: Record<string, any>[], filename = "export.csv", headers?: string[]): Response {
  return new Response(toCsv(rows, headers), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="' + filename + '"' } })
}
`

const ICS = `interface IcsEvent { uid: string; summary: string; description?: string; location?: string; start: Date; end: Date }
const clean = (s: string) => (s || "").replace(/[\\r\\n,;]+/g, " ").trim().slice(0, 250)
const dt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\\.\\d{3}/, "")
/** Build a valid .ics calendar string from events (times in UTC). */
export function buildIcs(events: IcsEvent[]): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Puglit//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"]
  for (const e of events) lines.push("BEGIN:VEVENT", "UID:" + e.uid, "DTSTAMP:" + dt(e.start), "DTSTART:" + dt(e.start), "DTEND:" + dt(e.end), "SUMMARY:" + clean(e.summary), "DESCRIPTION:" + clean(e.description || ""), "LOCATION:" + clean(e.location || ""), "STATUS:CONFIRMED", "END:VEVENT")
  lines.push("END:VCALENDAR")
  return lines.join("\\r\\n")
}
/** A downloadable .ics Response — return it straight from a route handler. */
export function icsResponse(events: IcsEvent[], filename = "calendar.ics"): Response {
  return new Response(buildIcs(events), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="' + filename + '"' } })
}
`

/** Inject whichever of the 4 swarm-harvested utils the product's domain calls for. */
export function deterministicHarvestedUtils(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")} ${(bp.routes || []).map((r) => r.path).join(" ")}`.toLowerCase()
  const files: AppFile[] = []
  if (/slug|blog|article|art[ií]culo|post|listing|publicaci|seo|perfil p[uú]blico|p[aá]gina p[uú]blica/.test(hay)) files.push({ path: "lib/slugify.ts", content: SLUGIFY })
  if (/feed|timeline|infinite|paginat|paginac|scroll|historial|activity|notificac|notification|mensaje|message|comment|coment/.test(hay)) files.push({ path: "lib/pagination.ts", content: PAGINATION })
  if (/export|csv|descargar|download|reporte|report|backup|planilla|spreadsheet/.test(hay)) files.push({ path: "lib/csv.ts", content: CSV })
  if (/event|evento|calendar|calendario|booking|reserva|cita|appointment|agenda|schedule|turno/.test(hay)) files.push({ path: "lib/ics.ts", content: ICS })
  return files.length ? { files } : null
}
