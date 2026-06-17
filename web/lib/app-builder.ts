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

Make tables, routes and pages mutually consistent (same table/column names everywhere). Keep it focused: 3-6 tables, 4-7 routes, 3-5 pages. The home page route is "/app" (file app/app/page.tsx) and is the product's MAIN screen, not a generic dashboard. Use the product's language for UI labels.` },
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

/** Backend swarm: one agent per API operation → a real route file. */
async function genRoute(config: DomainConfig, bp: Blueprint, r: RouteSpec): Promise<AppFile | null> {
  const out = (await chatJSON([
    { role: "system", content: `You are a Backend Engineer. Write ONE Next.js 16 route handler file implementing this operation with REAL, working logic (no TODOs, no stubs). It must compile under tsc --noEmit.

${RULES}
${SPINE_API}

DATABASE TABLES (already created in sql/app.sql — use these exact names/columns):
${tablesDoc(bp)}

Return ONLY JSON: {"code":"<the full contents of ${r.path}>"}` },
    { role: "user", content: `File: ${r.path}\nMethods: ${r.methods.join(", ")}\nPurpose: ${r.purpose}\nLogic to implement EXACTLY:\n${r.logic}` },
  ], { model: "gpt-4o", temperature: 0.2 })) as { code?: string }
  return out.code ? { path: r.path, content: String(out.code).slice(0, 30_000) } : null
}

/** Frontend swarm: one agent per surface → a real Next page. */
async function genPage(config: DomainConfig, bp: Blueprint, p: PageSpec): Promise<AppFile | null> {
  const routeList = bp.routes.map((r) => `${r.methods.join("/")} ${r.path.replace(/^app/, "").replace(/\/route\.ts$/, "")} — ${r.purpose}`).join("\n")
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

/** Orchestrate the swarm: blueprint → tables + routes (parallel) + pages (parallel). */
export async function buildBespokeApp(config: DomainConfig, contracts: string): Promise<{ files: AppFile[]; blueprint: Blueprint }> {
  const blueprint = await planBlueprint(config, contracts)
  if (!blueprint.routes.length && !blueprint.pages.length) return { files: [], blueprint }

  const [routeFiles, pageFiles] = await Promise.all([
    Promise.all(blueprint.routes.map((r) => genRoute(config, blueprint, r).catch(() => null))),
    Promise.all(blueprint.pages.map((p) => genPage(config, blueprint, p).catch(() => null))),
  ])

  const files: AppFile[] = []
  const appSql = blueprint.tables.map((t) => t.ddl).join("\n\n")
  if (appSql) files.push({ path: "sql/app.sql", content: `-- ${config.identity.name} — bespoke app schema (run after the spine's 001/002/003).\n\n${appSql}\n` })
  for (const f of [...routeFiles, ...pageFiles]) if (f) files.push(f)
  files.push(navComponent(blueprint))
  files.push(appShell(config))
  return { files, blueprint }
}
