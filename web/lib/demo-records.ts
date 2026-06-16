/**
 * Puglit web — demo-records.ts
 * Per-user, per-project record storage for the live demos. Generic JSONB rows so
 * any AI-designed entity works. Backed by Puglit's Postgres (creds server-side).
 */
import { query } from "@/lib/db"

let ready = process.env.NODE_ENV === "production"
async function ensure() {
  if (ready) return
  await query(`
    CREATE TABLE IF NOT EXISTS puglit_demo_records (
      id BIGSERIAL PRIMARY KEY,
      project_slug VARCHAR(80) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      entity VARCHAR(80) NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_demo_records ON puglit_demo_records(project_slug, user_email, entity);
  `)
  ready = true
}

export async function listRecords(slug: string, email: string, entity: string) {
  await ensure()
  const { rows } = await query(
    `SELECT id, data, created_at FROM puglit_demo_records WHERE project_slug=$1 AND user_email=$2 AND entity=$3 ORDER BY created_at DESC LIMIT 100`,
    [slug, email, entity]
  )
  return rows
}
export async function createRecord(slug: string, email: string, entity: string, data: Record<string, unknown>) {
  await ensure()
  const { rows } = await query(
    `INSERT INTO puglit_demo_records (project_slug, user_email, entity, data) VALUES ($1,$2,$3,$4) RETURNING id, data, created_at`,
    [slug, email, entity, JSON.stringify(data)]
  )
  return rows[0]
}
export async function deleteRecord(slug: string, email: string, entity: string, id: number) {
  await ensure()
  await query(`DELETE FROM puglit_demo_records WHERE id=$1 AND project_slug=$2 AND user_email=$3 AND entity=$4`, [id, slug, email, entity])
}
