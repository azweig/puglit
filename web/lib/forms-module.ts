/**
 * forms-module.ts — dynamic forms: define a form (fields) once, collect + validate submissions,
 * read them back. Postgres-native. For contact/lead/survey/intake/application forms without
 * hardcoding each one. Pairs with the validation module.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const FORMS = `import { pool } from "@/lib/db"
export interface Field { name: string; label: string; type: "text" | "email" | "number" | "select" | "textarea"; required?: boolean; options?: string[] }

export async function defineForm(slug: string, title: string, fields: Field[]) {
  await pool().query("INSERT INTO forms (slug, title, fields) VALUES ($1,$2,$3) ON CONFLICT (slug) DO UPDATE SET title=$2, fields=$3", [slug, title, JSON.stringify(fields)])
}
export async function getForm(slug: string): Promise<{ title: string; fields: Field[] } | null> {
  const { rows } = await pool().query("SELECT title, fields FROM forms WHERE slug=$1", [slug])
  return rows[0] ? { title: rows[0].title, fields: rows[0].fields } : null
}
/** Submit a form — validates required fields, stores the response. */
export async function submitForm(slug: string, data: Record<string, unknown>): Promise<{ ok: boolean; errors?: Record<string, string> }> {
  const form = await getForm(slug)
  if (!form) return { ok: false, errors: { _: "unknown form" } }
  const errors: Record<string, string> = {}
  for (const f of form.fields) if (f.required && (data[f.name] == null || data[f.name] === "")) errors[f.name] = "required"
  if (Object.keys(errors).length) return { ok: false, errors }
  await pool().query("INSERT INTO form_submissions (slug, data) VALUES ($1,$2)", [slug, JSON.stringify(data)])
  return { ok: true }
}
export async function submissions(slug: string, limit = 100) {
  return (await pool().query("SELECT data, created_at FROM form_submissions WHERE slug=$1 ORDER BY id DESC LIMIT $2", [slug, limit])).rows
}
`
const SQL = `CREATE TABLE IF NOT EXISTS forms (
  slug VARCHAR(64) PRIMARY KEY, title TEXT, fields JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS form_submissions (
  id BIGSERIAL PRIMARY KEY, slug VARCHAR(64) NOT NULL, data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);`

export function deterministicForms(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /form|formulario|survey|encuesta|contact|contacto|lead|intake|application|aplicaci|quiz|cuestionario|feedback|registro/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/forms.ts", content: FORMS }], extraSql: SQL }
}
