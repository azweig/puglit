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
import { chatJSON, chatText } from "@/lib/openai"
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
- A LOCATION + MEMBERSHIP aggregator (e.g. "which nearby places give me a discount with the loyalty programs / cards I own") ⇒ this is a CATALOG the app curates/ingests, NOT user-generated content. Tables: programs (the global catalog of loyalty programs/cards, e.g. id, name, provider, category), user_memberships (user_id, program_id — which programs THIS user owns), merchants (id, name, category), branches (id, merchant_id, address, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION — a merchant has many geolocated branches), offers (id, merchant_id, title, discount_label, program_id — an offer is tied to the program that unlocks it; use an offer_programs join if an offer accepts several programs). Operations: list the catalog of programs; add/remove a program from MY memberships; save my location; the CORE route → "nearby offers for MY programs": given my lat/lng + a radius (km), return branches within the radius whose offer's program is in my memberships, with the distance and the program name, ORDERED BY distance (Haversine in SQL). Pages: home = nearby results (after location), my programs (pick from the catalog), set location. The catalog (programs + merchants + branches + offers) is SEEDED/INGESTED by the app, not created by end users.
GENERAL RULE: distinguish CATALOG/reference data (curated or ingested from external sources — seed it, refresh via cron, users only READ/filter it) from USER-GENERATED content (users create it). Model both correctly. For any "near me"/location feature, geolocated rows MUST store latitude & longitude as DOUBLE PRECISION and the core query uses the Haversine formula ordered by distance.

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

/** Art Director: a DISTINCTIVE, product-specific visual identity for the app screens
 *  (not a generic dashboard). Derived from the idea + brand palette + archetype, so
 *  it differs per project. The frontend swarm follows this brief verbatim. */
async function genDesignBrief(config: DomainConfig, bp: Blueprint): Promise<string> {
  const id = config.identity
  const palette = (id.palette || []).map((c: any) => `${c.hex}${c.label ? ` (${c.label})` : ""}`).join(", ")
  const tagline = typeof id.tagline === "string" ? id.tagline : JSON.stringify(id.tagline)
  try {
    return await chatText([
      { role: "system", content: `You are a Senior Art Director + Product Designer. Design a DISTINCTIVE visual identity for THIS product's in-app screens — opinionated and specific, NOT a generic admin/CRUD look. Draw on the aesthetics of the product's category (e.g. a swipe-style used-goods marketplace → Tinder card-stack immersion + OLX/eBay marketplace warmth and trust). The result must feel bespoke to this product and not interchangeable with other apps.

Output a concrete DESIGN BRIEF the frontend engineers will follow verbatim. Cover, concisely:
- MOOD + 1-2 references for this exact product.
- COLOR ROLES: assign the given palette hexes to background, surface/cards, primary CTA, accent, text, muted. Use these EXACT hexes (Tailwind arbitrary values like bg-[#xxxxxx]).
- TYPE: weight/scale personality (big bold titles? etc.).
- COMPONENT RECIPES with concrete Tailwind classes: cards (rounded-3xl, shadow, etc.), primary & secondary buttons, chips/badges, inputs, and a bottom tab bar.
- MOTION: subtle transitions (CSS only — no libraries).
- PER-SCREEN layout for each screen: ${bp.pages.map((p) => `${p.route} (${p.title})`).join(", ")}. The discovery/feed screen MUST be an IMMERSIVE experience — e.g. a full-bleed photo card stack with the title/price overlaid on a gradient scrim and large circular like/pass buttons — NOT a plain list. Listing/grid screens should feel like a real marketplace. Chat = modern bubble thread.
Keep it ~450 words, all actionable. No code, just the brief.` },
      { role: "user", content: `Product: ${id.name}\nPitch: ${tagline}\nPalette: ${palette || id.brandColor}\nPrimary: ${id.brandColor}  Secondary: ${(id as any).secondaryColor || ""}  Accent: ${(id as any).accentColor || ""}\nScreens: ${bp.pages.map((p) => p.route + " — " + p.title).join("; ")}` },
    ], { model: "gpt-4o", temperature: 0.6 })
  } catch { return "" }
}

