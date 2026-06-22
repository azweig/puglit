/**
 * local-repair-serve.mjs — make a locally-generated project RUN, using a LOCAL model.
 *
 * The "do everything in one shot" failure mode of small models is fixed here the way the
 * research says to: a tight VERIFY → REPAIR loop driven by a local model (the CI Fixer, but
 * local + per-file). It:
 *   1) loads the generated SQL into a fresh Postgres, repairing DDL the model got wrong;
 *   2) runs `tsc` and feeds each erroring file + its errors back to the model to fix, looping
 *      until it compiles or rounds run out;
 *   3) leaves the project ready for `next dev`.
 * No hand-written code — every fix is produced by the local model. Mechanical glue only.
 *
 * Env: PROJECT_DIR, OLLAMA_MODEL (default qwen2.5-coder:7b), PG_PORT, APP_DB, MAX_ROUNDS.
 */
import { execSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const DIR = process.env.PROJECT_DIR || "/tmp/dueldeck-app"
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b"
const PG_PORT = process.env.PG_PORT || "5433"
const APP_DB = process.env.APP_DB || "dueldeck_app"
const MAX_ROUNDS = parseInt(process.env.MAX_ROUNDS || "6")
const OLLAMA = "http://localhost:11434/api/chat"

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
const stripFences = (s) => s.replace(/^\s*```[a-z]*\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim()

async function ask(system, user) {
  const res = await fetch(OLLAMA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, stream: false, options: { temperature: 0.1, num_ctx: 8192 },
      messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  })
  const d = await res.json()
  return stripFences(d?.message?.content || "")
}

// ── 1. SQL: load into a fresh DB, repair on failure ──────────────────────────
function psql(db, sqlFileOrCmd, isFile) {
  const args = ["-h", "localhost", "-p", PG_PORT, "-U", "postgres", "-d", db, "-v", "ON_ERROR_STOP=1"]
  args.push(isFile ? "-f" : "-c", sqlFileOrCmd)
  return spawnSync("psql", args, { encoding: "utf8" })
}
async function loadSqlRepairing(label, file) {
  if (!fs.existsSync(file)) return
  for (let r = 1; r <= 4; r++) {
    const out = psql(APP_DB, file, true)
    if (out.status === 0) { log(`SQL ${label}: cargado ✓`); return }
    const err = (out.stderr || "").slice(0, 600)
    log(`SQL ${label} error (intento ${r}): ${err.split("\n")[0]}`)
    const cur = fs.readFileSync(file, "utf8")
    const fixed = await ask(
      "You fix PostgreSQL scripts. Given the script and the psql error, return ONLY the full corrected SQL — no prose, no markdown. Postgres rules: no inline ENUM(...) on columns (use TEXT + CHECK or CREATE TYPE first); no trailing commas; valid types only.",
      `psql error:\n${err}\n\n--- ${path.basename(file)} ---\n${cur}`)
    if (fixed.length > 30) fs.writeFileSync(file, fixed)
  }
  log(`SQL ${label}: no se pudo cargar tras reintentos (sigo)`)
}

// ── 2. tsc: compile, repair erroring files, loop ─────────────────────────────
function tsc() {
  const out = spawnSync("npx", ["tsc", "--noEmit"], { cwd: DIR, encoding: "utf8" })
  const lines = ((out.stdout || "") + (out.stderr || "")).split("\n")
  const byFile = new Map()
  for (const ln of lines) {
    const m = ln.match(/^(.+?\.tsx?)\((\d+),(\d+)\): error (TS\d+): (.+)$/)
    if (!m) continue
    const f = m[1]
    if (!byFile.has(f)) byFile.set(f, [])
    byFile.get(f).push(`L${m[2]}: ${m[4]} ${m[5]}`)
  }
  return byFile
}
async function repairTs() {
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const errs = tsc()
    if (errs.size === 0) { log(`tsc: COMPILA ✓ (ronda ${round})`); return true }
    log(`tsc ronda ${round}: ${errs.size} archivos con errores`)
    for (const [rel, list] of errs) {
      const fp = path.join(DIR, rel)
      if (!fs.existsSync(fp)) continue
      const cur = fs.readFileSync(fp, "utf8")
      const isTsx = rel.endsWith(".tsx")
      const fixed = await ask(
        `You fix ONE file in a Next.js 16 App Router + TypeScript + raw 'pg' project. Given the file and its tsc errors, return ONLY the full corrected file contents — no prose, no markdown fences. Keep imports from '@/lib/*'. Add NO npm deps. ${isTsx ? 'If it uses hooks (useState/useEffect), it MUST start with "use client"; and ALL hooks/JSX must live INSIDE a single default-exported React component (never at module top level); import every hook you use from "react".' : 'Route handlers MUST export async function GET/POST(req: Request) wrappers; import { NextResponse } from "next/server"; use query() from "@/lib/db".'}`,
        `tsc errors:\n${list.join("\n")}\n\n--- ${rel} ---\n${cur}`)
      if (fixed.length > 40) { fs.writeFileSync(fp, isTsx ? ensureUseClient(fixed) : fixed); log(`  fix → ${rel}`) }
    }
  }
  const left = tsc()
  log(left.size === 0 ? "tsc: COMPILA ✓" : `tsc: quedan ${left.size} archivos con errores tras ${MAX_ROUNDS} rondas`)
  return left.size === 0
}
function ensureUseClient(code) {
  const hasHook = /\b(useState|useEffect|useRouter|usePathname|useParams)\b/.test(code)
  let c = code.replace(/^\s*["']use client["'];?\s*/i, "")
  return hasHook ? '"use client";\n' + c : c
}

// ── run ──────────────────────────────────────────────────────────────────────
log(`reparando ${DIR} con ${MODEL}`)
try { execSync(`dropdb -h localhost -p ${PG_PORT} -U postgres --if-exists ${APP_DB}; createdb -h localhost -p ${PG_PORT} -U postgres ${APP_DB}`, { stdio: "ignore" }) } catch {}
// spine base schema (auth/users/etc) + bespoke app schema, both repaired
for (const f of ["sql/puglit.sql", "sql/001_core.sql", "sql/002_auth.sql", "sql/app.sql", "sql/seed.sql"]) {
  const fp = path.join(DIR, f); if (fs.existsSync(fp)) await loadSqlRepairing(f, fp)
}
const ok = await repairTs()
console.log(ok ? "RESULT: COMPILES" : "RESULT: STILL_FAILING")
