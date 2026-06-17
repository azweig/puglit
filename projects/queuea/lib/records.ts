/**
 * Puglit Spine — records.ts
 * Generic per-user record store that powers the /app dashboard. Every entity
 * declared in domain.config.ts is CRUD-able here, scoped to the logged-in user.
 * Domain-specific tables can replace this later; this makes the generated app
 * functional out of the box.
 *
 * PROD: run scripts/sql/003_records.sql in Supabase. ensureRecordsSchema is
 * skipped in production.
 */
import { pool } from "@/lib/db"

let ready = process.env.NODE_ENV === "production"
export async function ensureRecordsSchema(): Promise<void> {
  if (ready) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS records (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      entity VARCHAR(80) NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_records_user_entity ON records(user_id, entity);
  `)
  ready = true
}

export async function listRecords(userId: number, entity: string) {
  await ensureRecordsSchema()
  const { rows } = await pool.query(
    `SELECT id, data, created_at FROM records WHERE user_id=$1 AND entity=$2 ORDER BY created_at DESC LIMIT 200`,
    [userId, entity]
  )
  return rows
}
export async function countByEntity(userId: number): Promise<Record<string, number>> {
  await ensureRecordsSchema()
  const { rows } = await pool.query(`SELECT entity, COUNT(*)::int AS n FROM records WHERE user_id=$1 GROUP BY entity`, [userId])
  return Object.fromEntries(rows.map((r) => [r.entity, r.n]))
}
export async function createRecord(userId: number, entity: string, data: Record<string, unknown>) {
  await ensureRecordsSchema()
  const { rows } = await pool.query(
    `INSERT INTO records (user_id, entity, data) VALUES ($1,$2,$3) RETURNING id, data, created_at`,
    [userId, entity, JSON.stringify(data)]
  )
  return rows[0]
}
export async function deleteRecord(userId: number, entity: string, id: number) {
  await ensureRecordsSchema()
  await pool.query(`DELETE FROM records WHERE id=$1 AND user_id=$2 AND entity=$3`, [id, userId, entity])
}