/** Frontend swarm: one agent per surface → a real Next page, following the design brief. */
async function genPage(config: DomainConfig, bp: Blueprint, p: PageSpec, brief: string, shapes: string): Promise<AppFile | null> {
  const routeList = groupRoutes(bp.routes).map((rf) => `${[...rf.methods].join("/")} ${rf.path.replace(/^app/, "").replace(/\/route\.ts$/, "")} — ${rf.specs.map((s) => s.purpose).join("; ")}`).join("\n")
  const out = (await chatJSON([
    { role: "system", content: `You are a senior Frontend Engineer + Designer. Write ONE Next.js 16 page (App Router) that is REAL, interactive (no placeholders/TODOs) AND visually polished. It must compile under tsc --noEmit and work against the listed APIs.

${RULES}

DESIGN BRIEF — follow this EXACTLY so every screen shares one bespoke identity (do NOT produce a generic CRUD page):
${brief || "Bold, modern, mobile-first. Use the brand palette. Make the feed an immersive photo-card experience, not a list."}

AVAILABLE APIs (call these with fetch):
${routeList}
${shapes ? `\nAPI RESPONSE SHAPES — the data you will receive (consume these EXACT field names):\n${shapes}\n` : ""}
DEFENSIVE RENDERING (critical — a contract mismatch must NEVER crash the page):
- Type the fetched data and access nested fields with optional chaining + fallbacks: e.g. \`m.item?.image_url ?? ""\`, \`m.item?.title ?? "Sin título"\`. NEVER write \`x.item.image\` unguarded.
- Default arrays to [] before .map; render an empty state when there's nothing.
- An image with no URL should fall back to a neutral placeholder, not break.

Build the FULL screen per the brief: real layout, the product's palette (Tailwind arbitrary hex values), images shown prominently, polished empty/loading/error states, product-language copy. For the feed/discovery screen build the immersive card UI from the brief (full-bleed image, overlaid info, like/pass buttons), NOT a bullet list. For chat, poll every 2500ms.

Return ONLY JSON: {"code":"<the full contents of ${p.file}>"}` },
    { role: "user", content: `File: ${p.file}\nRoute: ${p.route}\nTitle: ${p.title}\nBehavior to implement EXACTLY:\n${p.behavior}\n\nProduct: ${config.identity.name}. Nav between screens: ${bp.nav.map((n) => `${n.label}→${n.href}`).join(", ")}.` },
  ], { model: "gpt-4o", temperature: 0.45 })) as { code?: string }
  return out.code ? { path: p.file, content: fixClientDirective(String(out.code).slice(0, 30_000)) } : null
}

/** Deterministically normalize the React "use client" directive. LLMs sometimes
 *  emit it WITHOUT quotes (`use client;` → TS1434) or omit it on pages that use
 *  client hooks. Both break compilation; fix them here, not via the CI fixer. */
