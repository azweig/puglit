/**
 * build-local.mjs — run the WHOLE Puglit pipeline locally and serve a RUNNING app.
 *
 * This is the local equivalent of "deliver to GitHub + CI": small local models generate,
 * then a VERIFY → REPAIR loop (driven by the local code model) guarantees the result
 * actually compiles and the SQL actually loads, then it's served with `next dev`.
 *
 *   1) create a job (the agents do interview→spec→blueprint→routes/pages→3 supervisions)
 *   2) drive /advance to completion (the dev server must be running)
 *   3) pull the generated files from Postgres
 *   4) assemble spine + bespoke files into a runnable project
 *   5) load SQL into a fresh DB, repairing DDL the model got wrong
 *   6) tsc → feed each erroring file + errors back to the model → repeat until green
 *   7) `next dev` and print the link
 *
 * No hand-written product code — every fix is produced by the local model. Glue only.
 *
 * Env: BASE (dev server, default http://localhost:3000), SLUG, PORT (served app, default 4311),
 *      MODEL (default qwen2.5-coder:7b), PG_PORT (5433), MAX_ROUNDS (6), JOB_ID (reuse a job).
 */
import { execSync, spawnSync, spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(process.argv[2] || process.env.PUGLIT_ROOT || "/Users/alvaroz/projects/2026/puglit")
const SPINE = path.join(ROOT, "spine")
const BASE = process.env.BASE || "http://localhost:3000"
const SLUG = process.env.SLUG || "demo-local"
const PORT = process.env.PORT || "4311"
const MODEL = process.env.MODEL || "qwen2.5-coder:7b"
const PG_PORT = process.env.PG_PORT || "5433"
// psql/createdb/dropdb need a password non-interactively (the pod's postgres requires one) —
// otherwise they hang on a "Password:" prompt. Default to the local/pod convention.
process.env.PGPASSWORD = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || "postgres"
const APP_DB = `puglit_app_${SLUG.replace(/[^a-z0-9]/g, "_")}`
const MAX_ROUNDS = parseInt(process.env.MAX_ROUNDS || "6")
const OLLAMA = "http://localhost:11434/api/chat"
// Build DIR lives next to the spine (SAME filesystem) so the node_modules symlink is valid
// for Turbopack (a symlink crossing filesystems — e.g. /tmp → /workspace — makes it panic)
// and we avoid a 300MB node_modules copy (matters when disk is tight).
const DIR = process.env.BUILD_DIR || path.join(ROOT, ".builds", `puglit-${SLUG}`)
// Mac uses Homebrew's keg path; on Linux/the pod psql is already on PATH. Only prepend if it exists.
const PGBIN = process.env.PGBIN || "/opt/homebrew/opt/postgresql@16/bin"
if (fs.existsSync(PGBIN)) process.env.PATH = `${PGBIN}:${process.env.PATH}`

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
const stripFences = (s) => s.replace(/^\s*```[a-z]*\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim()

// ── default idea: a no-login status page (good coherence test) ─────────────────
const IDEA = process.env.IDEA ? JSON.parse(process.env.IDEA) : {
  name: "StatusGlass",
  what: "A public status & incident-history page (like status.claude.com): live component statuses, uptime over 90 days, incident timeline and scheduled maintenance. No login.",
  audience: "Users and customers of an online service who want to see if it's up.",
  benefits: ["Live component status", "90-day uptime history", "Incident timeline", "Scheduled maintenance notices"],
  monetization: "free", price: 0, modules: [], languages: "en", color: "#16A34A", email: "demo@example.com",
  archetype: "status_monitoring",
}

async function ask(system, user, ctx = 8192) {
  // STREAMING: headers arrive immediately, so we're immune to undici's 300s headersTimeout
  // even when a big repair call takes minutes on an 8GB box. NEVER throws — a failed call
  // just skips that fix this round. ctx capped to keep the KV cache feasible locally.
  try {
    const res = await fetch(OLLAMA, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, stream: true, keep_alive: "30m", options: { temperature: 0.1, num_ctx: ctx },
        messages: [{ role: "system", content: system }, { role: "user", content: user }] }) })
    if (!res.ok || !res.body) { log("  ask http", res.status); return "" }
    const reader = res.body.getReader(); const dec = new TextDecoder()
    let buf = "", out = ""
    while (true) {
      const { value, done } = await reader.read(); if (done) break
      buf += dec.decode(value, { stream: true })
      let nl
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl); buf = buf.slice(nl + 1)
        if (!line.trim()) continue
        try { const j = JSON.parse(line); if (j.message?.content) out += j.message.content; if (j.error) log("  ask err:", String(j.error).slice(0, 80)) } catch { /* partial line */ }
      }
    }
    return stripFences(out)
  } catch (e) { log("  ask failed:", String(e.message || e).slice(0, 80)); return "" }
}
function psqlQuery(sql) {
  const r = spawnSync("psql", ["-h", "localhost", "-p", PG_PORT, "-U", "postgres", "-d", "puglit", "-t", "-A", "-c", sql], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
  return r.stdout || ""
}

// ── 1+2. create + drive the job ────────────────────────────────────────────────
async function api(p, method = "GET") {
  const res = await fetch(`${BASE}${p}`, { method, headers: { "Content-Type": "application/json" }, body: method === "POST" ? JSON.stringify(method === "POST" && p.endsWith("/create") ? IDEA : {}) : undefined })
  return res.json()
}
async function createAndDrive() {
  let id = process.env.JOB_ID
  if (!id) {
    const created = await fetch(`${BASE}/api/job/create`, { method: "POST", headers: { "Content-Type": "application/json", "x-puglit-service": process.env.PUGLIT_SERVICE_TOKEN || "puglit-local-service" }, body: JSON.stringify({ ...IDEA }) }).then((r) => r.json())
    if (!created.id) throw new Error("create failed: " + JSON.stringify(created))
    id = created.id
  }
  // already finished? skip driving.
  const st = psqlQuery(`SELECT status FROM puglit_jobs WHERE id='${id}'`).trim()
  if (st === "done") { log(`job ${id} ya está done`); return id }
  log(`job ${id} — generando (agentes locales)…`)
  const t0 = Date.now()
  for (let i = 0; i < 400; i++) {
    let job
    try { job = await fetch(`${BASE}/api/job/${id}/advance`, { method: "POST", headers: { "x-puglit-service": process.env.PUGLIT_SERVICE_TOKEN || "puglit-local-service" } }).then((r) => r.json()) } catch { await new Promise((r) => setTimeout(r, 1500)); continue }
    const run = (job.steps || []).find((s) => s.status === "running")
    const done = (job.steps || []).filter((s) => s.status === "done").length
    const total = (job.steps || []).length
    const mins = ((Date.now() - t0) / 60000).toFixed(1)
    log(`  ${mins}m ${done}/${total} ${run ? run.key + ' · ' + (run.detail || '') : job.status}`)
    if (job.status === "done" || job.status === "error") { log(`job ${job.status} en ${mins}m`); break }
  }
  return id
}

// ── 3. pull generated files from Postgres ──────────────────────────────────────
function pullArtifacts(id) {
  const raw = psqlQuery(`SELECT json_build_object('config',config,'artifacts',artifacts)::text FROM puglit_jobs WHERE id='${id}'`)
  const row = JSON.parse(raw.trim())
  const a = row.artifacts || {}
  return { config: row.config, appFiles: a.appFiles || [], sql: a.sql || "", seedSql: a.seedSql || "", blueprint: a.blueprint || {} }
}

// ── 4. assemble spine + bespoke into a runnable project ────────────────────────
const SPINE_DROP = ["app/page.tsx", "app/login", "app/register", "app/app/page.tsx", "app/app/[entity]", "app/app/account", "app/app/layout.tsx", "components/Mark.tsx", "components/AppSidebar.tsx", "components/EntityManager.tsx", "components/AuthShell.tsx", "components/Landing.tsx", "domain.config.ts"]
function configToTs(config) {
  return `export * from "./domain-types"\nimport type { DomainConfig } from "./domain-types"\nconst config: DomainConfig = ${JSON.stringify(config, null, 2)}\nexport default config\n`
}
/** Deterministic spine-import fixer: small models use pool/getAuthUser/NextResponse without
 *  importing them (→ ReferenceError 500s tsc can miss). Prepend any missing spine import. */
function ensureSpineImports(code, rel) {
  if (!/\.(ts|tsx)$/.test(rel)) return code
  const adds = []
  const uses = (re) => re.test(code)
  const imported = (sym, from) => new RegExp(`import\\s*\\{[^}]*\\b${sym}\\b[^}]*\\}\\s*from\\s*["']${from.replace(/[/]/g, "\\/")}["']`).test(code)
  if (uses(/\bpool\b/) && !imported("pool", "@/lib/db")) adds.push(`import { pool } from "@/lib/db"`)
  if (uses(/\bgetAuthUser\b/) && !imported("getAuthUser", "@/lib/auth")) adds.push(`import { getAuthUser } from "@/lib/auth"`)
  const srv = []
  if (uses(/\bNextResponse\b/) && !imported("NextResponse", "next/server")) srv.push("NextResponse")
  if (uses(/\bNextRequest\b/) && !imported("NextRequest", "next/server")) srv.push("NextRequest")
  if (srv.length) adds.push(`import { ${srv.join(", ")} } from "next/server"`)
  if (!adds.length) return code
  // insert after a leading "use client" directive if present
  const m = code.match(/^\s*["']use client["'];?\s*\n/)
  if (m) return m[0] + adds.join("\n") + "\n" + code.slice(m[0].length)
  return adds.join("\n") + "\n" + code
}
function assemble({ config, appFiles, sql, seedSql }) {
  execSync(`rm -rf ${DIR} && mkdir -p ${DIR}`)
  // copy spine app (exclude node_modules + the dropped template surfaces)
  execSync(`rsync -a --exclude node_modules ${SPINE}/ ${DIR}/`)
  for (const d of SPINE_DROP) execSync(`rm -rf ${path.join(DIR, d)}`)
  // node_modules: symlink to the spine's. DIR is on the SAME filesystem as the spine now, so
  // Turbopack accepts the symlink (it only rejects symlinks that cross filesystems) — instant,
  // no 300MB copy, no disk pressure. APFS clonefile on Mac as a nicer alternative if it works.
  fs.rmSync(path.join(DIR, "node_modules"), { recursive: true, force: true })
  try { execSync(`cp -Rc ${SPINE}/node_modules ${DIR}/node_modules 2>/dev/null`) }
  catch { fs.symlinkSync(path.join(SPINE, "node_modules"), path.join(DIR, "node_modules"), "dir") }
  // spine SQL migrations
  execSync(`mkdir -p ${path.join(DIR, "sql")}`)
  for (const f of ["001_core.sql", "002_auth.sql", "003_records.sql"]) {
    const src = path.join(SPINE, "scripts/sql", f); if (fs.existsSync(src)) fs.copyFileSync(src, path.join(DIR, "sql", f))
  }
  // user config
  fs.writeFileSync(path.join(DIR, "domain.config.ts"), configToTs(config))
  // bespoke files (override spine on collision) + DETERMINISTIC spine-import fix
  let count = 0
  for (const f of appFiles) {
    if (!f?.path || !f?.content) continue
    const fp = path.join(DIR, f.path)
    fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp, ensureSpineImports(f.content, f.path)); count++
  }
  // ensure a bespoke schema + seed exist as sql/app.sql + sql/seed.sql
  if (!fs.existsSync(path.join(DIR, "sql/app.sql")) && sql) fs.writeFileSync(path.join(DIR, "sql/app.sql"), sql)
  if (!fs.existsSync(path.join(DIR, "sql/seed.sql")) && seedSql) fs.writeFileSync(path.join(DIR, "sql/seed.sql"), seedSql)
  log(`ensamblado ${DIR} — ${count} archivos bespoke`)
}

// ── 5. SQL: load into a FRESH DB each attempt (spine→app→seed), repair on failure ──
function psqlFile(db, file) {
  return spawnSync("psql", ["-h", "localhost", "-p", PG_PORT, "-U", "postgres", "-d", db, "-v", "ON_ERROR_STOP=1", "-f", file], { encoding: "utf8" })
}
function resetDb() {
  try { execSync(`dropdb -h localhost -p ${PG_PORT} -U postgres --if-exists ${APP_DB} && createdb -h localhost -p ${PG_PORT} -U postgres ${APP_DB}`, { stdio: "ignore" }) } catch {}
  for (const f of ["001_core.sql", "002_auth.sql", "003_records.sql"]) {
    const fp = path.join(DIR, "sql", f); if (fs.existsSync(fp)) psqlFile(APP_DB, fp) // spine migrations assumed valid
  }
}
const SQL_FIX_SYS = "You fix a PostgreSQL script so it loads cleanly. Return ONLY the full corrected SQL — no prose, no markdown. Rules: define every table BEFORE it is referenced (dependency order); NO inline ENUM(...) on a column (use TEXT + CHECK); no trailing commas; valid Postgres types; remove columns/FKs that reference tables that don't exist; keep it consistent with the product (a status page: components, statuses, incidents, uptime — NOT unrelated domains)."
/** Load app.sql then seed.sql against a fresh DB; repair whichever fails, looping. */
async function loadAppSchemaRepairing() {
  const appF = path.join(DIR, "sql", "app.sql"), seedF = path.join(DIR, "sql", "seed.sql")
  for (let r = 1; r <= 5; r++) {
    resetDb()
    if (fs.existsSync(appF)) {
      const a = psqlFile(APP_DB, appF)
      if (a.status !== 0) {
        const err = (a.stderr || "").slice(0, 500); log(`SQL app.sql error (${r}): ${err.split("\n").find((l) => /ERROR/.test(l)) || err.split("\n")[0]}`)
        const fixed = await ask(SQL_FIX_SYS, `psql error:\n${err}\n\n--- app.sql ---\n${fs.readFileSync(appF, "utf8")}`, 8192)
        if (fixed.length > 30) fs.writeFileSync(appF, fixed)
        continue
      }
    }
    if (fs.existsSync(seedF)) {
      const s = psqlFile(APP_DB, seedF)
      if (s.status !== 0) {
        const err = (s.stderr || "").slice(0, 500); log(`SQL seed.sql error (${r}): ${err.split("\n").find((l) => /ERROR/.test(l)) || err.split("\n")[0]}`)
        const fixed = await ask(SQL_FIX_SYS + " This is SEED data — INSERTs must match the schema's exact table & column names.", `psql error:\n${err}\n\n--- schema (app.sql) ---\n${fs.readFileSync(appF, "utf8").slice(0, 4000)}\n\n--- seed.sql ---\n${fs.readFileSync(seedF, "utf8")}`, 8192)
        if (fixed.length > 30) fs.writeFileSync(seedF, fixed)
        continue
      }
    }
    log("SQL: app.sql + seed.sql cargan ✓"); return true
  }
  log("SQL: no converge tras reintentos (sigo, la app puede correr con tablas parciales)"); return false
}

// ── 6. tsc: compile, repair erroring files, loop ───────────────────────────────
function tscErrors() {
  const out = spawnSync("npx", ["tsc", "--noEmit"], { cwd: DIR, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })
  const byFile = new Map()
  for (const ln of ((out.stdout || "") + (out.stderr || "")).split("\n")) {
    const m = ln.match(/^(.+?\.tsx?)\((\d+),(\d+)\): error (TS\d+): (.+)$/)
    if (!m) continue
    if (!byFile.has(m[1])) byFile.set(m[1], [])
    byFile.get(m[1]).push(`L${m[2]}: ${m[4]} ${m[5]}`)
  }
  return byFile
}
function ensureUseClient(code) {
  const hasHook = /\b(useState|useEffect|useRouter|usePathname|useParams|useMemo|useRef)\b/.test(code)
  const c = code.replace(/^\s*["']use client["'];?\s*/i, "")
  return hasHook ? '"use client";\n' + c : c
}
const totalErrs = (m) => [...m.values()].reduce((n, l) => n + l.length, 0)
async function repairTs() {
  // Anti-oscillation: keep the BEST-seen snapshot (fewest errors) of every file that ever
  // errored, and stop early if N rounds bring no improvement — then restore the best.
  const tracked = new Set(), best = new Map()
  let bestTotal = Infinity, stale = 0
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const errs = tscErrors()
    const total = totalErrs(errs)
    for (const rel of errs.keys()) tracked.add(rel)
    if (errs.size === 0) { log(`tsc: COMPILA ✓ (ronda ${round})`); return true }
    if (total < bestTotal) { // new best → snapshot every tracked file's current content
      bestTotal = total; stale = 0; best.clear()
      for (const rel of tracked) { const fp = path.join(DIR, rel); if (fs.existsSync(fp)) best.set(rel, fs.readFileSync(fp, "utf8")) }
    } else { stale++ }
    log(`tsc ronda ${round}: ${errs.size} archivos · ${total} errores (best ${bestTotal})`)
    if (stale >= 2) { log("tsc: sin mejora en 2 rondas → restauro el mejor y paro"); break }
    for (const [rel, list] of errs) {
      const fp = path.join(DIR, rel); if (!fs.existsSync(fp)) continue
      const cur = fs.readFileSync(fp, "utf8")
      const isTsx = rel.endsWith(".tsx")
      const sys = `You fix ONE file in a Next.js 16 App Router + TypeScript + raw 'pg' project. Return ONLY the full corrected file — no prose, no fences. Make the MINIMAL change that clears the listed errors; do NOT rewrite working parts. Import only from "next/*", "react", "@/lib/*", "@/domain.config". Add NO npm deps. ${isTsx ? 'If it uses hooks it MUST start with "use client"; ALL hooks/JSX live INSIDE one default-exported component; import every hook from "react".' : 'Route handlers MUST `export async function GET/POST(req: Request)`; `import { NextResponse } from "next/server"`; DB via `import { pool } from "@/lib/db"` (parameterized).'}`
      const fixed = await ask(sys, `tsc errors:\n${list.join("\n")}\n\n--- ${rel} ---\n${cur}`, 8192)
      if (fixed.length > 40) { fs.writeFileSync(fp, isTsx ? ensureUseClient(fixed) : fixed); log(`  fix → ${rel} (${list.length} err)`) }
    }
  }
  // restore best-seen if the final state is worse
  const finalTotal = totalErrs(tscErrors())
  if (finalTotal > bestTotal && best.size) { for (const [rel, content] of best) fs.writeFileSync(path.join(DIR, rel), content); log(`tsc: restaurado best (${bestTotal} errores)`) }
  const left = tscErrors()
  log(left.size === 0 ? "tsc: COMPILA ✓" : `tsc: quedan ${totalErrs(left)} errores en ${left.size} archivos (best-effort)`)
  return left.size === 0
}

// ── run ────────────────────────────────────────────────────────────────────────
const id = await createAndDrive()
const art = pullArtifacts(id)
log(`artefactos: ${art.appFiles.length} archivos · ${(art.blueprint.tables || []).length} tablas`)
if (!art.appFiles.length) { log("sin appFiles — el engine no produjo nada; abortando"); process.exit(1) }
assemble(art)
await loadAppSchemaRepairing()
const ok = await repairTs().catch((e) => { log("repairTs error:", String(e.message || e).slice(0, 80)); return false })
// write the app's DB env so it talks to the loaded schema
fs.writeFileSync(path.join(DIR, ".env.local"), `POSTGRES_HOST=localhost\nPOSTGRES_PORT=${PG_PORT}\nPOSTGRES_DB=${APP_DB}\nPOSTGRES_USER=postgres\nPOSTGRES_PASSWORD=postgres\nPOSTGRES_SSL=disable\nPUGLIT_PROVIDER=ollama\n`)
log(ok ? "RESULT: COMPILES ✓" : "RESULT: still failing (serving anyway)")

// BYO deploy to the USER's own GitHub (+ optional Vercel), if tokens are present. Tokens
// come from env, are passed straight to infra/deploy.sh, and are NEVER persisted.
const STATUS = process.env.EXPORT_STATUS_FILE // set by the "Compilar y exportar" endpoint
const writeStatus = (o) => { if (STATUS) try { fs.writeFileSync(STATUS, JSON.stringify(o)) } catch {} }
if (process.env.GH_TOKEN || process.env.VERCEL_TOKEN) {
  log("deploy BYO (a tu cuenta)…")
  writeStatus({ status: "deploying", compiles: ok })
  const dep = spawnSync("bash", [path.join(ROOT, "infra/deploy.sh"), DIR, `puglit-${process.env.EXPORT_REPO || SLUG}`], { encoding: "utf8", env: { ...process.env } })
  const out = (dep.stdout || "") + (dep.stderr || ""); console.log(out)
  const githubUrl = (out.match(/GitHub:\s*(https:\/\/\S+)/) || [])[1] || null
  const vercelUrl = (out.match(/Vercel:\s*(https:\/\/\S+)/) || [])[1] || null
  writeStatus({ status: "done", compiles: ok, githubUrl, vercelUrl })
  log(`export listo · github=${githubUrl || "-"} · vercel=${vercelUrl || "-"}`)
}

// EXPORT_ONLY: compile + export, then exit (no preview server). Used by the browser button.
if (process.env.EXPORT_ONLY) { if (!process.env.GH_TOKEN && !process.env.VERCEL_TOKEN) writeStatus({ status: "done", compiles: ok, note: "sin tokens — nada que exportar" }); process.exit(0) }

log(`sirviendo preview en http://localhost:${PORT} …`)
const srv = spawn("npx", ["next", "dev", "-p", PORT], { cwd: DIR, stdio: "inherit", env: { ...process.env } })
process.on("SIGINT", () => { srv.kill(); process.exit(0) })
