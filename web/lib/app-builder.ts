/**
 * Puglit web — app-builder.ts
 * The bespoke-app generation swarm (AGENTS.md: Domain Architect → Backend/Frontend
 * swarms). Where genVerifiedEngine() emits ONE route, this derives the product's
 * REAL functional shape from the idea+config — a blueprint of tables, API
 * operations and UI surfaces — then specialized agents emit each as a real,
 * working file. Generalizable: nothing here is hardcoded to a specific product;
 * the blueprint agent infers the surfaces/operations from the entities and pitch.
 *
 * Hard constraints baked into every prompt (the spine's actual capabilities):
 *  - No external npm deps. Only: next, react, pg (via @/lib/db pool), the spine libs.
 *  - Auth is the spine's: getAuthUser(request) → {userId:number}; register/login exist.
 *  - Realtime = polling (no websockets in the spine).
 *  - Images = data: URLs or external URLs stored in TEXT (no object storage).
 *  - Postgres via pool.query(text, params) — parameterized only.
 */
import { chatJSON } from "@/lib/openai"
import type { DomainConfig } from "@/lib/domain-types"

export interface AppFile { path: string; content: string }
export interface TableSpec { name: string; ddl: string }
export interface RouteSpec { path: string; methods: string[]; purpose: string; logic: string }
export interface PageSpec { route: string; file: string; title: string; behavior: string }
export interface Blueprint {
  tables: TableSpec[]
  routes: RouteSpec[]
  pages: PageSpec[]
  nav: { label: string; href: string }[]
  summary: string
}

const SPINE_API = `SPINE API you MUST build on (do not reinvent, do not import anything else):
- Auth (already implemented, reuse): POST /api/auth/register {email,password,name,profile?} ; POST /api/auth/login {email,password} ; GET /api/auth/me ; POST /api/auth/logout. Extra signup fields (city, lastName, etc.) go inside \`profile\` (JSONB).
- In route handlers: import { getAuthUser } from "@/lib/auth"; const u = await getAuthUser(request); if(!u) return NextResponse.json({error:"unauthorized"},{status:401}); use u.userId (number).
- SQL: import { pool } from "@/lib/db"; const { rows } = await pool.query("SELECT ... WHERE x=$1", [v]); PARAMETERIZED ONLY.
- Email (optional): import { sendEmail } from "@/lib/mailer".
- Config: import config from "@/domain.config".
- Tables you create live in sql/app.sql; reference users(id). Assume they exist at runtime.`

const RULES = `HARD RULES:
- Next.js 16 App Router, TypeScript strict. No \`any\` without a reason; type function params.
- NO external npm packages (no framer-motion, no swr, no axios, no uuid, no zod). Only React + fetch + the spine.
- Client pages start with "use client". Use Tailwind classes for styling. Mobile-first.
- Realtime/chat = poll with setInterval(fetch, 2500) + clearInterval on unmount. No websockets.
- Image upload = <input type="file"> → FileReader.readAsDataURL → send the data: URL string; store in a TEXT column. No S3/blob storage.
- Every route handler: export async function GET/POST/etc(request: NextRequest). import { NextRequest, NextResponse } from "next/server".
- Never reference a variable/import that you do not define. Code must compile with \`tsc --noEmit\`.`