function fixClientDirective(code: string): string {
  let c = code.replace(/^﻿/, "")
  if (/^\s*["']use client["']\s*;?/.test(c)) return c.replace(/^\s*["']use client["']\s*;?/, '"use client";')
  if (/^\s*use client\s*;?/.test(c)) return c.replace(/^\s*use client\s*;?/, '"use client";')
  if (/\b(useState|useEffect|useRouter|usePathname|onClick|onChange|onSubmit)\b/.test(c)) return '"use client";\n' + c
  return c
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
4. MUTUAL-MATCH CORRECTNESS: if this route records a like/swipe and creates a "match" when the interest is mutual, the ONLY correct logic is: when the caller U likes item I (owned by O), a mutual match exists iff O has ALREADY liked some item owned by U. The detection query MUST be of the form: SELECT … FROM swipes WHERE item_id IN (SELECT id FROM items WHERE owner_id = <U>) AND user_id = (SELECT owner_id FROM items WHERE id = <I>) AND liked = true. Reject any query that checks the item's owner against their own item, or that omits the "items owned by U" subquery — rewrite it to the correct form, inserting the match with both users and both items.
5. GEO / "NEAR ME": if this route returns nearby/closest results, distance MUST be computed with the Haversine formula over the latitude/longitude columns (read $lat/$lng from query params), e.g. (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))) AS distance_km — then filter by a radius (km) param and ORDER BY distance_km ASC. NEVER match location by string/text. If results must be limited to what the user owns/selected (e.g. their loyalty programs/memberships), filter through the membership/join table (… WHERE program_id IN (SELECT program_id FROM user_memberships WHERE user_id = $n)).
6. IMPORTS (no external deps): import ONLY from "next/server", "react", "@/lib/*" and "@/domain.config". If the file imports ANY other npm package (jsonwebtoken, jose, bcrypt(js), axios, cheerio, uuid, zod, etc.), REMOVE that import and use the spine instead — auth via \`import { getAuthUser } from "@/lib/auth"\` then \`const u = await getAuthUser(request)\` (NEVER manual JWT verify/sign), DB via \`import { pool } from "@/lib/db"\`, email via "@/lib/mailer". Rewrite all usages so no non-spine package remains.

THE SCHEMA (authoritative — these are the only tables/columns that exist):
${schemaSql}

Return ONLY JSON {"code":"<full corrected file>"}. If nothing needs fixing, return the file unchanged.` },
      { role: "user", content: `File ${file.path}:\n${file.content}` },
    ], { model: "gpt-4o", temperature: 0.1 })) as { code?: string }
    return out.code && out.code.length > 40 ? { path: file.path, content: String(out.code).slice(0, 30_000) } : file
  } catch { return file }
}

interface Col { name: string; type: string; ref?: string }
function parseTable(ddl: string): { name: string; cols: Col[] } {
  const name = (ddl.match(/CREATE TABLE(?: IF NOT EXISTS)?\s+([a-z_0-9]+)/i) || [])[1] || ""
  const cols: Col[] = []
  for (const line of ddl.split("\n")) {
    const m = line.match(/^\s*([a-z_][a-z_0-9]*)\s+([A-Za-z]+)/)
    if (!m) continue
    if (/^(create|primary|foreign|constraint|check|unique|references)$/i.test(m[1])) continue
    cols.push({ name: m[1], type: m[2].toUpperCase(), ref: (line.match(/REFERENCES\s+([a-z_0-9]+)/i) || [])[1] })
  }
  return { name, cols }
}

/** Detect a Tinder-style swipe→mutual-match schema and, if present, emit a CORRECT
 *  deterministic swipe route (the LLM reliably gets the SQL form right but flips the
 *  parameter binding). Returns {path, content} to override, or null. Generalizable to
 *  any like/match marketplace; falls back to the LLM route if the shape is unclear. */
function deterministicSwipeRoute(tables: TableSpec[], existingPaths: string[]): AppFile | null {
  const parsed = tables.map((t) => parseTable(t.ddl))
  const items = parsed.find((t) => /item|product|listing|good/.test(t.name))
  const swipe = parsed.find((t) => /swipe|like|vote/.test(t.name) && t.cols.some((c) => c.type === "BOOLEAN"))
  const match = parsed.find((t) => /match/.test(t.name))
  if (!items || !swipe || !match) return null
  const ownerCol = items.cols.find((c) => c.ref === "users" || /owner|user|seller/.test(c.name))?.name
  const sUser = swipe.cols.find((c) => c.ref === "users" || /user|swiper/.test(c.name))?.name
  const sItem = swipe.cols.find((c) => c.ref === items.name || /item|product|target/.test(c.name))?.name
  const sLiked = swipe.cols.find((c) => c.type === "BOOLEAN")?.name
  const mUsers = match.cols.filter((c) => c.ref === "users" || /user/.test(c.name)).map((c) => c.name)
  const mItems = match.cols.filter((c) => c.ref === items.name || /item|product/.test(c.name)).map((c) => c.name)
  if (!ownerCol || !sUser || !sItem || !sLiked || mUsers.length < 2 || mItems.length < 2) return null
  const path = existingPaths.find((p) => /\/swipe?s?\/route\.ts$/.test(p) || /\/like/.test(p)) || `app/api/${swipe.name}/route.ts`
  const content = `import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { pool } from "@/lib/db"

// Deterministic, parameter-safe swipe → mutual-match (generated by Puglit, not the LLM).
export async function POST(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const b = await request.json().catch(() => ({}))
  const itemId = Number(b.item_id ?? b.itemId ?? b.id)
  const liked = b.liked ?? b.like ?? true
  if (!itemId) return NextResponse.json({ error: "item_id required" }, { status: 400 })

  await pool.query("INSERT INTO ${swipe.name} (${sUser}, ${sItem}, ${sLiked}) VALUES ($1,$2,$3)", [u.userId, itemId, liked])

  let matchId: number | null = null
  if (liked) {
    // mutual iff the owner of the item I liked has already liked one of MY items
    const mutual = await pool.query(
      \`SELECT s.${sUser} AS other_user, s.${sItem} AS other_item
       FROM ${swipe.name} s
       WHERE s.${sLiked} = true
         AND s.${sItem} IN (SELECT id FROM ${items.name} WHERE ${ownerCol} = $1)
         AND s.${sUser} = (SELECT ${ownerCol} FROM ${items.name} WHERE id = $2)
       LIMIT 1\`,
      [u.userId, itemId]
    )
    if (mutual.rows.length > 0) {
      const r = await pool.query(
        "INSERT INTO ${match.name} (${mUsers[0]}, ${mUsers[1]}, ${mItems[0]}, ${mItems[1]}) VALUES ($1,$2,$3,$4) RETURNING id",
        [u.userId, mutual.rows[0].other_user, itemId, mutual.rows[0].other_item]
      )
      matchId = r.rows[0].id
    }
  }
  return NextResponse.json({ success: true, matchId })
}
`
  return { path, content }
}

