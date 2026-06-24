/**
 * Puglit web — agents.ts
 * The first real generate → verify → repair loop, governed by the control plane.
 * Implements AGENTS.md (slice): Contracts Architect → Engine worker → Verifier
 * (BLOCKING vs ADVISORY findings) → Root-Cause+Fixer loop until convergence or
 * the iteration/budget cap. Verification here is LLM-based review (no compiler in
 * the serverless runtime); the delivered code still lands in GitHub for CI.
 */
import { chatJSON, chatText, aiConfigured, MODELS } from "@/lib/openai"
import type { DomainConfig } from "@/lib/domain-types"

const CONVENTIONS = `Puglit spine (Next.js 16 App Router, TS strict). Use ONLY these:
- import { NextRequest, NextResponse } from "next/server"; route handlers: export async function GET/POST(request: NextRequest).
- Auth: import { getAuthUser } from "@/lib/auth" → const u = await getAuthUser(request); if (!u) return 401; u.userId:number.
- Storage: import { listRecords, createRecord, deleteRecord } from "@/lib/records" (per-user JSONB rows).
- Raw SQL: import { pool } from "@/lib/db"; await pool.query(text, params).
- Email: import { sendEmail } from "@/lib/mailer".
- Config: import config from "@/domain.config". No external npm deps. Parameterized queries only.`

export interface Finding { severity: "BLOCKING" | "ADVISORY"; desc: string }
export interface EngineResult { path: string; code: string; findings: Finding[]; iterations: number; contracts: string }

/** Contracts Architect — the source of truth the worker must conform to. */
export async function runContracts(config: DomainConfig): Promise<string> {
  if (!aiConfigured()) return ""
  const ents = (config.entities || []).map((e) => `${e.name}(${e.fields.map((f) => f.name + ":" + f.type).join(", ")})`).join("; ")
  const out = await chatText([
    { role: "system", content: "You are the Contracts Architect. Define the CONTRACT (TypeScript types + the single most important API endpoint: method, path, request, response, auth, gating) for this product's CORE feature. Concise. No implementation. Markdown." },
    { role: "user", content: `Product: ${config.identity.name}. Core: ${typeof config.identity.tagline === "string" ? config.identity.tagline : ""}. Entities: ${ents}.` },
  ], { model: MODELS.balanced, temperature: 0.2 })
  return out.slice(0, 6000)
}

/** Engine worker + verifier + fixer loop, governed by the control plane. */
export async function genVerifiedEngine(config: DomainConfig, contracts: string, opts?: { maxIters?: number }): Promise<EngineResult | null> {
  if (!aiConfigured()) return null
  const maxIters = opts?.maxIters ?? 2
  const brief = `Product: ${config.identity.name}. Core feature: ${config.engine?.description || (typeof config.identity.tagline === "string" ? config.identity.tagline : "")}.\nCONTRACTS:\n${contracts}\n\nCONVENTIONS:\n${CONVENTIONS}`

  // Worker: generate the bespoke feature as ONE route handler file.
  const first = (await chatJSON([
    { role: "system", content: `You are the Engine Engineer. Generate the product's UNIQUE core feature as ONE Next.js 16 route handler file, conforming to the CONTRACTS and CONVENTIONS. Real, working logic (no TODOs). Return ONLY JSON: {"path":"app/api/.../route.ts","code":"<full file>"}.` },
    { role: "user", content: brief },
  ], { model: MODELS.code, temperature: 0.3 })) as { path?: string; code?: string }

  let path = String(first.path || "app/api/engine/route.ts")
  let code = String(first.code || "")
  let findings: Finding[] = []
  let iterations = 0

  for (; iterations < maxIters; iterations++) {
    // Verifier: review against contracts/conventions → findings with severity.
    const v = (await chatJSON([
      { role: "system", content: `You are the Verifier. Review the file against the CONTRACTS and CONVENTIONS. Return ONLY JSON {"findings":[{"severity":"BLOCKING"|"ADVISORY","desc":string}]}. BLOCKING = would not compile, wrong/invalid imports, violates the contract, missing auth where required, undefined references. ADVISORY = style, edge cases, perf, maintainability. Be precise.` },
      { role: "user", content: `CONTRACTS:\n${contracts}\n\nCONVENTIONS:\n${CONVENTIONS}\n\nFILE ${path}:\n${code}` },
    ], { model: MODELS.code, temperature: 0 })) as { findings?: Finding[] }
    findings = Array.isArray(v.findings) ? v.findings : []
    const blocking = findings.filter((f) => f.severity === "BLOCKING")
    if (blocking.length === 0) break

    // Fixer: minimal surgical fix of the BLOCKING findings (control plane: only blocking trigger repair).
    const fix = (await chatJSON([
      { role: "system", content: `You are the Fixer. Apply MINIMAL surgical fixes for ONLY these BLOCKING findings, without breaking the CONTRACTS. Return ONLY JSON {"code":"<full corrected file>"}.` },
      { role: "user", content: `BLOCKING:\n${blocking.map((b) => "- " + b.desc).join("\n")}\n\nCONVENTIONS:\n${CONVENTIONS}\n\nFILE:\n${code}` },
    ], { model: MODELS.code, temperature: 0.1 })) as { code?: string }
    if (fix.code) code = String(fix.code)
  }

  return { path, code: code.slice(0, 40_000), findings, iterations, contracts }
}