/** Domain Architect: infer the product's functional blueprint from the idea+config. */
export async function planBlueprint(config: DomainConfig, contracts: string): Promise<Blueprint> {
  const ents = (config.entities || []).map((e) => `${e.name}(${e.fields.map((f) => `${f.name}:${f.type}${f.required ? "!" : ""}`).join(", ")})`).join("; ")
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : JSON.stringify(config.identity.tagline)
  const out = (await chatJSON([
    { role: "system", content: `You are the Domain Architect for an app generator. Given a product idea, design the COMPLETE functional blueprint of its core experience: the database tables, the API operations, and the UI pages a real user needs to ACTUALLY USE the product end-to-end (not a generic CRUD admin).

Think hard about the real user journeys. Examples of inference:
- A Tinder-style used-goods marketplace ⇒ tables: items (owner, title, description, photo TEXT for data-url, city, status), swipes (user_id, item_id, liked), matches (user_a, user_b, item_a, item_b), messages (match_id, sender_id, body). Operations: publish item, get a swipe feed (others' items not yet swiped), record a swipe and DETECT a mutual match (when the owner of the liked item has also liked one of my items → create a match referencing both items), list my matches, send/list messages scoped to a match. Pages: feed/swipe (home), publish, matches list, chat per match. Anonymous: never expose email between users; show only first name/alias.

Return ONLY JSON:
{
 "summary": "one paragraph of the core experience",
 "tables": [{"name":"items","ddl":"CREATE TABLE IF NOT EXISTS items (\\n  id BIGSERIAL PRIMARY KEY,\\n  ...,\\n  created_at TIMESTAMPTZ DEFAULT NOW()\\n);"}],
 "routes": [{"path":"app/api/feed/route.ts","methods":["GET"],"purpose":"...","logic":"precise step-by-step of the SQL and rules, incl. exact tables/columns and the mutual-match detection where relevant"}],
 "pages": [{"route":"/app","file":"app/app/page.tsx","title":"Descubrir","behavior":"precise description: what it fetches, the interactions (swipe buttons/keys), what each action calls"}],
 "nav": [{"label":"Descubrir","href":"/app"}]
}

Constraints: ${RULES}
${SPINE_API}

COMPLETENESS (CRITICAL — generators die here; never ship a read-only app):
- For EVERY kind of user-generated content (items a user publishes, a message a user sends), include BOTH a CREATE route (POST) AND a UI page/form to create it. Anything listable must be creatable.
- Any feed/list is fed by one of your CREATE routes. Trace each journey end-to-end: every step maps to a route AND a page; add whatever is missing.
- Messaging/chat MUST have POST (send) and GET (list), BOTH scoped to the conversation's participants (verify the caller belongs to the match before reading/writing).
- A swipe/like route must DETECT the mutual condition and create the match atomically.

Make tables, routes and pages mutually consistent (same table/column names everywhere). Keep it focused: 4-6 tables, 5-8 routes, 4-6 pages, and ALWAYS include a publish/create page when users contribute content. The home page route is "/app" (file app/app/page.tsx) and is the product's MAIN screen, not a generic dashboard. Use the product's language for UI labels.` },
    { role: "user", content: `Product: ${config.identity.name}\nPitch: ${tagline}\nLanguages: ${(config.identity.languages || ["es"]).join(",")}\nEntities (hints, refine freely): ${ents}\n\nCONTRACTS:\n${contracts}` },
  ], { model: "gpt-4o", temperature: 0.3 })) as Partial<Blueprint>

  return {
    summary: out.summary || "",
    tables: Array.isArray(out.tables) ? out.tables.filter((t) => t?.name && t?.ddl) : [],
    routes: Array.isArray(out.routes) ? out.routes.filter((r) => r?.path && r?.logic) : [],
    pages: Array.isArray(out.pages) ? out.pages.filter((p) => p?.file && p?.behavior) : [],
    nav: Array.isArray(out.nav) ? out.nav : [],
  }
}

function tablesDoc(bp: Blueprint): string {
  return bp.tables.map((t) => t.ddl).join("\n\n")
}

interface RouteFile { path: string; methods: Set<string>; specs: { methods: string[]; purpose: string; logic: string }[] }

/** Coerce any LLM-proposed route path to a VALID Next App Router handler path:
 *  always `app/api/<segments>/route.ts` (drops bad filenames like /create.ts). */