/** Deterministic, RENDER-READY matches list: returns each match with the OTHER
 *  user's full item as a nested object (so the UI can show its photo/title without
 *  guessing the shape). Returns the file + the response shape doc, or null. */
function deterministicMatchesRoute(tables: TableSpec[], existingPaths: string[]): { file: AppFile; shape: string } | null {
  const parsed = tables.map((t) => parseTable(t.ddl))
  const items = parsed.find((t) => /item|product|listing|good/.test(t.name))
  const match = parsed.find((t) => /match/.test(t.name))
  if (!items || !match) return null
  const ownerCol = items.cols.find((c) => c.ref === "users" || /owner|user|seller/.test(c.name))?.name
  const users = match.cols.filter((c) => c.ref === "users" || /user/.test(c.name)).map((c) => c.name)
  const itemCols = match.cols.filter((c) => c.ref === items.name || /item|product/.test(c.name)).map((c) => c.name)
  if (!ownerCol || users.length < 2 || itemCols.length < 2) return null
  const path = existingPaths.find((p) => /\/match(es)?\/route\.ts$/.test(p)) || `app/api/${match.name}/route.ts`
  const displayCols = items.cols.map((c) => c.name)
  const content = `import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { pool } from "@/lib/db"

// Deterministic, render-ready matches (generated by Puglit): each match includes the
// OTHER user's full item as \`item\`, so the UI never has to guess the response shape.
export async function GET(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { rows } = await pool.query(
    \`SELECT m.id AS id,
        to_json(i) AS item,
        (CASE WHEN m.${users[0]} = $1 THEN m.${users[1]} ELSE m.${users[0]} END) AS other_user_id
     FROM ${match.name} m
     JOIN ${items.name} i ON i.id IN (m.${itemCols[0]}, m.${itemCols[1]}) AND i.${ownerCol} <> $1
     WHERE m.${users[0]} = $1 OR m.${users[1]} = $1
     ORDER BY m.id DESC\`,
    [u.userId]
  )
  return NextResponse.json(rows)
}
`
  const shape = `GET ${path.replace(/^app/, "").replace(/\/route\.ts$/, "")} → [{ id:number, other_user_id:number, item:{ ${displayCols.join(", ")} } }]  // 'item' is the OTHER user's item; use item.image_url & item.title`
  return { file: { path, content }, shape }
}

/** Deterministic GEO capability for location+membership aggregators: the "near me"
 *  query (Haversine over branches, filtered by the user's memberships, ordered by
 *  distance) and the location-save route are too critical/complex to leave to the
 *  LLM. Detect the schema and emit: a user_locations store (extraSql), a location
 *  save route, and the nearby route — all parameter-correct. Returns null if not geo. */
