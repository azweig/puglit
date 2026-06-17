/**
 * Puglit web — jobs.ts
 * A generation JOB = the multi-agent build pipeline, tracked step by step so the
 * user gets a live progress URL. Each step is advanced by one /api/job/[id]/advance
 * call (serverless-friendly: short calls, client polls until done). Reuses the
 * existing generators + adds SQL migrations and an ER diagram as artifacts.
 */
import { randomBytes } from "node:crypto"
import { query, isConfigured, saveProject } from "@/lib/db"
import { generateConfig, slugify, type IntakeAnswers } from "@/lib/generate"
import { applyBranding } from "@/lib/branding"
import { designEntities } from "@/lib/entitygen"
import { generateLogoSvg } from "@/lib/logo-gen"
import { generateLandingHtml } from "@/lib/landing-gen"
import { assembleProject, githubConfigured } from "@/lib/github"
import type { DomainConfig, Entity, FieldType } from "@/lib/domain-types"

export type StepStatus = "pending" | "running" | "done" | "error"
export interface Step { key: string; label: string; status: StepStatus; detail?: string }

// The "agents" / phases. TodoAstros-grade baseline is assembled from the spine;
// the domain-specific parts are generated.
const PLAN: { key: string; label: string }[] = [
  { key: "data-model", label: "Arquitecto: modelo de datos (entidades + campos)" },
  { key: "brand", label: "Diseñador de marca: logo + paleta" },
  { key: "design", label: "Diseñador web: landing" },
  { key: "schema", label: "DBA: esquema SQL + migraciones" },
  { key: "erd", label: "Arquitecto: diagrama ER (UML)" },
  { key: "backend", label: "Backend: auth, API y records (spine)" },
  { key: "dashboard", label: "Frontend: dashboard del cliente (spine)" },
  { key: "analytics", label: "Growth: analytics + A/B (spine)" },
  { key: "deliver", label: "DevOps: push del repo a GitHub" },
]

const SQL_TYPE: Record<FieldType, string> = {
  text: "TEXT", longtext: "TEXT", int: "INTEGER", float: "DOUBLE PRECISION", bool: "BOOLEAN",
  date: "DATE", datetime: "TIMESTAMPTZ", json: "JSONB", enum: "TEXT", ref: "INTEGER",
  money: "NUMERIC(12,2)", slug: "VARCHAR(160)", url: "TEXT", email: "VARCHAR(255)",
}
const tbl = (e: Entity) => (e.plural || e.name).toLowerCase().replace(/[^a-z0-9]+/g, "_")

export function genSql(entities: Entity[]): string {
  return entities.map((e) => {
    const cols = ["  id BIGSERIAL PRIMARY KEY"]
    if (e.ownedByUser) cols.push("  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE")
    for (const f of e.fields) cols.push(`  ${f.name} ${SQL_TYPE[f.type] || "TEXT"}${f.required ? " NOT NULL" : ""}${f.unique ? " UNIQUE" : ""}`)
    cols.push("  created_at TIMESTAMPTZ DEFAULT NOW()")
    return `CREATE TABLE IF NOT EXISTS ${tbl(e)} (\n${cols.join(",\n")}\n);`
  }).join("\n\n")
}

export function genErd(entities: Entity[]): string {
  const lines = ["erDiagram"]
  for (const e of entities) {
    lines.push(`  ${e.name} {`)
    for (const f of e.fields) lines.push(`    ${(SQL_TYPE[f.type] || "TEXT").split("(")[0].toLowerCase()} ${f.name}`)
    lines.push("  }")
  }
  for (const e of entities) for (const f of e.fields) if (f.type === "ref" && f.ref) lines.push(`  ${e.name} }o--|| ${f.ref} : "${f.name}"`)
  return lines.join("\n")
}

interface JobRow { id: string; slug: string; name: string; email: string | null; status: string; answers: any; branding: any; config: DomainConfig | null; steps: Step[]; artifacts: any }

export async function createJob(input: { answers: IntakeAnswers; branding: any; chosenLanding?: string }): Promise<string> {
  const id = randomBytes(8).toString("hex")
  let slug = slugify(input.answers.name)
  const { rows } = await query(`SELECT 1 FROM puglit_projects WHERE slug=$1`, [slug]).catch(() => ({ rows: [] as any[] }))
  if (rows.length) slug = `${slug}-${randomBytes(2).toString("hex")}`
  const steps: Step[] = PLAN.map((p) => ({ ...p, status: "pending" as StepStatus }))
  await query(
    `INSERT INTO puglit_jobs (id, slug, name, email, status, answers, branding, config, steps, artifacts)
     VALUES ($1,$2,$3,$4,'running',$5,$6,$7,$8,$9)`,
    [id, slug, input.answers.name, input.answers.email || null, JSON.stringify(input.answers), JSON.stringify(input.branding || null), null, JSON.stringify(steps), JSON.stringify({ chosenLanding: input.chosenLanding || null })]
  )
  return id
}