function canonicalRoutePath(p: string): string {
  let x = String(p || "").replace(/\\/g, "/").trim()
  x = x.replace(/^\/+/, "")
  if (!x.startsWith("app/")) x = "app/" + x.replace(/^app\//, "")
  if (!x.startsWith("app/api/")) x = "app/api/" + x.slice("app/".length).replace(/^api\//, "")
  x = x.replace(/\/[^/]*\.tsx?$/, "")        // drop any trailing filename (route.ts, create.ts, …)
  x = x.replace(/\/+$/, "")
  return `${x}/route.ts`
}

/** Group operations by canonical file so ONE route.ts implements all its methods. */
function groupRoutes(routes: RouteSpec[]): RouteFile[] {
  const byFile = new Map<string, RouteFile>()
  for (const r of routes) {
    const path = canonicalRoutePath(r.path)
    const methods = (r.methods?.length ? r.methods : ["GET"]).map((m) => m.toUpperCase())
    const rf = byFile.get(path) || { path, methods: new Set<string>(), specs: [] }
    methods.forEach((m) => rf.methods.add(m))
    rf.specs.push({ methods, purpose: r.purpose, logic: r.logic })
    byFile.set(path, rf)
  }
  return [...byFile.values()]
}

/** Backend swarm: one agent per route FILE → a real handler implementing ALL its methods. */
async function genRouteFile(config: DomainConfig, bp: Blueprint, rf: RouteFile): Promise<AppFile | null> {
  const ops = rf.specs.map((s) => `• ${s.methods.join("/")} — ${s.purpose}\n  Logic: ${s.logic}`).join("\n")
  const out = (await chatJSON([
    { role: "system", content: `You are a Backend Engineer. Write ONE Next.js 16 App Router route handler file at ${rf.path} implementing ALL the listed HTTP methods with REAL, working logic (no TODOs, no stubs). It must compile under tsc --noEmit.

${RULES}
${SPINE_API}

ROUTE COMPLETENESS:
- Export one handler per method needed: ${[...rf.methods].join(", ")} (e.g. export async function GET(...) / POST(...)).
- If this resource is a COLLECTION the UI both reads and writes (messages, comments, items, posts…), implement BOTH a GET (list/read, scoped to the caller's permission) AND a POST (create). Reads/writes touching another user's conversation/match MUST be scoped (verify the caller is a participant first).
- Read params for GET from new URL(request.url).searchParams; read JSON body for POST/PUT/PATCH via await request.json().

DATABASE TABLES (already created — use these EXACT names/columns):
${tablesDoc(bp)}

Return ONLY JSON: {"code":"<the full contents of ${rf.path}>"}` },
    { role: "user", content: `File: ${rf.path}\nMethods to implement: ${[...rf.methods].join(", ")}\nOperations:\n${ops}` },
  ], { model: "gpt-4o", temperature: 0.2 })) as { code?: string }
  return out.code ? { path: rf.path, content: String(out.code).slice(0, 30_000) } : null
}

/** Frontend swarm: one agent per surface → a real Next page. */
async function genPage(config: DomainConfig, bp: Blueprint, p: PageSpec): Promise<AppFile | null> {
  const routeList = groupRoutes(bp.routes).map((rf) => `${[...rf.methods].join("/")} ${rf.path.replace(/^app/, "").replace(/\/route\.ts$/, "")} — ${rf.specs.map((s) => s.purpose).join("; ")}`).join("\n")
  const out = (await chatJSON([
    { role: "system", content: `You are a Frontend Engineer. Write ONE Next.js 16 page (App Router) implementing this surface with REAL interactivity (no placeholder copy, no TODOs). It must compile under tsc --noEmit and work against the listed APIs.

${RULES}

AVAILABLE APIs (call these with fetch):
${routeList}

UI: clean, mobile-first, Tailwind. Use the brand color var(--brand) where useful. Product language for all copy. Handle loading/empty/error states. For lists, fetch on mount with useEffect. For chat, poll every 2500ms.

Return ONLY JSON: {"code":"<the full contents of ${p.file}>"}` },
    { role: "user", content: `File: ${p.file}\nRoute: ${p.route}\nTitle: ${p.title}\nBehavior to implement EXACTLY:\n${p.behavior}\n\nProduct: ${config.identity.name}. Nav between screens: ${bp.nav.map((n) => `${n.label}→${n.href}`).join(", ")}.` },
  ], { model: "gpt-4o", temperature: 0.3 })) as { code?: string }
  return out.code ? { path: p.file, content: String(out.code).slice(0, 30_000) } : null
}

/** Shared nav component so generated pages can link between surfaces. */
function navComponent(bp: Blueprint): AppFile {
  const items = bp.nav.length ? bp.nav : [{ label: "Inicio", href: "/app" }]
  const links = items.map((n) => `{ label: ${JSON.stringify(n.label)}, href: ${JSON.stringify(n.href)} }`).join(", ")
  return {
    path: "components/AppNav.tsx",
    content: `"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const ITEMS = [${links}]

export default function AppNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-around border-t border-black/10 bg-white/90 backdrop-blur py-2 md:static md:justify-start md:gap-2 md:border-0 md:bg-transparent md:py-4">
      {ITEMS.map((it) => {
        const active = path === it.href || (it.href !== "/app" && path.startsWith(it.href))
        return (
          <Link key={it.href} href={it.href} className={\`px-4 py-2 rounded-xl text-sm font-semibold \${active ? "text-white" : "text-black/60 hover:text-black"}\`} style={active ? { background: "var(--brand, #7C3AED)" } : undefined}>
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
`,
  }
}

/** Deterministic app shell: client-side auth guard + the bespoke pages' nav.
 *  Overrides the spine's generic entity-sidebar dashboard shell. */
function appShell(config: DomainConfig): AppFile {
  return {
    path: "app/app/layout.tsx",
    content: `"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppNav from "@/components/AppNav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let alive = true
    fetch("/api/auth/me").then((r) => {
      if (!alive) return
      if (r.ok) setOk(true); else router.replace("/login")
    }).catch(() => router.replace("/login"))
    return () => { alive = false }
  }, [router])
  if (!ok) return <div className="min-h-screen grid place-items-center text-black/40">…</div>
  return (
    <div className="min-h-screen pb-20 md:pb-0 md:flex md:flex-col">
      <header className="hidden md:block border-b border-black/10"><div className="max-w-3xl mx-auto px-4"><AppNav /></div></header>
      <main className="max-w-3xl mx-auto w-full px-4 py-5 flex-1">{children}</main>
      <div className="md:hidden"><AppNav /></div>
    </div>
  )
}
`,
  }
}

/** Completeness Critic (LLM): find journey steps that break (content listable but
 *  not creatable, chat readable but not sendable, unscoped reads) → missing pieces. */
async function critiqueBlueprint(config: DomainConfig, bp: Blueprint): Promise<{ addRoutes: RouteSpec[]; addPages: PageSpec[] }> {
  const summary = { tables: bp.tables.map((t) => t.name), routes: bp.routes.map((r) => ({ path: r.path, methods: r.methods, purpose: r.purpose })), pages: bp.pages.map((p) => ({ route: p.route, title: p.title })) }
  try {
    const out = (await chatJSON([
      { role: "system", content: `You are the Completeness Critic. Find every place a real user journey BREAKS because something is missing, and return ONLY the missing pieces.
Check: a CREATE (POST) route AND a create page for every user-generated content type? chat with BOTH send (POST) and list (GET), each scoped to participants? every route reachable from a page, every page's routes present?
Return ONLY JSON: {"addRoutes":[{"path":"app/api/.../route.ts","methods":["POST"],"purpose":"...","logic":"precise SQL + scoping, exact tables/columns"}],"addPages":[{"route":"/app/...","file":"app/app/.../page.tsx","title":"...","behavior":"precise behavior + which routes it calls"}]}. Same table/column names as the blueprint. Empty arrays if complete. No duplicates of existing routes/pages.
DB tables:\n${tablesDoc(bp)}\n\n${SPINE_API}` },
      { role: "user", content: `Product: ${config.identity.name}\nBlueprint:\n${JSON.stringify(summary, null, 1)}\n\nRoute logic:\n${bp.routes.map((r) => `${r.path}: ${r.logic}`).join("\n")}` },
    ], { model: "gpt-4o", temperature: 0.2 })) as { addRoutes?: RouteSpec[]; addPages?: PageSpec[] }
    const haveR = new Set(bp.routes.map((r) => r.path)), haveP = new Set(bp.pages.map((p) => p.file))
    return {
      addRoutes: (Array.isArray(out.addRoutes) ? out.addRoutes : []).filter((r) => r?.path && r?.logic && !haveR.has(r.path)),
      addPages: (Array.isArray(out.addPages) ? out.addPages : []).filter((p) => p?.file && p?.behavior && !haveP.has(p.file)),
    }
  } catch { return { addRoutes: [], addPages: [] } }
}

/** NOT NULL, user-fillable columns of a table (for auto-generated create forms). */
function fillableCols(ddl: string): string[] {
  const cols: string[] = []
  for (const line of ddl.split("\n")) {
    const m = line.match(/^\s*([a-z_]+)\s+[A-Za-z].*\bNOT NULL\b/i)
    if (m && !/PRIMARY KEY|REFERENCES/i.test(line)) {
      const c = m[1].toLowerCase()
      if (!["id", "owner_id", "user_id", "created_at", "updated_at"].includes(c)) cols.push(c)
    }
  }
  return cols
}

/** DETERMINISTIC completeness backstop (don't trust the LLM critic for this): every
 *  user-published content table (has an owner_id) MUST be creatable — guarantee a
 *  POST/GET route + a create page + nav, unless one already exists. Generalizable. */
function ensureContentCreation(bp: Blueprint): void {
  const SYSTEM = new Set(["users", "auth_tokens", "page_visits", "analytics_events", "records", "sessions"])
  for (const t of bp.tables) {
    if (SYSTEM.has(t.name) || !/\bowner_id\b/i.test(t.ddl)) continue
    const created = bp.routes.some((r) =>
      new RegExp(`insert\\s+into\\s+${t.name}\\b`, "i").test(r.logic) ||
      (r.methods.map((m) => m.toUpperCase()).includes("POST") && new RegExp(`/${t.name}s?(/|$)`).test(r.path)))
    if (created) continue
    const cols = fillableCols(t.ddl)
    const colList = cols.join(", ") || "title"
    bp.routes.push({
      path: `app/api/${t.name}/route.ts`,
      methods: ["POST", "GET"],
      purpose: `Publicar y listar ${t.name}`,
      logic: `POST: read the JSON body {${colList}}; INSERT INTO ${t.name} (owner_id, ${colList}) VALUES (u.userId, ...) RETURNING id; return the new row. GET: return rows WHERE owner_id=$1 (the caller's own ${t.name}), newest first.`,
    })
    bp.pages.push({
      route: "/app/publicar",
      file: "app/app/publicar/page.tsx",
      title: "Publicar",
      behavior: `A form to publish a ${t.name} with fields: ${colList}. For any image/photo field use <input type="file"> → FileReader.readAsDataURL → submit the resulting data: URL string. POST the JSON to /api/${t.name}. Show validation + a success state, then navigate to /app (the feed).`,
    })
    if (!bp.nav.some((n) => n.href === "/app/publicar")) bp.nav.push({ label: "Publicar", href: "/app/publicar" })
  }
}

/** Reliability pass: harden ONE generated route against the THREE runtime bugs the
 *  compiler can't catch — (1) SQL referencing columns/tables not in the schema
 *  (hallucinated is_active/sent_at/status; wrong ORDER BY column), (2) reads/writes
 *  of another user's conversation not scoped to participants, (3) feeds not
 *  excluding the caller's own rows. Returns the corrected file (or the original). */
async function hardenRoute(file: AppFile, schemaSql: string): Promise<AppFile> {
  try {
    const out = (await chatJSON([
      { role: "system", content: `You are a Reliability Engineer reviewing ONE Next.js route file for RUNTIME-fatal bugs the TypeScript compiler does NOT catch. Fix ONLY these, minimally; keep everything else identical:

1. SCHEMA CONFORMANCE: every table and column the SQL references MUST exist in the schema below. If a column is invented (e.g. is_active, status, updated_at, sent_at vs created_at), map it to the REAL column or remove that clause. ORDER BY must use a column that exists (use the table's actual timestamp column). This is the #1 bug — check every SELECT/INSERT/UPDATE/WHERE/ORDER BY against the schema.
2. SCOPING: if the route reads OR writes rows belonging to a conversation/match/thread between users, it MUST first verify the caller is a participant (e.g. SELECT 1 FROM matches WHERE id=$1 AND (user_a=$2 OR user_b=$2)) and return 403 if not — for BOTH GET and POST.
3. FEED/DISCOVERY: a list meant to show OTHER users' content must exclude the caller's own rows (… AND owner_id <> $1) and rows already acted on.

THE SCHEMA (authoritative — these are the only tables/columns that exist):
${schemaSql}

Return ONLY JSON {"code":"<full corrected file>"}. If nothing needs fixing, return the file unchanged.` },
      { role: "user", content: `File ${file.path}:\n${file.content}` },
    ], { model: "gpt-4o", temperature: 0.1 })) as { code?: string }
    return out.code && out.code.length > 40 ? { path: file.path, content: String(out.code).slice(0, 30_000) } : file
  } catch { return file }
}

/** Orchestrate the swarm: blueprint → tables + routes (parallel) + pages (parallel). */
export async function buildBespokeApp(config: DomainConfig, contracts: string): Promise<{ files: AppFile[]; blueprint: Blueprint }> {
  const blueprint = await planBlueprint(config, contracts)
  if (!blueprint.routes.length && !blueprint.pages.length) return { files: [], blueprint }

  // Completeness: LLM critic + DETERMINISTIC backstop (the critic alone is unreliable;
  // the backstop GUARANTEES every user-published content table is creatable).
  const gaps = await critiqueBlueprint(config, blueprint)
  blueprint.routes.push(...gaps.addRoutes)
  blueprint.pages.push(...gaps.addPages)
  ensureContentCreation(blueprint)

  const routeFiles = groupRoutes(blueprint.routes)
  // dedupe pages by file (keep first)
  const seenPages = new Set<string>()
  const pages = blueprint.pages.filter((p) => (seenPages.has(p.file) ? false : seenPages.add(p.file)))
  blueprint.pages = pages

  const schemaSql = blueprint.tables.map((t) => t.ddl).join("\n\n")
  const [routeOut, pageOut] = await Promise.all([
    // generate each route, then HARDEN it against schema-drift/scoping/feed bugs
    Promise.all(routeFiles.map((rf) => genRouteFile(config, blueprint, rf).then((f) => (f ? hardenRoute(f, schemaSql) : null)).catch(() => null))),
    Promise.all(pages.map((p) => genPage(config, blueprint, p).catch(() => null))),
  ])

  const files: AppFile[] = []
  if (schemaSql) files.push({ path: "sql/app.sql", content: `-- ${config.identity.name} — bespoke app schema (run after the spine's 001/002/003).\n\n${schemaSql}\n` })
  for (const f of [...routeOut, ...pageOut]) if (f) files.push(f)
  files.push(navComponent(blueprint))
  files.push(appShell(config))
  return { files, blueprint }
}