function deterministicGeo(tables: TableSpec[], existingPaths: string[]): { files: AppFile[]; extraSql: string; shape: string } | null {
  const parsed = tables.map((t) => parseTable(t.ddl))
  const branches = parsed.find((t) => t.cols.some((c) => /^lat(itude)?$/.test(c.name)) && t.cols.some((c) => /^(lng|long|longitude)$/.test(c.name)))
  const offers = parsed.find((t) => /offer|discount|benefit|deal|promo/.test(t.name) && t.cols.some((c) => /program|card|membership|plan/.test(c.name)))
  const programs = parsed.find((t) => /program|card|loyalty|plan/.test(t.name) && !/user|member/.test(t.name))
  const memberships = parsed.find((t) => /member/.test(t.name) && t.cols.some((c) => c.ref === "users" || /user_id/.test(c.name)) && t.cols.some((c) => /program|card|plan/.test(c.name)))
  const merchants = parsed.find((t) => /merchant|store|shop|place|business|brand/.test(t.name) && t !== offers && t !== branches)
  if (!branches || !offers || !programs || !memberships) return null
  const latCol = branches.cols.find((c) => /^lat(itude)?$/.test(c.name))!.name
  const lngCol = branches.cols.find((c) => /^(lng|long|longitude)$/.test(c.name))!.name
  const bMerchant = branches.cols.find((c) => c.ref === merchants?.name || /merchant|store|place/.test(c.name))?.name || "merchant_id"
  const oMerchant = offers.cols.find((c) => c.ref === merchants?.name || /merchant|store|place/.test(c.name))?.name || "merchant_id"
  const oProgram = offers.cols.find((c) => c.ref === programs.name || /program|card|plan/.test(c.name))!.name
  const mUser = memberships.cols.find((c) => c.ref === "users" || /user_id/.test(c.name))!.name
  const mProgram = memberships.cols.find((c) => c.ref === programs.name || /program|card|plan/.test(c.name))!.name

  const extraSql = `CREATE TABLE IF NOT EXISTS user_locations (\n  user_id BIGINT PRIMARY KEY REFERENCES users(id),\n  latitude DOUBLE PRECISION NOT NULL,\n  longitude DOUBLE PRECISION NOT NULL,\n  address TEXT,\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);`

  // Match whatever the UI named the location route (set-location, location, ubicacion, my-location…)
  const locPath = existingPaths.find((p) => /(location|ubicaci|geoloc)/i.test(p) && /route\.ts$/.test(p) && !/(nearby|near-me|cercan)/i.test(p)) || "app/api/location/route.ts"
  const locFile: AppFile = {
    path: locPath,
    content: `import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { pool } from "@/lib/db"

// Save the user's coordinates (deterministic). The "near me" route reads these.
export async function POST(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const b = await request.json().catch(() => ({}))
  const lat = Number(b.latitude ?? b.lat), lng = Number(b.longitude ?? b.lng ?? b.long)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: "latitude/longitude required" }, { status: 400 })
  await pool.query(
    "INSERT INTO user_locations (user_id, latitude, longitude, address) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id) DO UPDATE SET latitude=$2, longitude=$3, address=$4, updated_at=NOW()",
    [u.userId, lat, lng, b.address ?? null]
  )
  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { rows } = await pool.query("SELECT latitude, longitude, address FROM user_locations WHERE user_id=$1", [u.userId])
  return NextResponse.json(rows[0] || null)
}
`,
  }

  // Prefer a route the UI calls a "nearby"/near-me endpoint; else a generic offers/deals list.
  const nearbyPath = existingPaths.find((p) => /(nearby|near-me|near_me|cercan|proxim)/i.test(p) && /route\.ts$/.test(p))
    || existingPaths.find((p) => /\/(offers|discounts|deals|benefits)\/route\.ts$/.test(p))
    || `app/api/nearby/route.ts`
  const nearbyFile: AppFile = {
    path: nearbyPath,
    content: `import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { pool } from "@/lib/db"

// Deterministic "near me" (generated by Puglit): offers at branches within radius
// whose program is one the user owns, ordered by distance (Haversine). Coordinates
// come from ?lat/?lng or the user's saved location.
export async function GET(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const sp = new URL(request.url).searchParams
  const latP = sp.get("lat") ?? sp.get("latitude"), lngP = sp.get("lng") ?? sp.get("longitude")
  let lat = latP != null && latP !== "" ? Number(latP) : NaN
  let lng = lngP != null && lngP !== "" ? Number(lngP) : NaN
  const radius = Number(sp.get("radius")) || 5
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const loc = await pool.query("SELECT latitude, longitude FROM user_locations WHERE user_id=$1", [u.userId])
    if (!loc.rows[0]) return NextResponse.json([])
    lat = loc.rows[0].latitude; lng = loc.rows[0].longitude
  }
  const { rows } = await pool.query(
    \`SELECT * FROM (
       SELECT o.id AS offer_id, o.*, to_json(m) AS merchant, b.address, b.${latCol} AS latitude, b.${lngCol} AS longitude, p.name AS program_name,
         (6371 * acos(LEAST(1, cos(radians($1)) * cos(radians(b.${latCol})) * cos(radians(b.${lngCol}) - radians($2)) + sin(radians($1)) * sin(radians(b.${latCol}))))) AS distance_km
       FROM ${offers.name} o
       JOIN ${branches.name} b ON b.${bMerchant} = o.${oMerchant}
       ${merchants ? `JOIN ${merchants.name} m ON m.id = o.${oMerchant}` : ""}
       JOIN ${programs.name} p ON p.id = o.${oProgram}
       WHERE o.${oProgram} IN (SELECT ${mProgram} FROM ${memberships.name} WHERE ${mUser} = $3)
     ) t
     WHERE t.distance_km <= $4
     ORDER BY t.distance_km ASC
     LIMIT 100\`,
    [lat, lng, u.userId, radius]
  )
  return NextResponse.json(rows)
}
`,
  }
  const shape = `GET ${nearbyPath.replace(/^app/, "").replace(/\/route\.ts$/, "")} → [{ offer_id, title|offer..., discount_label, merchant:{name,category}, address, latitude, longitude, program_name, distance_km }] (nearby offers for the user's programs; pass ?lat&lng&radius or it uses saved location). GET/POST /api/location saves {latitude,longitude,address}.`
  return { files: [locFile, nearbyFile], extraSql, shape }
}