export async function getJob(id: string): Promise<JobRow | null> {
  if (!isConfigured()) return null
  const { rows } = await query(`SELECT * FROM puglit_jobs WHERE id=$1`, [id])
  return rows[0] || null
}

async function persist(job: JobRow) {
  await query(`UPDATE puglit_jobs SET status=$2, config=$3, steps=$4, artifacts=$5, updated_at=NOW() WHERE id=$1`,
    [job.id, job.status, job.config ? JSON.stringify(job.config) : null, JSON.stringify(job.steps), JSON.stringify(job.artifacts)])
}

export async function advanceJob(id: string): Promise<JobRow | null> {
  const job = await getJob(id)
  if (!job || job.status !== "running") return job
  const step = job.steps.find((s) => s.status === "pending")
  if (!step) { job.status = "done"; await persist(job); return job }

  step.status = "running"; await persist(job)
  try {
    const A = job.answers as IntakeAnswers
    job.artifacts = job.artifacts || {}
    switch (step.key) {
      case "data-model": {
        const config = applyBranding(generateConfig(A), job.branding)
        const ents = await designEntities({ name: A.name, what: A.what, benefits: A.benefits })
        if (ents?.length) config.entities = ents
        job.config = config
        step.detail = (config.entities || []).map((e) => e.name).join(", ")
        break
      }
      case "brand": {
        if (job.config && !job.config.identity.logoSvg) {
          const svg = await generateLogoSvg(job.config)
          if (svg) job.config.identity.logoSvg = svg
        }
        step.detail = `Color ${job.config?.identity.brandColor}` + (job.config?.identity.logoSvg ? " · logo SVG" : "")
        break
      }
      case "design": {
        const chosen = job.artifacts.chosenLanding
        job.artifacts.landingHtml = (typeof chosen === "string" && chosen.length > 100) ? chosen : (job.config ? await generateLandingHtml(job.config) : null)
        step.detail = job.artifacts.landingHtml ? `${Math.round(job.artifacts.landingHtml.length / 1024)} KB` : "—"
        break
      }
      case "schema": {
        job.artifacts.sql = genSql(job.config?.entities || [])
        step.detail = `${(job.config?.entities || []).length} tablas`
        break
      }
      case "erd": {
        job.artifacts.erd = genErd(job.config?.entities || [])
        step.detail = "diagrama ER (Mermaid)"
        break
      }
      case "backend": step.detail = "JWT auth, /api/records, middleware, rate-limit, email"; break
      case "dashboard": step.detail = "Dashboard /app con CRUD de tus entidades"; break
      case "analytics": step.detail = "page_visits + analytics_events + A/B"; break
      case "deliver": {
        if (job.config) {
          await saveProject({ slug: job.slug, email: job.email, name: job.name, answers: A as any, config: job.config, landingHtml: job.artifacts.landingHtml })
          if (githubConfigured()) {
            const built = await assembleProject({ slug: job.slug, name: job.name, configTs: configToTs(job.config), readme: `# ${job.name}\n\nGenerated by Puglit.` })
            job.artifacts.githubUrl = built.url
          }
          job.artifacts.previewUrl = `/x/${job.slug}`
        }
        break
      }
    }
    step.status = "done"
    if (!job.steps.some((s) => s.status === "pending")) {
      job.status = "done"
      await sendDoneEmail(job)
    }
  } catch (e) {
    step.status = "error"; step.detail = (e as Error).message.slice(0, 120); job.status = "error"
  }
  await persist(job)
  return job
}

function configToTs(config: DomainConfig): string {
  return `export * from "./domain-types"\nimport type { DomainConfig } from "./domain-types"\nconst config: DomainConfig = ${JSON.stringify(config, null, 2)}\nexport default config\n`
}

async function sendDoneEmail(job: JobRow) {
  const key = process.env.RESEND_API_KEY
  if (!key || !job.email) return
  const base = process.env.APP_URL || "https://puglit-home.vercel.app"
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.WAITLIST_FROM || "Puglit <onboarding@resend.dev>", to: job.email,
        subject: `🐶 ${job.name} está listo`,
        html: `<p>Tu proyecto <b>${job.name}</b> está listo.</p><p><a href="${base}/build/${job.id}">Ver el build</a> · <a href="${base}${job.artifacts?.previewUrl || ""}">Preview</a>${job.artifacts?.githubUrl ? ` · <a href="${job.artifacts.githubUrl}">Código</a>` : ""}</p>`,
      }),
    })
  } catch { /* email optional */ }
}
