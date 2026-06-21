/**
 * reviews-module.ts — ratings & reviews (marketplaces, products, services), Postgres-native.
 * addReview(subject, author, rating, text), summary(subject) returns avg + count + histogram.
 * One review per (subject, author) enforced.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const REV = `import { pool } from "@/lib/db"
export async function addReview(subject: string, author: string, rating: number, text = "") {
  const r = Math.max(1, Math.min(5, Math.round(rating)))
  await pool().query("INSERT INTO reviews (subject, author, rating, body) VALUES ($1,$2,$3,$4) ON CONFLICT (subject, author) DO UPDATE SET rating=$3, body=$4, created_at=NOW()", [subject, author, r, text])
}
export async function reviewSummary(subject: string) {
  const { rows } = await pool().query("SELECT rating, COUNT(*)::int AS n FROM reviews WHERE subject=$1 GROUP BY rating", [subject])
  const hist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let total = 0, sum = 0
  for (const r of rows) { hist[r.rating] = r.n; total += r.n; sum += r.rating * r.n }
  return { average: total ? Math.round((sum / total) * 10) / 10 : 0, count: total, histogram: hist }
}
export async function listReviews(subject: string, limit = 20) {
  return (await pool().query("SELECT author, rating, body, created_at FROM reviews WHERE subject=$1 ORDER BY created_at DESC LIMIT $2", [subject, limit])).rows
}
`
const SQL = `CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY, subject TEXT NOT NULL, author TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5), body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE (subject, author)
);`

export function deterministicReviews(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /review|rese[nñ]a|rating|calificaci|estrella|star|valoraci|opinion|marketplace|producto|product|service|restaurant|hotel|seller/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/reviews.ts", content: REV }], extraSql: SQL }
}