/** Deterministic membership toggle: "I own program X" must be a simple add/remove by
 *  program_id (the LLM tends to demand extra fields). Detect the membership table and
 *  emit add (POST) / remove (DELETE) / list (GET) — content only; caller overrides the
 *  route file that touches the table. Returns null if there's no membership table. */
function deterministicMembershipContent(tables: TableSpec[]): { tableName: string; content: string } | null {
  const parsed = tables.map((t) => parseTable(t.ddl))
  const programs = parsed.find((t) => /program|card|loyalty|plan/.test(t.name) && !/user|member/.test(t.name))
  const mem = parsed.find((t) => /member/.test(t.name) && t.cols.some((c) => c.ref === "users" || /user_id/.test(c.name)) && t.cols.some((c) => /program|card|plan/.test(c.name)))
  if (!mem || !programs) return null
  const uCol = mem.cols.find((c) => c.ref === "users" || /user_id/.test(c.name))!.name
  const pCol = mem.cols.find((c) => /program|card|plan/.test(c.name))!.name
  const content = `import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { pool } from "@/lib/db"

// Deterministic membership toggle (generated by Puglit): own/disown a program by id.
export async function POST(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const b = await request.json().catch(() => ({}))
  const programId = Number(b.${pCol} ?? b.programId ?? b.id)
  if (!programId) return NextResponse.json({ error: "program_id required" }, { status: 400 })
  await pool.query("INSERT INTO ${mem.name} (${uCol}, ${pCol}) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM ${mem.name} WHERE ${uCol}=$1 AND ${pCol}=$2)", [u.userId, programId])
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const b = await request.json().catch(() => ({}))
  const programId = Number(b.${pCol} ?? b.programId ?? b.id)
  await pool.query("DELETE FROM ${mem.name} WHERE ${uCol}=$1 AND ${pCol}=$2", [u.userId, programId])
  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { rows } = await pool.query("SELECT m.${pCol}, to_json(p) AS program FROM ${mem.name} m JOIN ${programs.name} p ON p.id = m.${pCol} WHERE m.${uCol} = $1", [u.userId])
  return NextResponse.json(rows)
}
`
  return { tableName: mem.name, content }
}

