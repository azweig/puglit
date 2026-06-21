/**
 * validation-module.ts — tiny shared validator (client + server), zero-dep. Declare a schema of
 * rules; validate(schema, data) returns { ok, errors }. Same rules everywhere → no drift between
 * the form and the API. Stops a whole class of bad-input bugs.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const VAL = `export type Rule = { type?: "string" | "number" | "email" | "bool"; required?: boolean; min?: number; max?: number; pattern?: string; enum?: string[] }
export type Schema = Record<string, Rule>
const EMAIL = /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/

/** Validate data against a schema. Returns field-level errors. */
export function validate(schema: Schema, data: Record<string, unknown>): { ok: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  for (const [k, r] of Object.entries(schema)) {
    const v = data[k]
    if (v == null || v === "") { if (r.required) errors[k] = "required"; continue }
    if (r.type === "number" && isNaN(Number(v))) errors[k] = "must be a number"
    if (r.type === "email" && !EMAIL.test(String(v))) errors[k] = "invalid email"
    if (r.type === "bool" && typeof v !== "boolean") errors[k] = "must be boolean"
    if (r.enum && !r.enum.includes(String(v))) errors[k] = "must be one of " + r.enum.join(", ")
    if (r.pattern && !new RegExp(r.pattern).test(String(v))) errors[k] = "invalid format"
    const len = typeof v === "number" ? v : String(v).length
    if (r.min != null && len < r.min) errors[k] = "too short/small (min " + r.min + ")"
    if (r.max != null && len > r.max) errors[k] = "too long/big (max " + r.max + ")"
  }
  return { ok: Object.keys(errors).length === 0, errors }
}
`

export function deterministicValidation(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /valid|form|formulario|input|submit|registro|signup|checkout|onboarding|data quality|schema/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/validation.ts", content: VAL }] }
}