const SEED_SKIP = new Set(["users", "auth_tokens", "records", "page_visits", "analytics_events", "sessions"])

/** Data Ingestion agent: products that aggregate a CATALOG (offers, places, programs,
 *  listings curated/scraped from external sources) are useless empty. Generate a
 *  REALISTIC seed (real, plausible data for the product's market) for the catalog
 *  tables — NOT user/auth or user-owned tables. Generalizable to any aggregator. */
async function genCatalogSeed(config: DomainConfig, bp: Blueprint): Promise<AppFile | null> {
  const catalog = bp.tables.filter((t) => {
    if (SEED_SKIP.has(t.name)) return false
    const p = parseTable(t.ddl)
    const userOwned = p.cols.some((c) => c.ref === "users" || /^(user_id|owner_id)$/.test(c.name))
    return !userOwned // catalog/reference data, not user-owned selections
  })
  const hasGeo = catalog.some((t) => /latitude|longitude|\blat\b|\blng\b/i.test(t.ddl))
  if (!catalog.length || (catalog.length < 2 && !hasGeo)) return null
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  try {
    const out = (await chatJSON([
      { role: "system", content: `You are a Data Ingestion specialist. This app aggregates a CATALOG (reference data the app curates/scrapes — NOT user-generated). Generate a REALISTIC seed so the app is usable on first run: INSERT statements for the catalog tables below, using REAL, plausible names/brands/values for THIS product's actual market and country (infer from the product). Rules:
- Use EXPLICIT ids (1,2,3…) and insert PARENTS before CHILDREN so foreign keys resolve.
- For geolocated rows, use REAL latitude/longitude for the product's main city/country (e.g. Lima, Perú ≈ -12.0x, -77.0x) and vary them so "near me" returns several results within a few km.
- Generate enough rows to feel real (e.g. 8-12 programs, 12-20 merchants, 1-3 branches each, an offer per merchant tied to a program).
- Use ONLY the exact table & column names in the DDL. Strings single-quoted, escape apostrophes by doubling.
- Do NOT seed user/auth/membership/selection tables (users fill those).
Return ONLY JSON {"sql":"-- seed\\nINSERT INTO ...;\\n..."}.` },
      { role: "user", content: `Product: ${config.identity.name}\nPitch: ${tagline}\n\nCATALOG TABLES (seed exactly these):\n${catalog.map((t) => t.ddl).join("\n\n")}` },
    ], { model: "gpt-4o", temperature: 0.4 })) as { sql?: string }
    return out.sql && out.sql.length > 30 ? { path: "sql/seed.sql", content: `-- ${config.identity.name} — catalog seed (generated by Puglit's Data Ingestion agent).\n-- Real-world reference data so the app works on first run; refresh via app/api/cron/refresh.\n\n${out.sql}\n` } : null
  } catch { return null }
}

/** Refresh cron scaffold: the place ingestion/scrapers run on a schedule (fire-and-forget). */
function refreshCron(config: DomainConfig): AppFile {
  return {
    path: "app/api/cron/refresh/route.ts",
    content: `import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { pool } from "@/lib/db"

// Scheduled catalog refresh (ingestion / scrapers). Fire-and-forget: responds
// immediately and does the work in after() (external cron callers cap at ~30s).
// Auth: ?key= or x-cron-secret must equal CRON_SECRET. Schedule every few hours.
// Plug one ingestSource() per external source (each upserts into the catalog tables).
export const maxDuration = 300

async function refreshCatalog() {
  // TODO(per-source): for each external source the catalog comes from, fetch it and
  // UPSERT into the catalog tables (parameterized). Keep each source isolated so one
  // failing source never blocks the others. The schema + a working seed already exist.
  await pool.query("SELECT 1") // placeholder so the file is valid and DB-reachable
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const provided = request.headers.get("x-cron-secret") || request.nextUrl.searchParams.get("key")
    if (provided !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  after(async () => { try { await refreshCatalog() } catch { /* best-effort; next tick retries */ } })
  return NextResponse.json({ ok: true, scheduled: true })
}
`,
  }
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
  // Art-direction brief (per-project visual identity) runs alongside route generation;
  // pages then follow it so every screen shares a bespoke, non-generic look.
  // Known deterministic response shapes (e.g. enriched matches) so pages consume the
  // exact field names instead of guessing (prevents client-side render crashes).
  const matchesDet = deterministicMatchesRoute(blueprint.tables, [])
  const geoDet = deterministicGeo(blueprint.tables, [])
  const shapes = [matchesDet?.shape, geoDet?.shape].filter(Boolean).join("\n")
  const briefPromise = genDesignBrief(config, blueprint).catch(() => "")
  const seedPromise = genCatalogSeed(config, blueprint).catch(() => null)
  const routePromise = Promise.all(routeFiles.map((rf) => genRouteFile(config, blueprint, rf).then((f) => (f ? hardenRoute(f, schemaSql) : null)).catch(() => null)))
  const brief = await briefPromise
  const pagePromise = Promise.all(pages.map((p) => genPage(config, blueprint, p, brief, shapes).catch(() => null)))
  const [routeOut, pageOut] = await Promise.all([routePromise, pagePromise])

  const files: AppFile[] = []
  if (schemaSql) files.push({ path: "sql/app.sql", content: `-- ${config.identity.name} — bespoke app schema (run after the spine's 001/002/003).\n\n${schemaSql}\n` })
  if (brief) files.push({ path: "docs/DESIGN.md", content: `# Design brief — ${config.identity.name}\n\n${brief}\n` })
  for (const f of [...routeOut, ...pageOut]) if (f) files.push(f)

  // DETERMINISTIC swipe/match override: the mutual-match parameter binding is the
  // single most LLM-flaky piece — generate it from the schema, no LLM, when present.
  const swipeFile = deterministicSwipeRoute(blueprint.tables, files.map((f) => f.path))
  if (swipeFile) {
    const i = files.findIndex((f) => f.path === swipeFile.path)
    if (i >= 0) files[i] = swipeFile; else files.push(swipeFile)
  }
  // DETERMINISTIC render-ready matches route (page consumes a known shape → no crash).
  const matchesOverride = deterministicMatchesRoute(blueprint.tables, files.map((f) => f.path))
  if (matchesOverride) {
    const i = files.findIndex((f) => f.path === matchesOverride.file.path)
    if (i >= 0) files[i] = matchesOverride.file; else files.push(matchesOverride.file)
  }

  // DETERMINISTIC geo: location store + save route + Haversine near-me route.
  const geo = deterministicGeo(blueprint.tables, files.map((f) => f.path))
  if (geo) {
    const sqlF = files.find((f) => f.path === "sql/app.sql")
    if (sqlF && !/user_locations/.test(sqlF.content)) sqlF.content += `\n\n-- user location store (Puglit geo capability)\n${geo.extraSql}\n`
    for (const gf of geo.files) { const i = files.findIndex((f) => f.path === gf.path); if (i >= 0) files[i] = gf; else files.push(gf) }
  }

  // DETERMINISTIC membership toggle: override whatever route writes the membership table.
  const mem = deterministicMembershipContent(blueprint.tables)
  if (mem) {
    const idx = files.findIndex((f) => /route\.ts$/.test(f.path) && new RegExp(`(insert\\s+into|from|delete\\s+from)\\s+${mem.tableName}\\b`, "i").test(f.content) && !/acos|distance_km/i.test(f.content))
    if (idx >= 0) files[idx] = { path: files[idx].path, content: mem.content }
  }

  // Data Ingestion: a realistic catalog seed (overrides the generic seed via path
  // dedup) + a refresh cron scaffold — only for aggregator/catalog products.
  const seed = await seedPromise
  if (seed) { files.push(seed); files.push(refreshCron(config)) }

  files.push(navComponent(blueprint))
  files.push(appShell(config))
  return { files, blueprint }
}
