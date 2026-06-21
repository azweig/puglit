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
import { chatJSON, chatText, MODELS } from "@/lib/openai"
import type { DomainConfig } from "@/lib/domain-types"
import { PLAYBOOK } from "@/lib/playbooks"
import { deterministicConnectors } from "@/lib/connectors"
import { deterministicIntegrations } from "@/lib/integrations"
import { deterministicAgent } from "@/lib/agent-module"
import { deterministicVoice } from "@/lib/voice-module"
import { moduleCatalog, findCustomModulesFor, harvestModules } from "@/lib/module-registry"

export interface AppFile { path: string; content: string }
export interface TableSpec { name: string; ddl: string }
export interface RouteSpec { path: string; methods: string[]; purpose: string; logic: string }
export interface PageSpec { route: string; file: string; title: string; behavior: string }
export interface Blueprint {
  kind: "public" | "accounts" // public = the product IS the homepage, no login (scoreboard, tool, feed); accounts = per-user data behind auth
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
- Never reference a variable/import that you do not define. Code must compile with \`tsc --noEmit\`.
- Next 16 navigation: use \`<Link href="/x">label</Link>\` directly. NEVER nest an <a> inside <Link> (runtime crash).
- Dynamic route params ([id]) in client pages: read them with useParams() from "next/navigation" (e.g. const { matchId } = useParams<{ matchId: string }>()). NEVER use router.query (it does not exist in the App Router).`

/** The non-negotiable visual quality bar, shared by the Art Director and every Frontend
 *  agent. This is what separates a premium product from a generic admin panel — and it is
 *  what fixes "los proyectos salen feos". Tailwind-only (the spine has no UI library). */
const VISUAL_SYSTEM = `PREMIUM VISUAL QUALITY BAR (Tailwind only — there is NO Shadcn/Radix/component library; build every element by hand with Tailwind utility classes). Treat this as a hard spec, not inspiration:
- CONTRAST IS LAW: never place text on a same-or-near color (the #1 defect: white text inheriting onto a white card → invisible). Every text node must have an explicit, WCAG-AA-passing color against ITS OWN background. When you put content on a colored section, re-declare the text color on the inner surface. Cards are almost always a light surface (white / near-white) with dark ink text, even on a dark/branded page background.
- DEPTH & HIERARCHY: use a consistent radius scale (e.g. rounded-xl/2xl for cards, rounded-full for pills/avatars), layered shadows (shadow-sm on surfaces, shadow-lg/xl on raised/floating elements), and 1px hairline borders (border border-black/5 or white/10) to separate surfaces. No flat, borderless gray boxes.
- SPACING RHYTHM: generous, consistent spacing (a 4/8px scale: gap-3/4/6, p-4/6, space-y-3/4). Cards breathe (p-4 to p-6). Never cramped, never edge-to-edge text.
- TYPE SCALE: a clear hierarchy — oversized bold display titles (text-2xl/3xl/4xl font-extrabold tracking-tight), medium section headers, readable body (text-sm/base text-black/70), and small muted meta (text-xs text-black/50). Use font-semibold/bold deliberately.
- COLOR USE: use the brand palette as TOKENS with roles (background, surface, primary CTA, accent, ink, muted) — apply via Tailwind arbitrary hex (bg-[#xxxxxx]). One dominant brand color + one accent; everything else neutral. Use subtle gradients (bg-gradient-to-b/br from-[..] to-[..]) for heroes/headers when it fits the brand. Badges/pills for status & metadata (e.g. score, distance, category) in accent-tinted chips.
- INTERACTION STATES on every interactive element: hover (hover:bg-…/hover:scale-[1.02]/hover:shadow-lg), active (active:scale-95), focus-visible (focus-visible:ring-2 ring-offset-2 ring-[brand]), disabled (opacity-60 cursor-not-allowed). Transitions: transition-colors/transform duration-200. CSS only — no animation libraries.
- POLISHED STATES (always implement all four): LOADING = skeleton blocks (animate-pulse bg-black/5 rounded) shaped like the real content, not a "Loading…" string; EMPTY = a friendly centered illustration-style block (emoji/icon glyph + heading + one-line hint + a CTA); ERROR = an inline dismissible banner in red-tinted surface; POPULATED = the real, dense, beautiful content.
- IMAGERY: show images prominently with fixed aspect ratios (aspect-video/aspect-square, object-cover, rounded) and a graceful neutral placeholder when missing. Avatars are rounded-full with a colored fallback initial.
- RESPONSIVE: mobile-first, then sm:/md:/lg: refinements. Real grids on desktop (grid sm:grid-cols-2 lg:grid-cols-3 gap-4), single column on mobile. Tap targets ≥ 44px on mobile.
- A11Y: semantic elements (header/nav/main/section/button), alt text, aria-labels on icon-only buttons, visible focus. Color is never the only signal.
- BANNED: the generic centered-narrow-column admin look, unstyled default buttons, gray-on-gray, walls of plain text, low-contrast placeholder vibes, Bootstrap-ish cards. Every screen must look intentionally designed for THIS product.`

/** Domain Architect: infer the product's functional blueprint from the idea+config. */
/** Reference Studier: when the idea clones/names a real product or category, enumerate that
 *  REAL product's actual surfaces (pages), entities and signature features, so the architect
 *  plans to that depth instead of the model's vague generic notion. Returns "" if not a clone.
 *  (Knowledge-based today; gains a web/fetch tool when the engine runs with one.) */
const REFERENCE_SCHEMA = {
  type: "object",
  properties: {
    product: { type: "string" },
    entities: { type: "array", items: { type: "string" } },
    surfaces: { type: "string" },
  },
  required: ["entities", "surfaces"],
}
export async function studyReference(config: DomainConfig): Promise<string> {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  try {
    const out = (await chatJSON([
      { role: "system", content: `You are a Reference Product Analyst. For the given product — whether it names a real product ("clon de promiedos") OR fits a well-known CATEGORY (a status page, a job board, a recipe app, a habit tracker, a forum…) — reconstruct the fidelity bar FROM MEMORY: the DISTINCT PAGES/screens, the DATA ENTITIES behind them, and the signature FEATURES a user would notice are MISSING if absent. Be specific and EXHAUSTIVE about the data model — list EVERY distinct entity/table the real product needs (think 6-15 for a real product, not 1-2).
Examples:
- a STATUS PAGE (status.claude.com / Statuspage): entities = service, component, component_group, status_check (uptime samples), incident, incident_update, maintenance, subscriber. Pages = overview (components grouped, each with current status + 90-day uptime bar), incident history (timeline of incidents + updates), a single incident page, scheduled maintenance, subscribe.
- promiedos: entities = competition, team, match, match_event, lineup, player, standing, top_scorer. Pages = home (matches by league), match (timeline/stats/lineups), league (fixture/standings/scorers), team (squad).
Always fill 'entities' and 'surfaces' for any recognizable product/category; leave them empty ONLY if the idea is genuinely novel with no analog.
Return ONLY JSON: {"product": "...", "entities": ["service","component",...], "surfaces": "markdown: pages → key sections/features"}.` },
      { role: "user", content: `Product: ${config.identity.name}\nPitch: ${tagline}` },
    ], { model: MODELS.premium, temperature: 0.2, schema: REFERENCE_SCHEMA })) as { product?: string; entities?: string[]; surfaces?: string }
    const entities = Array.isArray(out.entities) ? out.entities.filter(Boolean) : []
    const surfaces = String(out.surfaces || "").trim()
    if (!entities.length && !surfaces) return ""
    return [
      out.product ? `Reference product/category: ${out.product}` : "",
      entities.length ? `REQUIRED DATA ENTITIES (model each as its own table unless truly trivial): ${entities.join(", ")}` : "",
      surfaces ? `SURFACES (pages → features):\n${surfaces}` : "",
    ].filter(Boolean).join("\n")
  } catch { return "" }
}

export async function planBlueprint(config: DomainConfig, contracts: string, reference?: string, lens?: string, opts?: { model?: string; lessons?: string }): Promise<Blueprint> {
  const ents = (config.entities || []).map((e) => `${e.name}(${e.fields.map((f) => `${f.name}:${f.type}${f.required ? "!" : ""}`).join(", ")})`).join("; ")
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : JSON.stringify(config.identity.tagline)
  const catalog = await moduleCatalog().catch(() => "")
  const out = (await chatJSON([
    { role: "system", content: `You are the Domain Architect for an app generator. Given a product idea, design the COMPLETE functional blueprint of its core experience: the database tables, the API operations, and the UI pages a real user needs to ACTUALLY USE the product end-to-end (not a generic CRUD admin).

${PLAYBOOK.architect}
${catalog ? `\nREUSABLE MODULES already in the factory (if the product needs one of these, REUSE it — do NOT design it from scratch; just note it in the blueprint):\n${catalog}\n` : ""}
${lens ? `\n${lens}\nLet this philosophy genuinely shape your blueprint (table count, layering, route style) so it is DISTINCT from other approaches — but stay 100% on THIS product's domain (never invent unrelated entities like sports leagues in a status page).\n` : ""}${opts?.lessons ? `\nLESSONS FROM YOUR TEAM'S PAST PROJECTS (apply them — this is how you improve and beat the other teams):\n${opts.lessons}\n` : ""}

Think hard about the real user journeys. Examples of inference:
- A Tinder-style used-goods marketplace ⇒ tables: items (owner, title, description, photo TEXT for data-url, city, status), swipes (user_id, item_id, liked), matches (user_a, user_b, item_a, item_b), messages (match_id, sender_id, body). Operations: publish item, get a swipe feed (others' items not yet swiped), record a swipe and DETECT a mutual match (when the owner of the liked item has also liked one of my items → create a match referencing both items), list my matches, send/list messages scoped to a match. Pages: feed/swipe (home), publish, matches list, chat per match. Anonymous: never expose email between users; show only first name/alias.
- A LOCATION + MEMBERSHIP aggregator (e.g. "which nearby places give me a discount with the loyalty programs / cards I own") ⇒ this is a CATALOG the app curates/ingests, NOT user-generated content. Tables: programs (the global catalog of loyalty programs/cards, e.g. id, name, provider, category), user_memberships (user_id, program_id — which programs THIS user owns), merchants (id, name, category), branches (id, merchant_id, address, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION — a merchant has many geolocated branches), offers (id, merchant_id, title, discount_label, program_id — an offer is tied to the program that unlocks it; use an offer_programs join if an offer accepts several programs). Operations: list the catalog of programs; add/remove a program from MY memberships; save my location; the CORE route → "nearby offers for MY programs": given my lat/lng + a radius (km), return branches within the radius whose offer's program is in my memberships, with the distance and the program name, ORDERED BY distance (Haversine in SQL). Pages: home = nearby results (after location), my programs (pick from the catalog), set location. The catalog (programs + merchants + branches + offers) is SEEDED/INGESTED by the app, not created by end users.
GENERAL RULE: distinguish CATALOG/reference data (curated or ingested from external sources — seed it, refresh via cron, users only READ/filter it) from USER-GENERATED content (users create it). Model both correctly. For any "near me"/location feature, geolocated rows MUST store latitude & longitude as DOUBLE PRECISION and the core query uses the Haversine formula ordered by distance.

FIRST decide the product's KIND — this drives the whole shape, there is NO landing/login template:
- "public": the product itself IS the homepage, usable with no account (a sports scoreboard, a news/feed site, a public tool, a directory). NO login, NO signup, NO pricing. The homepage at route "/" (file app/app/../page.tsx → use "/" → app/page.tsx) renders the actual product. API routes are PUBLIC (no auth).
- "accounts": the core value is per-user/private data (a marketplace with my listings, a social app, a personal dashboard). Has signup/login and per-user data behind auth.
Choose honestly from the concept; most "clone of <public site>" or tools are "public".

The HOMEPAGE (route "/", file app/page.tsx) MUST be the real product (for public: the live product itself; for accounts: a real entry screen), NEVER a generic SaaS marketing landing.

Return ONLY JSON:
{
 "kind": "public" | "accounts",
 "summary": "one paragraph of the core experience",
 "tables": [{"name":"items","ddl":"CREATE TABLE IF NOT EXISTS items (\\n  id BIGSERIAL PRIMARY KEY,\\n  ...,\\n  created_at TIMESTAMPTZ DEFAULT NOW()\\n);"}],
 "routes": [{"path":"app/api/feed/route.ts","methods":["GET"],"purpose":"...","logic":"precise SQL + rules; for a public product do NOT require auth"}],
 "pages": [{"route":"/","file":"app/page.tsx","title":"...","behavior":"the product's main screen (public products render the product here)"}],
 "nav": [{"label":"...","href":"/"}]
}

Constraints: ${RULES}
${SPINE_API}

COMPLETENESS (CRITICAL — generators die here; never ship a read-only app):
- For EVERY kind of user-generated content (items a user publishes, a message a user sends), include BOTH a CREATE route (POST) AND a UI page/form to create it. Anything listable must be creatable.
- Any feed/list is fed by one of your CREATE routes. Trace each journey end-to-end: every step maps to a route AND a page; add whatever is missing.
- Messaging/chat MUST have POST (send) and GET (list), BOTH scoped to the conversation's participants (verify the caller belongs to the match before reading/writing).
- A swipe/like route must DETECT the mutual condition and create the match atomically.

REFERENCE-PRODUCT DEPTH (critical — do NOT ship a toy): if the idea names or clearly clones a real product/category (e.g. "like promiedos", "a Tinder for X", "an Airbnb for Y", "a sports scores site"), MENTALLY ENUMERATE that real product's actual surfaces and MATCH their depth — not a stripped-down sketch. A live-scores product (Promiedos/365scores) is NOT 4 flat tables: it needs competitions, matches WITH minute-by-minute events, lineups/formations, match statistics, team & player pages, multiple standings views, fixtures by round, top scorers. Model the ENTITIES and SURFACES that make it recognizably that product. A data-driven product that shows external/live data (scores, prices, flights, listings) is INGESTED from a real source — model it as a curated catalog refreshed by cron, never as user-generated, and assume an ingestion job populates it.

SIZE TO THE PRODUCT, do not cap artificially: simple tools may need 3-5 tables; a deep product (sports/marketplace/social/aggregator) legitimately needs 8-15+ tables and many routes/pages — generate what the product GENUINELY requires to be a faithful, usable clone. Keep each file focused, but never sacrifice the product's real feature surface to hit a small number. Make tables, routes and pages mutually consistent (same table/column names everywhere). ALWAYS include the homepage at route "/" (app/page.tsx) as the product itself, plus a detail page for the product's primary entity (e.g. a match/profile/listing page) and a create page when users contribute content. Use the product's language for UI labels.` },
    { role: "user", content: `Product: ${config.identity.name}\nPitch: ${tagline}\nLanguages: ${(config.identity.languages || ["es"]).join(",")}\nEntities (hints, refine freely): ${ents}\n${reference ? `\nREFERENCE PRODUCT — the user is cloning this; you MUST reach this depth (model the entities + create the surfaces/pages listed; a blueprint that omits these is a failure):\n${reference}\n` : ""}\nCONTRACTS:\n${contracts}` },
  ], { model: opts?.model || MODELS.premium, temperature: 0.3 })) as Partial<Blueprint>

  return {
    kind: out.kind === "public" ? "public" : "accounts",
    summary: out.summary || "",
    tables: normalizeTables(Array.isArray(out.tables) ? out.tables.filter((t) => t?.name && t?.ddl) : []),
    routes: Array.isArray(out.routes) ? out.routes.filter((r) => r?.path && r?.logic) : [],
    pages: Array.isArray(out.pages) ? out.pages.filter((p) => p?.file && p?.behavior) : [],
    nav: Array.isArray(out.nav) ? out.nav : [],
  }
}

/** Schema sanitation the LLM gets wrong: (1) duplicate column names in a DDL are INVALID
 *  SQL (Postgres: "column specified more than once") — disambiguate. (2) a mutual-match
 *  table needs TWO distinct user FKs and TWO distinct item FKs; the LLM often collapses
 *  them to one user_id/item_id, breaking both the DDL and the match feature. Rewrite any
 *  detected match table to the canonical {user_a,user_b,item_a,item_b} shape so the
 *  deterministic swipe/matches routes activate. */
function normalizeTables(tables: TableSpec[]): TableSpec[] {
  const hasItems = tables.some((t) => /item|product|listing|good/.test(t.name))
  const hasSwipe = tables.some((t) => /swipe|like|vote/.test(t.name))
  return tables.map((t) => {
    let ddl = t.ddl
    // Canonical mutual-match table when this is a swipe marketplace.
    if (hasItems && hasSwipe && /match/.test(t.name)) {
      ddl = `CREATE TABLE IF NOT EXISTS ${t.name} (\n  id BIGSERIAL PRIMARY KEY,\n  user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  item_a INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,\n  item_b INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);`
      return { name: t.name, ddl }
    }
    // Generic: drop any duplicate column line (keep first occurrence).
    const seen = new Set<string>()
    ddl = ddl.split("\n").filter((line) => {
      const m = line.match(/^\s*([a-z_][a-z_0-9]*)\s+[A-Za-z]/)
      if (!m) return true
      const col = m[1].toLowerCase()
      if (/^(create|primary|foreign|constraint|check|unique|references)$/i.test(col)) return true
      if (seen.has(col)) return false
      seen.add(col)
      return true
    }).join("\n")
    return { name: t.name, ddl }
  })
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

${PLAYBOOK.dev}

${RULES}
${SPINE_API}

ROUTE COMPLETENESS:
- Export one handler per method needed: ${[...rf.methods].join(", ")} (e.g. export async function GET(...) / POST(...)).
- If this resource is a COLLECTION the UI both reads and writes (messages, comments, items, posts…), implement BOTH a GET (list/read, scoped to the caller's permission) AND a POST (create). Reads/writes touching another user's conversation/match MUST be scoped (verify the caller is a participant first).
- Read params for GET from new URL(request.url).searchParams; read JSON body for POST/PUT/PATCH via await request.json().
${bp.kind === "public"
  ? "- THIS IS A PUBLIC PRODUCT: do NOT call getAuthUser. Routes are PUBLIC reads/writes over the catalog/data; no per-user auth."
  : "- This product has accounts: protect per-user routes with getAuthUser (401 if missing)."}

PRODUCTION-GRADE BACKEND STANDARDS (every handler):
- INPUT VALIDATION: validate the body/params before touching the DB — required fields present, correct primitive types, sane ranges/lengths; on invalid input return 400 with {error:"..."} (never let bad input reach SQL or throw a 500). Coerce numbers with Number() and reject NaN.
- CORRECT STATUS CODES: 200 read, 201 create, 400 bad input, 401 unauthenticated, 403 not-a-participant/forbidden, 404 missing, 409 conflict (e.g. duplicate). JSON body on every path.
- PARAMETERIZED SQL ONLY ($1,$2,…) — never string-interpolate user input. Select explicit columns; avoid SELECT * when shaping a response.
- TRANSACTION SAFETY: any multi-statement mutation that must be atomic (e.g. record a swipe AND create a match, decrement stock AND insert order) MUST run in a single transaction: \`const c = await pool.connect(); try { await c.query("BEGIN"); …; await c.query("COMMIT") } catch(e){ await c.query("ROLLBACK"); throw e } finally { c.release() }\`.
- LIST SHAPE: a GET returning a collection returns the BARE ARRAY (return NextResponse.json(rows)) with exact snake_case columns — never {data:rows}. Support ?limit/?offset (sane defaults, cap limit) for lists that can grow; ORDER BY a real column.
- RESILIENCE: wrap the handler body in try/catch; log and return 500 {error:"internal"} on unexpected failure. Never leak raw error objects to the client.

DATABASE TABLES (already created — use these EXACT names/columns):
${tablesDoc(bp)}

Return ONLY JSON: {"code":"<the full contents of ${rf.path}>"}` },
    { role: "user", content: `File: ${rf.path}\nMethods to implement: ${[...rf.methods].join(", ")}\nOperations:\n${ops}` },
  ], { model: MODELS.code, temperature: 0.2 })) as { code?: string }
  return out.code ? { path: rf.path, content: String(out.code).slice(0, 30_000).replace(/catch\s*\(\s*([a-zA-Z_$][\w$]*)\s*\)\s*\{/g, "catch ($1: any) {") } : null
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
      { role: "system", content: `You are a Senior Art Director + Product Designer from a top-tier product studio (think Linear, Vercel, Arc, Cron, Things, Airbnb). You design DISTINCTIVE, premium, opinionated visual identities — never a generic admin/CRUD/Bootstrap look. Your brief is the single source of truth the frontend engineers follow verbatim, so it must be concrete and decisive (make the calls; do not offer options).

Anchor on the product's CATEGORY and pick a real aesthetic direction for it (e.g. swipe used-goods marketplace → Tinder card-stack immersion + OLX/eBay warmth/trust; live sports scores → ESPN/365scores dense real-time energy; loyalty-discounts map → Foursquare/Yelp local-discovery with map cues; productivity tool → Linear/Things crispness). The result must be unmistakably THIS product and not interchangeable with any other app you have designed.

${VISUAL_SYSTEM}

Output a concrete DESIGN BRIEF (~550 words, all actionable, NO code) with these sections:
- DIRECTION: the aesthetic in one line + 1-2 concrete references for THIS exact product, and the emotional goal (e.g. "fast, trustworthy, a little playful").
- LAYOUT ARCHITECTURE — decide the app's STRUCTURE and COMMIT (this MUST differ per product, never a fixed template): choose the nav + page skeleton that fits THIS product — fixed left SIDEBAR + top header (data/dashboard); sticky TOP BAR + horizontal tabs, full-width (scores/news/feed); minimal FULL-BLEED wrapper + floating action (immersive/swipe/game); search-led header + responsive grid (marketplace); map-anchored split (geo/local). State exact nav placement, content width (full-bleed vs centered max-w-…), and the home composition. BAN the generic "centered narrow column + bottom tab bar" unless it is genuinely the only right fit.
- COLOR TOKENS: map the given palette to explicit roles — background, surface/card, primary CTA, accent, ink (primary text), muted (secondary text), border — each as a precise Tailwind arbitrary hex (bg-[#xxxxxx], text-[#xxxxxx]). Guarantee AA contrast for every text-on-surface pair (call out the exact text color used ON cards vs ON the page background). Note where a subtle gradient is used.
- TYPE: the display/heading/body/meta scale with weights (e.g. titles text-3xl font-extrabold tracking-tight; meta text-xs text-[muted]).
- COMPONENT RECIPES with concrete Tailwind classes for: card, primary button, secondary/ghost button, chip/badge, input, nav item (active+idle), avatar. Include hover/active/focus-visible/disabled states.
- MOTION: the specific CSS transitions to use (durations, transforms).
- PER-SCREEN layout for EACH screen [${bp.pages.map((p) => `${p.route} (${p.title})`).join(", ")}], including its loading/empty/error/populated states. Match interaction to the product's REAL nature: swipe/match → full-bleed card stack with like/pass; scores/standings/news/feed → dense scannable live list/table grouped sensibly (NEVER like/pass); marketplace/catalog → rich photo grid; chat → modern bubble thread. Do NOT impose swipe/like-pass unless the product is actually about swiping.` },
      { role: "user", content: `Product: ${id.name}\nPitch: ${tagline}\nPalette: ${palette || id.brandColor}\nPrimary: ${id.brandColor}  Secondary: ${(id as any).secondaryColor || ""}  Accent: ${(id as any).accentColor || ""}\nScreens: ${bp.pages.map((p) => p.route + " — " + p.title).join("; ")}` },
    ], { model: MODELS.premium, temperature: 0.6 })
  } catch { return "" }
}

/** Frontend swarm: one agent per surface → a real Next page, following the design brief. */
async function genPage(config: DomainConfig, bp: Blueprint, p: PageSpec, brief: string, shapes: string): Promise<AppFile | null> {
  const routeList = groupRoutes(bp.routes).map((rf) => `${[...rf.methods].join("/")} ${rf.path.replace(/^app/, "").replace(/\/route\.ts$/, "")} — ${rf.specs.map((s) => s.purpose).join("; ")}`).join("\n")
  const out = (await chatJSON([
    { role: "system", content: `You are a senior Frontend Engineer + Product Designer who ships interfaces at the level of Linear / Vercel / Airbnb. Write ONE Next.js 16 page (App Router) that is REAL and fully interactive (no placeholders/TODOs/lorem) AND visually premium. It MUST compile under tsc --noEmit and work against the listed APIs. The page should look like a designer obsessed over it — never an auto-generated CRUD form.

${PLAYBOOK.design}

${RULES}

${VISUAL_SYSTEM}

DESIGN BRIEF — this is the product's identity; follow it EXACTLY (layout architecture, color tokens, component recipes, per-screen composition). Every screen must share ONE bespoke identity:
${brief || "Bold, modern, mobile-first, premium. Use the brand palette as tokens with explicit contrast."}
${bp.kind === "public" && p.file === "app/page.tsx" ? "\nThis is the PUBLIC HOMEPAGE and the product itself — render the real product here (the live data, the tool), fully usable with NO login. No marketing hero, no 'Empezar gratis', no pricing.\n" : bp.kind === "public" ? "\nThis is a PUBLIC product page — no login assumed.\n" : ""}
AVAILABLE APIs (call these with fetch):
${routeList}
${shapes ? `\nAPI RESPONSE SHAPES — the data you will receive (consume these EXACT field names):\n${shapes}\n` : ""}
DATA BINDING — the rows you render come from these DB tables; read each row's fields by their EXACT snake_case column names below (e.g. \`m.home_team\`, \`m.score_home\`, \`m.match_date\`). Do NOT invent camelCase fields:
${tablesDoc(bp)}
DEFENSIVE RENDERING (critical — a contract mismatch must NEVER crash the page):
- List GET endpoints return a BARE ARRAY. After fetch+json, normalize before mapping: \`const list = Array.isArray(data) ? data : (data.items ?? data.rows ?? [])\`. NEVER call .map on the raw response.
- Access nested fields with optional chaining + fallbacks (\`x?.field ?? ""\`); never an unguarded \`x.a.b\`. Guard numbers before .toFixed (\`(x?.n ?? 0).toFixed(2)\`).
- An image with no URL → a neutral placeholder, not a crash.${bp.kind === "accounts" ? "\n- AUTH GATE: this product needs a login. If ANY data fetch returns status 401, immediately `router.replace(\"/login\")` (import useRouter from next/navigation). Pages /login and /register exist." : ""}

DELIVERY CHECKLIST — the page is not done until ALL are true:
1. Implements the brief's layout architecture for THIS screen (not a generic centered column).
2. Real data wired from the listed APIs, with correct snake_case fields.
3. All four states present and styled: loading (skeletons), empty (friendly CTA block), error (inline banner), populated (dense, beautiful).
4. Every interactive element has hover/active/focus-visible states and transitions.
5. AA contrast everywhere — re-declare text color on every colored surface (cards = light surface + dark ink). No white-on-white, no gray-on-gray.
6. Responsive: great on a 390px phone AND on desktop (real grid where it helps). Tap targets ≥44px.
7. Copy in the product's language, specific and human (no "Item 1" / "Lorem").
8. Interaction matches the product: like/pass card-stack ONLY for swipe/match; scores/news/feed → dense scannable list/table (no like/pass); marketplace → photo grid; chat → bubble thread polling every 2500ms.

Return ONLY JSON: {"code":"<the full contents of ${p.file}>"}` },
    { role: "user", content: `File: ${p.file}\nRoute: ${p.route}\nTitle: ${p.title}\nBehavior to implement EXACTLY:\n${p.behavior}\n\nProduct: ${config.identity.name}. Nav between screens: ${bp.nav.map((n) => `${n.label}→${n.href}`).join(", ")}.` },
  ], { model: MODELS.code, temperature: 0.45 })) as { code?: string }
  return out.code ? { path: p.file, content: postTsx(String(out.code).slice(0, 30_000)) } : null
}

/** Design QC (LLM): the reactive quality plane that stops generic/ugly/broken-contrast
 *  pages from shipping. Reviews ONE generated page against the brief + visual bar and
 *  returns ONLY genuine CRITICAL defects, each with a concrete code-level fix. */
async function reviewPageVisual(p: PageSpec, code: string, brief: string): Promise<{ issue: string; fix: string }[]> {
  try {
    const out = (await chatJSON([
      { role: "system", content: `You are a ruthless Design QC reviewer at a top product studio. Review ONE generated Next.js page against the design brief and the quality bar. Return ONLY genuine CRITICAL visual/UX defects that make it look generic, broken or unpolished — each with a precise, code-level fix the engineer can apply directly. No nitpicks, no praise.

${VISUAL_SYSTEM}

DESIGN BRIEF the page must honor:
${brief || "(none provided — judge against the quality bar)"}

CRITICAL = any of: text on a same/near color surface (invisible / fails AA contrast); a generic centered-column or admin look when the brief specified another architecture; missing loading/empty/error states; unstyled default buttons or inputs; no hover/focus-visible states; cramped or inconsistent spacing; a wall of plain text with no type hierarchy; placeholder/lorem copy; images with no fixed aspect ratio / overflow; not responsive on mobile.

Return ONLY JSON: {"critical":[{"issue":"short defect","fix":"exact change to make"}]}. Return an empty array if the page genuinely meets the bar — do NOT invent issues.` },
      { role: "user", content: `Page: ${p.file} (${p.title}).\n\nCODE:\n${code.slice(0, 16_000)}` },
    ], { model: MODELS.premium, temperature: 0.1 })) as { critical?: { issue: string; fix: string }[] }
    return Array.isArray(out.critical) ? out.critical.filter((c) => c?.issue && c?.fix).slice(0, 8) : []
  } catch { return [] }
}

/** Refiner: re-emit the page applying ONLY the QC fixes, preserving data wiring + logic. */
async function refinePage(p: PageSpec, code: string, fixes: { issue: string; fix: string }[]): Promise<string> {
  try {
    const out = (await chatJSON([
      { role: "system", content: `You are a senior Frontend Engineer. Apply the listed design fixes to this Next.js page WITHOUT changing its data wiring (same fetch calls, same fields) and WITHOUT breaking tsc. Keep all working logic; improve only what the fixes call out, to the quality bar below.

${VISUAL_SYSTEM}

Return ONLY JSON {"code":"<full corrected contents of ${p.file}>"}.` },
      { role: "user", content: `FIXES TO APPLY:\n${fixes.map((f) => `- ${f.issue} → ${f.fix}`).join("\n")}\n\nCURRENT CODE:\n${code}` },
    ], { model: MODELS.code, temperature: 0.3 })) as { code?: string }
    return out.code && out.code.length > 100 ? postTsx(String(out.code).slice(0, 30_000)) : code
  } catch { return code }
}

/** genPage + REACTIVE DESIGN QC LOOP: generate → QC critiques against the brief → refine,
 *  until no CRITICAL visual defect remains (max 2 cycles). This is the loop that turns
 *  "sale feo" into "sale pulido" without a human in the middle. */
async function genPolishedPage(config: DomainConfig, bp: Blueprint, p: PageSpec, brief: string, shapes: string): Promise<AppFile | null> {
  const file = await genPage(config, bp, p, brief, shapes)
  if (!file) return null
  let code = file.content
  for (let cycle = 0; cycle < 2; cycle++) {
    const critical = await reviewPageVisual(p, code, brief)
    if (!critical.length) break
    code = await refinePage(p, code, critical)
  }
  return { path: file.path, content: code }
}

/** Next 13+ forbids a nested <a> inside <Link> (runtime crash). LLMs still emit the old
 *  `<Link href=x><a className=y>z</a></Link>`. Merge the <a> attrs onto <Link>. Deterministic. */
function fixNextLinks(code: string): string {
  return code.replace(/<Link([^>]*?)>\s*<a([^>]*?)>([\s\S]*?)<\/a>\s*<\/Link>/g, (_m, l: string, a: string, inner: string) => `<Link${l}${a}>${inner}</Link>`)
}

/** All deterministic post-fixes applied to a generated .tsx (directive + Link + App-Router import). */
function postTsx(code: string): string {
  // App Router: useRouter/usePathname must come from next/navigation, NOT next/router
  // (which throws "NextRouter was not mounted"). Rewrite the import path.
  let fixed = code.replace(/from\s+["']next\/router["']/g, 'from "next/navigation"')
  // Pages sometimes hardcode placeholder coords (?lat=0&lng=0) on a near-me fetch, returning
  // nothing. Strip that query so the route uses the SAVED location / real geolocation.
  fixed = fixed.replace(/(\/api\/[\w/-]*(?:near|nearby|offer|discount|deal|cerca)[\w/-]*)\?lat=0(?:\.0+)?&lng=0(?:\.0+)?[^"'`]*/gi, "$1")
  // Strict TS: `catch (err) { … err.message }` errors as 'err is unknown' — type it. (#1 recurring compile bug.)
  fixed = fixed.replace(/catch\s*\(\s*([a-zA-Z_$][\w$]*)\s*\)\s*\{/g, "catch ($1: any) {")
  // LLM sometimes emits a stray UNQUOTED `use client;` mid-file (in addition to the real top
  // quoted directive) → TS1434 "Unexpected keyword or identifier". Strip any standalone bare
  // directive line; fixClientDirective re-adds the single quoted one at the top.
  fixed = fixed.replace(/^[ \t]*use (client|server)[ \t]*;?[ \t]*$/gm, "")
  // Pages/shells are client/server components — they must NEVER import from "next/server"
  // (NextRequest/NextResponse are route-only). The LLM hallucinates this when a page started
  // life as a copy of a route; the import breaks the client bundle. Drop the whole line.
  fixed = fixed.replace(/^[ \t]*import\s*\{[^}]*\}\s*from\s*["']next\/server["'];?[ \t]*$/gm, "")
  return fixNextLinks(fixClientDirective(fixed))
}

/** Deterministically normalize the React "use client" directive. LLMs sometimes
 *  emit it WITHOUT quotes (`use client;` → TS1434) or omit it on pages that use
 *  client hooks. Both break compilation; fix them here, not via the CI fixer. */
function fixClientDirective(code: string): string {
  let c = code.replace(/^﻿/, "")
  // Strip EVERY existing directive wherever it sits (top, or — the bug — misplaced after
  // imports as a duplicate). Both quoted and bare forms. Then re-add a single one at the top
  // if the file needs it. Next.js: the directive MUST be the very first expression.
  const had = /(?:^|\n)[ \t]*["']use client["'][ \t]*;?/.test(c) || /(?:^|\n)[ \t]*use client[ \t]*;?[ \t]*$/m.test(c)
  c = c.replace(/(?:^|\n)[ \t]*["']use client["'][ \t]*;?[ \t]*/g, "\n")
  c = c.replace(/(?:^|\n)[ \t]*use client[ \t]*;?[ \t]*$/gm, "")
  c = c.replace(/^\s+/, "")
  const needs = had || /\b(useState|useEffect|useRouter|usePathname|onClick|onChange|onSubmit)\b/.test(c)
  return needs ? '"use client";\n' + c : c
}

/** Minimal deterministic FALLBACK shell — only used if the bespoke generated shell
 *  fails. Kept intentionally plain; the real shell is genAppShell (bespoke per product). */
function fallbackShell(bp: Blueprint): AppFile {
  const links = (bp.nav.length ? bp.nav : [{ label: "Inicio", href: "/app" }]).map((n) => `{label:${JSON.stringify(n.label)},href:${JSON.stringify(n.href)}}`).join(",")
  return {
    path: "app/app/layout.tsx",
    content: `"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const [ok, setOk] = useState(false)
  useEffect(() => { let a = true; fetch("/api/auth/me").then(r => { if (!a) return; r.ok ? setOk(true) : router.replace("/login") }).catch(() => router.replace("/login")); return () => { a = false } }, [router])
  if (!ok) return <div className="min-h-screen grid place-items-center text-black/40">…</div>
  return (<div className="min-h-screen"><nav className="flex gap-2 p-3 border-b">{[${links}].map((i:{label:string;href:string}) => <Link key={i.href} href={i.href} className="px-3 py-1.5 rounded-lg font-semibold" style={{ background: "var(--brand,#7C3AED)", color: "#fff" }}>{i.label}</Link>)}</nav><main>{children}</main></div>)
}
`,
  }
}

/** Frontend Architect: generate a BESPOKE app shell/layout for THIS product — its own
 *  navigation pattern and overall structure (sidebar / top-bar+tabs / full-bleed /
 *  dashboard …), NOT a fixed template. Preserves the client-side auth gate. This is the
 *  fix for "every app has the same structure": the skeleton itself is generated. */
async function genAppShell(config: DomainConfig, brief: string, bp: Blueprint): Promise<AppFile | null> {
  if (bp.kind === "public") return null // public product: no auth gate; the homepage IS the product
  const nav = (bp.nav.length ? bp.nav : [{ label: "Inicio", href: "/app" }]).map((n) => `${n.label} → ${n.href}`).join(", ")
  try {
    const out = (await chatJSON([
      { role: "system", content: `You are a Frontend Architect. Write app/app/layout.tsx — the SHELL that wraps every in-app screen. Make its STRUCTURE genuinely BESPOKE to this product; do NOT default to a centered column with a bottom tab-bar. Choose the navigation + layout architecture that actually fits the product, e.g.:
- data/dashboard/admin → a fixed LEFT SIDEBAR with sections + a top header.
- scores/news/feed → a sticky TOP BAR with horizontal tabs, full-width content.
- immersive/swipe/game → a minimal full-bleed wrapper, maybe a floating action bar.
- marketplace → top search/header + content; etc.
Pick ONE coherent architecture and commit to it; different products must yield different skeletons.

HARD REQUIREMENTS:
- "use client" at the top.
- Client-side auth gate: useEffect → fetch("/api/auth/me"); if response not ok → useRouter().replace("/login"); render a small loading state until checked.
- Render {children} as the main content area.
- Build the navigation from these items (use next/link <Link>, highlight the active route via usePathname): ${nav}
- Tailwind classes only; use the palette from the brief (Tailwind arbitrary hex like bg-[#xxxxxx]); responsive (works on mobile AND desktop). No external libraries.
- It must compile under tsc --noEmit (type children: React.ReactNode).
- The chrome itself must look premium: real active/idle nav states (active item gets brand bg or a brand underline/indicator + bolder weight; idle is muted with hover), proper spacing, a hairline divider/shadow separating nav from content, an app wordmark/logo lockup. On mobile the nav collapses sensibly (e.g. bottom bar or a top bar) — never overflow.

${VISUAL_SYSTEM}

DESIGN BRIEF (follow its layout architecture, color tokens + component recipes):
${brief || "Pick a distinctive, premium layout for the product."}

Return ONLY JSON {"code":"<full contents of app/app/layout.tsx>"}` },
      { role: "user", content: `Product: ${config.identity.name} — ${typeof config.identity.tagline === "string" ? config.identity.tagline : ""}\nScreens: ${bp.pages.map((p) => `${p.route} (${p.title})`).join(", ")}` },
    ], { model: MODELS.code, temperature: 0.5 })) as { code?: string }
    if (!out.code || !/auth\/me/.test(out.code) || out.code.length < 200) return null
    return { path: "app/app/layout.tsx", content: postTsx(String(out.code).slice(0, 16_000)) }
  } catch { return null }
}

/** Completeness Critic (LLM): find journey steps that break (content listable but
 *  not creatable, chat readable but not sendable, unscoped reads) → missing pieces. */
async function critiqueBlueprint(config: DomainConfig, bp: Blueprint): Promise<{ addRoutes: RouteSpec[]; addPages: PageSpec[] }> {
  const summary = { tables: bp.tables.map((t) => t.name), routes: bp.routes.map((r) => ({ path: r.path, methods: r.methods, purpose: r.purpose })), pages: bp.pages.map((p) => ({ route: p.route, title: p.title })) }
  try {
    const out = (await chatJSON([
      { role: "system", content: `You are the Completeness Critic. Find every place a real user journey BREAKS because something is missing, and return ONLY the missing pieces.
Check: a CREATE (POST) route AND a create page for every user-generated content type? chat with BOTH send (POST) and list (GET), each scoped to participants? every route reachable from a page, every page's routes present?
Return ONLY JSON: {"addRoutes":[{"path":"app/api/.../route.ts","methods":["POST"],"purpose":"...","logic":"precise SQL + scoping, exact tables/columns"}],"addPages":[{"route":"/app/...","file":"app/app/.../page.tsx","title":"...","behavior":"precise behavior + which routes it calls"}]}. Empty arrays if complete. No duplicates of existing routes/pages.
HARD RULE (anti-contamination): use ONLY the EXACT table & column names listed below. Do NOT invent new tables, and do NOT introduce ANY entity that is not part of THIS product's domain (e.g. never add sports leagues/countries to a status page). If a journey is already complete, return empty arrays — do not pad.
DB tables:\n${tablesDoc(bp)}\n\n${SPINE_API}` },
      { role: "user", content: `Product: ${config.identity.name} — ${typeof config.identity.tagline === "string" ? config.identity.tagline : ""}\nBlueprint:\n${JSON.stringify(summary, null, 1)}\n\nRoute logic:\n${bp.routes.map((r) => `${r.path}: ${r.logic}`).join("\n")}` },
    ], { model: MODELS.premium, temperature: 0.2 })) as { addRoutes?: RouteSpec[]; addPages?: PageSpec[] }
    const haveR = new Set(bp.routes.map((r) => r.path)), haveP = new Set(bp.pages.map((p) => p.file))
    // Deterministic anti-contamination guard: a proposed route may only reference tables that
    // already exist in the blueprint (the critic doesn't get to invent the schema).
    const known = bp.tables.map((t) => t.name.toLowerCase())
    const tablesInLogic = (logic: string) => (logic.match(/\b(?:from|join|into|update)\s+([a-z_][a-z0-9_]*)/gi) || []).map((m) => m.split(/\s+/).pop()!.toLowerCase())
    const cleanRoute = (r: RouteSpec) => tablesInLogic(String(r.logic || "")).every((t) => known.includes(t) || ["users", "user_locations"].includes(t))
    return {
      addRoutes: (Array.isArray(out.addRoutes) ? out.addRoutes : []).filter((r) => r?.path && r?.logic && !haveR.has(r.path) && cleanRoute(r)),
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
7. LIST RESPONSE SHAPE: a GET returning a list/collection MUST return the BARE ARRAY (return NextResponse.json(rows)), never wrapped like { matches: rows } or { data: rows }. Keep each row's exact snake_case DB column names. (Wrapping is the #1 cause of "x.map is not a function" on the page.)

THE SCHEMA (authoritative — these are the only tables/columns that exist):
${schemaSql}

Return ONLY JSON {"code":"<full corrected file>"}. If nothing needs fixing, return the file unchanged.` },
      { role: "user", content: `File ${file.path}:\n${file.content}` },
    ], { model: MODELS.code, temperature: 0.1 })) as { code?: string }
    const fixed = out.code && out.code.length > 40 ? String(out.code).slice(0, 30_000) : file.content
    return { path: file.path, content: fixAuthUserFields(fixed) }
  } catch { return { path: file.path, content: fixAuthUserFields(file.content) } }
}

/** Spine auth payload is {userId,email,plan} — the LLM sometimes writes `u.id` (TS2339:
 *  Property 'id' does not exist on JWTPayload). Find the variable bound to getAuthUser()
 *  and rewrite its `.id` accesses to `.userId`. Generalizable to any accounts product. */
function fixAuthUserFields(code: string): string {
  const m = code.match(/(?:const|let)\s+([a-zA-Z_$][\w$]*)\s*=\s*await\s+getAuthUser\s*\(/)
  if (!m) return code
  const v = m[1]
  return code.replace(new RegExp(`\\b${v}\\.id\\b`, "g"), `${v}.userId`)
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
  const radius = Number(sp.get("radius")) || 25
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const loc = await pool.query("SELECT latitude, longitude FROM user_locations WHERE user_id=$1", [u.userId])
    if (!loc.rows[0]) return NextResponse.json([])
    lat = loc.rows[0].latitude; lng = loc.rows[0].longitude
  }
  const { rows } = await pool.query(
    \`SELECT * FROM (
       SELECT DISTINCT ON (t.offer_id) * FROM (
         SELECT o.id AS offer_id, o.*, to_json(m) AS merchant, b.address, b.${latCol} AS latitude, b.${lngCol} AS longitude, p.name AS program_name,
           (6371 * acos(LEAST(1, cos(radians($1)) * cos(radians(b.${latCol})) * cos(radians(b.${lngCol}) - radians($2)) + sin(radians($1)) * sin(radians(b.${latCol}))))) AS distance_km
         FROM ${offers.name} o
         JOIN ${branches.name} b ON b.${bMerchant} = o.${oMerchant}
         ${merchants ? `JOIN ${merchants.name} m ON m.id = o.${oMerchant}` : ""}
         JOIN ${programs.name} p ON p.id = o.${oProgram}
         WHERE o.${oProgram} IN (SELECT ${mProgram} FROM ${memberships.name} WHERE ${mUser} = $3)
       ) t
       WHERE t.distance_km <= $4
       ORDER BY t.offer_id, t.distance_km ASC
     ) d
     ORDER BY d.distance_km ASC
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
function deterministicMembershipContent(tables: TableSpec[]): { tableName: string; content: string; ddl: string } | null {
  const parsed = tables.map((t) => parseTable(t.ddl))
  const programs = parsed.find((t) => /program|card|loyalty|plan/.test(t.name) && !/user|member/.test(t.name))
  const mem = parsed.find((t) => /member/.test(t.name) && t.cols.some((c) => c.ref === "users" || /user_id/.test(c.name)) && t.cols.some((c) => /program|card|plan/.test(c.name)))
  if (!mem || !programs) return null
  const uCol = mem.cols.find((c) => c.ref === "users" || /user_id/.test(c.name))!.name
  const pCol = mem.cols.find((c) => /program|card|plan/.test(c.name))!.name
  // Clean minimal join: "owning a program" needs only (user, program). LLMs add NOT NULL
  // extras (membership_number/expiration_date) that break a simple toggle — drop them.
  const ddl = `CREATE TABLE IF NOT EXISTS ${mem.name} (\n  id BIGSERIAL PRIMARY KEY,\n  ${uCol} BIGINT REFERENCES users(id),\n  ${pCol} BIGINT REFERENCES ${programs.name}(id),\n  UNIQUE(${uCol}, ${pCol})\n);`
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
  return { tableName: mem.name, content, ddl }
}

/** Order tables so a table is emitted AFTER everything it REFERENCES (FK deps). Run as
 *  a batch, an out-of-order CREATE (references a not-yet-created table) aborts the whole
 *  schema — this prevents that. Spine tables (users…) already exist; self-refs ignored. */
function sortTablesByDeps(tables: TableSpec[]): TableSpec[] {
  const SPINE = new Set(["users", "auth_tokens", "records", "page_visits", "analytics_events", "sessions"])
  const byName = new Map(tables.map((t) => [parseTable(t.ddl).name, t]))
  const deps = new Map<string, Set<string>>()
  for (const t of tables) {
    const p = parseTable(t.ddl)
    const d = new Set<string>()
    for (const c of p.cols) if (c.ref && c.ref !== p.name && !SPINE.has(c.ref) && byName.has(c.ref)) d.add(c.ref)
    deps.set(p.name, d)
  }
  const ordered: TableSpec[] = [], done = new Set<string>()
  const visit = (name: string, stack: Set<string>) => {
    if (done.has(name) || !byName.has(name)) return
    if (stack.has(name)) return // cycle guard
    stack.add(name)
    for (const dep of deps.get(name) || []) visit(dep, stack)
    stack.delete(name); done.add(name); ordered.push(byName.get(name)!)
  }
  for (const t of tables) visit(parseTable(t.ddl).name, new Set())
  return ordered
}

const SEED_SKIP = new Set(["users", "auth_tokens", "records", "page_visits", "analytics_events", "sessions"])

/** Data Ingestion agent: products that aggregate a CATALOG (offers, places, programs,
 *  listings curated/scraped from external sources) are useless empty. Generate a
 *  REALISTIC seed (real, plausible data for the product's market) for the catalog
 *  tables — NOT user/auth or user-owned tables. Generalizable to any aggregator. */
/** Researcher: for a data-driven product, identify the REAL external data source(s) and an
 *  ingestion plan, so the seed/catalog mirrors the real provider's schema and a cron can pull
 *  live data instead of inventing it. Returns a concise plan; safe (returns empty on failure). */
export async function researchProduct(config: DomainConfig): Promise<{ dataDriven: boolean; plan: string }> {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  try {
    const out = (await chatJSON([
      { role: "system", content: `You are the Domain Researcher. Determine whether this product depends on EXTERNAL/LIVE data (sports scores, prices, flights, weather, listings, stocks, news…) vs purely user-generated data. If external, identify the BEST REAL data source(s) — prefer official/free APIs (name them, note free-tier limits + which fields they expose: e.g. live, events, lineups, stats), fall back to scraping only if no API fits — and outline a concrete ingestion plan (which endpoints, what cadence given the limits, what tables they populate, what to cache). Be specific and realistic; this drives a cron that pulls into Postgres. If the product is NOT data-driven, say so.
Return ONLY JSON: {"dataDriven": boolean, "plan": "markdown: sources (with free-tier notes), endpoints, cadence, mapping to tables"}.` },
      { role: "user", content: `Product: ${config.identity.name}\nPitch: ${tagline}\nEntities: ${(config.entities || []).map((e) => e.name).join(", ")}` },
    ], { model: MODELS.premium, temperature: 0.3 })) as { dataDriven?: boolean; plan?: string }
    return { dataDriven: !!out.dataDriven, plan: String(out.plan || "") }
  } catch { return { dataDriven: false, plan: "" } }
}

async function genCatalogSeed(config: DomainConfig, bp: Blueprint, research?: string): Promise<AppFile | null> {
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
- For date/time columns that represent CURRENT or live activity (matches, events, sessions happening now), use SQL expressions RELATIVE TO NOW — NOW(), CURRENT_DATE, NOW() + INTERVAL '2 hours', CURRENT_DATE - INTERVAL '1 day' — NOT fixed past literal dates. Put SEVERAL rows AT today/now (mix some finished in the past, some happening today, some upcoming) so "today/live" views are populated on first run.
- Generate enough rows to feel real (e.g. 8-12 programs, 12-20 merchants, 1-3 branches each, an offer per merchant tied to a program; for a scores/league app: 2-3 tournaments, 10+ teams, 12+ matches with several dated today, a full standings row per team).
- Use ONLY the exact table & column names in the DDL. Strings single-quoted, escape apostrophes by doubling.
- Do NOT seed user/auth/membership/selection tables (users fill those).
Return ONLY JSON {"sql":"-- seed\\nINSERT INTO ...;\\n..."}.` },
      { role: "user", content: `Product: ${config.identity.name}\nPitch: ${tagline}\n${research ? `\nDATA SOURCE RESEARCH (mirror this real provider's schema/values so a cron can later replace the seed with live data):\n${research}\n` : ""}\nCATALOG TABLES (seed exactly these):\n${catalog.map((t) => t.ddl).join("\n\n")}` },
    ], { model: MODELS.code, temperature: 0.4 })) as { sql?: string }
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

/** Data Engineer: the agent that was MISSING. Turns the researcher's data-source plan + the
 *  real schema into a WORKING ingestion route (fetch the source → upsert into our tables),
 *  with a mock fallback so it runs before the API key exists. Replaces the SELECT-1 stub for
 *  data-driven products — the single biggest reason generated products "no funcionan". */
async function genIngestionCron(config: DomainConfig, bp: Blueprint, research: string): Promise<AppFile | null> {
  try {
    const out = (await chatJSON([
      { role: "system", content: `You are a Data Engineer. Write app/api/cron/refresh/route.ts: a REAL ingestion job that pulls the product's live/external data from the source in the RESEARCH PLAN and UPSERTS it into the EXACT tables below. This must actually work — NO "SELECT 1" placeholder, NO TODO.

HARD RULES (spine):
- Next.js 16 route. import { NextRequest, NextResponse, after } from "next/server"; import { pool } from "@/lib/db"; NO other npm deps (use global fetch).
- The API key comes from process.env (name it from the research, e.g. process.env.<PROVIDER>_KEY). If the key is ABSENT, fall back to a small inline MOCK (a few realistic rows) so the pipeline is verifiable offline — same upsert path.
- Map the provider's response fields to our columns EXACTLY (use the DDL below). Parameterized SQL only. UPSERT by a stable external id (add ON CONFLICT on a unique api id column if present, else delete-by-scope then insert).
- Fire-and-forget: GET schedules the work in after() and returns immediately; support ?sync=1 to await (for testing). Auth: if process.env.CRON_SECRET is set, require ?key= or x-cron-secret.
- Tune cadence in comments to respect the provider's free-tier limits (pull live often, static data rarely).

RESEARCH PLAN (the real source + endpoints + cadence):
${research}

TARGET TABLES (upsert into these EXACT columns):
${tablesDoc(bp)}

Return ONLY JSON {"code":"<full contents of app/api/cron/refresh/route.ts>"}.` },
      { role: "user", content: `Product: ${config.identity.name}. Generate the working ingestion route.` },
    ], { model: MODELS.code, temperature: 0.2 })) as { code?: string }
    return out.code && out.code.length > 200 ? { path: "app/api/cron/refresh/route.ts", content: String(out.code).slice(0, 30_000) } : null
  } catch { return null }
}

/** Page↔route path reconciliation: pages and routes are generated by separate agents
 *  and sometimes pick DIFFERENT paths for the same endpoint (home fetches /api/nearby
 *  but the route is at /api/offers → 404). For each API path a PAGE calls that has no
 *  route file, mirror the matching deterministic route (nearby/location/membership) to
 *  that path so the UI's calls always resolve. General; no-op when paths already align. */
function reconcilePageRoutes(files: AppFile[]): void {
  const isRoute = (p: string) => /\/route\.ts$/.test(p)
  const routePaths = new Set(files.filter((f) => isRoute(f.path)).map((f) => f.path))
  const pick = (re: RegExp, not?: RegExp) => files.find((f) => isRoute(f.path) && re.test(f.content) && (!not || !not.test(f.content)))?.content
  const nearby = pick(/acos|distance_km/i)
  const loc = pick(/insert\s+into\s+user_locations/i, /acos/i)
  const mem = pick(/Deterministic membership toggle/)
  for (const pg of files.filter((f) => /\/page\.tsx$/.test(f.path))) {
    const apis = [...new Set((pg.content.match(/['"`]\/api\/[\w/-]+/g) || []).map((s) => s.slice(1)))]
    for (const api of apis) {
      const rp = `app${api}/route.ts`
      if (routePaths.has(rp)) continue
      const content = /near|offer|discount|deal|cerca/i.test(api) ? nearby
        : /location|ubicac|geoloc/i.test(api) ? loc
        : /member|program|loyal|card/i.test(api) ? mem : null
      if (content) { files.push({ path: rp, content }); routePaths.add(rp) }
    }
  }
}

/** THE INTEGRATOR (the "queen bee"): after the swarm generates pages + routes
 *  independently, this single pass enforces global coherence — every API path a PAGE
 *  fetches MUST resolve to a real generated route. When a page calls a path that has no
 *  route (e.g. /api/live-football while the route is /api/live-football-data), rewrite
 *  the page's fetch to the closest real route path. Deterministic; fixes the #1 swarm
 *  failure (independent agents inventing mismatched paths). */
function integratePageRoutes(files: AppFile[]): void {
  const routePaths = files
    .filter((f) => /\/route\.ts$/.test(f.path))
    .map((f) => "/" + f.path.replace(/^app\//, "").replace(/\/route\.ts$/, "")
      .replace(/\/\[[^\]]+\]/g, "")) // collapse dynamic segments for matching
  const realPaths = files.filter((f) => /\/route\.ts$/.test(f.path)).map((f) => "/" + f.path.replace(/^app\//, "").replace(/\/route\.ts$/, ""))
  const realSet = new Set(realPaths)
  const commonPrefix = (a: string, b: string) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i }
  for (const pg of files.filter((f) => /\.tsx$/.test(f.path))) {
    pg.content = pg.content.replace(/(["'`])(\/api\/[\w/-]+)/g, (m, q: string, path: string) => {
      if (realSet.has(path)) return m // already resolves
      // dynamic-route call (e.g. /api/x/123) — match against collapsed paths
      const collapsed = path.replace(/\/\d+(?=\/|$)/g, "")
      if (routePaths.includes(collapsed)) return m
      let best = "", score = 0
      for (const rp of realPaths) { const s = commonPrefix(path, rp); if (s > score) { score = s; best = rp } }
      // require a real overlap beyond "/api/" (5 chars) so we don't snap to an unrelated route
      return best && score >= 8 ? q + best : m
    })
  }
}

/** Guarantee a bespoke homepage at "/" (app/page.tsx) — the product itself, since the
 *  spine landing is no longer copied. Adds it if the architect didn't include it. */
function ensureHomepage(bp: Blueprint): void {
  if (bp.pages.some((p) => p.file === "app/page.tsx" || p.route === "/")) return
  const first = bp.pages[0]
  bp.pages.unshift({
    route: "/",
    file: "app/page.tsx",
    title: bp.summary.split(/[.\n]/)[0].slice(0, 40) || "Inicio",
    behavior: `The product's main homepage — render the actual product here (${bp.summary.slice(0, 160)}). ${bp.kind === "public" ? "Public, no login." : "Real entry screen."} ${first ? `It links to the other screens (${bp.pages.map((p) => p.route).join(", ")}).` : ""}`,
  })
  if (!bp.nav.some((n) => n.href === "/")) bp.nav.unshift({ label: "Inicio", href: "/" })
}

/** Accounts apps need working auth UI, but the spine's login/register pages are dropped
 *  (they depend on dropped template components and redirect to /app). Emit BESPOKE,
 *  self-contained login + register pages — branded, posting to the spine's auth API,
 *  redirecting to "/" (the product). Deterministic so auth always works for a real user. */
function ensureAuthPages(config: DomainConfig, files: AppFile[]): void {
  const id = config.identity
  const brand = (id.brandColor || "#7C3AED").replace(/[^#\w]/g, "")
  const name = (id.name || "App").replace(/[<>{}"]/g, "")
  const tagline = (config.identity as any).tagline || ""
  const field = `w-full border border-black/10 rounded-lg px-3 py-2.5 outline-none focus:border-[${brand}]`
  const btn = `w-full text-white font-semibold py-2.5 rounded-lg transition-transform hover:scale-[1.02] disabled:opacity-60`
  const wrap = (title: string, fields: string, submitLabel: string, footer: string, onSubmit: string) => `"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BRAND = "${brand}";

export default function Page() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
${onSubmit}
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Algo salió mal"); return; }
      router.push("/");
    } catch { setError("Error de red"); } finally { setLoading(false); }
  }
  return (
    <main className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-3xl font-extrabold mb-1" style={{ color: BRAND }}>${name}</Link>
        <p className="text-center text-black/60 mb-6">${tagline}</p>
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-md p-6 space-y-3">
          <h1 className="text-xl font-bold text-black/80">${title}</h1>
${fields}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="${btn}" style={{ background: BRAND }} disabled={loading}>{loading ? "…" : "${submitLabel}"}</button>
          ${footer}
        </form>
      </div>
    </main>
  );
}
`
  const inp = (k: string, ph: string, type = "text") => `          <input className="${field}" type="${type}" placeholder="${ph}" value={form.${k} || ""} onChange={set("${k}")} />`
  const login = wrap("Iniciar sesión",
    [inp("email", "Email", "email"), inp("password", "Contraseña", "password")].join("\n"),
    "Entrar",
    `<p className="text-center text-sm text-black/60">¿No tenés cuenta? <Link href="/register" className="font-semibold" style={{ color: BRAND }}>Crear una</Link></p>`,
    `      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email, password: form.password }) });`)
  const register = wrap("Crear cuenta",
    [inp("name", "Nombre"), inp("email", "Email", "email"), inp("password", "Contraseña", "password")].join("\n"),
    "Empezar gratis",
    `<p className="text-center text-sm text-black/60">¿Ya tenés cuenta? <Link href="/login" className="font-semibold" style={{ color: BRAND }}>Iniciar sesión</Link></p>`,
    `      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email, password: form.password, name: form.name, profile: {} }) });`)
  if (!files.some((f) => f.path === "app/login/page.tsx")) files.push({ path: "app/login/page.tsx", content: login })
  if (!files.some((f) => f.path === "app/register/page.tsx")) files.push({ path: "app/register/page.tsx", content: register })
}

/** Resumable build state — JSON-serializable so a long build survives across many
 *  serverless invocations (Vercel caps a single request, the full build takes minutes). */
export interface EngineState {
  phase: "plan" | "critique" | "brief" | "routes" | "pages" | "finalize" | "done"
  blueprint: Blueprint | null
  brief: string
  ri: number
  pi: number
  files: AppFile[]
  connectorDeps?: Record<string, string> // extra npm deps from injected connectors (whatsapp/email/telegram)
}
export function initEngineState(): EngineState {
  return { phase: "plan", blueprint: null, brief: "", ri: 0, pi: 0, files: [] }
}
/** Start the engine from an ALREADY-CHOSEN blueprint (the genetic tournament's winner),
 *  skipping the plan phase so the winning team builds ITS design (iteration 3). */
export function initEngineStateWith(blueprint: Blueprint): EngineState {
  return { phase: "critique", blueprint, brief: "", ri: 0, pi: 0, files: [] }
}

/** Advance the build by ONE bounded unit so each fits a serverless time budget. The plan is
 *  split (blueprint / critique / brief) and routes+pages are one-at-a-time because a single
 *  multi-LLM-call unit can exceed Vercel's request limit and silently restart forever. */
export async function buildAdvance(config: DomainConfig, contracts: string, research: string, reference: string, state: EngineState): Promise<{ state: EngineState; done: boolean; detail: string }> {
  const s = state
  if (s.phase === "plan") {
    const blueprint = await planBlueprint(config, contracts, reference)
    if (!blueprint.routes.length && !blueprint.pages.length) { s.blueprint = blueprint; s.phase = "done"; return { state: s, done: true, detail: "blueprint vacío" } }
    s.blueprint = blueprint; s.phase = "critique"
    return { state: s, done: false, detail: `blueprint: ${blueprint.tables.length} tablas · ${groupRoutes(blueprint.routes).length} rutas · ${blueprint.pages.length} páginas` }
  }
  const bp = s.blueprint!
  if (s.phase === "critique") {
    const gaps = await critiqueBlueprint(config, bp)
    bp.routes.push(...gaps.addRoutes); bp.pages.push(...gaps.addPages)
    if (bp.kind !== "public") ensureContentCreation(bp)
    ensureHomepage(bp)
    const seen = new Set<string>()
    bp.pages = bp.pages.filter((p) => (seen.has(p.file) ? false : seen.add(p.file)))
    s.phase = "brief"
    return { state: s, done: false, detail: `completitud: ${groupRoutes(bp.routes).length} rutas · ${bp.pages.length} páginas` }
  }
  const schemaSql = sortTablesByDeps(bp.tables).map((t) => t.ddl).join("\n\n")
  if (s.phase === "brief") {
    const brief = await genDesignBrief(config, bp).catch(() => "")
    const files: AppFile[] = []
    if (schemaSql) files.push({ path: "sql/app.sql", content: `-- ${config.identity.name} — bespoke app schema (run after the spine's 001/002/003).\n\n${schemaSql}\n` })
    if (brief) files.push({ path: "docs/DESIGN.md", content: `# Design brief — ${config.identity.name}\n\n${brief}\n` })
    s.brief = brief; s.files = files; s.ri = 0; s.pi = 0; s.phase = "routes"
    return { state: s, done: false, detail: "diseño + esquema listos" }
  }
  if (s.phase === "routes") {
    const routeFiles = groupRoutes(bp.routes)
    if (s.ri >= routeFiles.length) { s.phase = "pages"; return { state: s, done: false, detail: "rutas listas → páginas" } }
    const rf = routeFiles[s.ri]
    const f = await genRouteFile(config, bp, rf).then((x) => (x ? hardenRoute(x, schemaSql) : null)).catch(() => null)
    if (f) s.files.push(f)
    s.ri++
    return { state: s, done: false, detail: `ruta ${s.ri}/${routeFiles.length}: ${rf.path.replace(/^app\/api\//, "").replace(/\/route\.ts$/, "")}` }
  }
  if (s.phase === "pages") {
    if (s.pi >= bp.pages.length) { s.phase = "finalize"; return { state: s, done: false, detail: "páginas listas → ensamblaje" } }
    const matchesDet = deterministicMatchesRoute(bp.tables, [])
    const geoDet = deterministicGeo(bp.tables, [])
    const shapes = [matchesDet?.shape, geoDet?.shape].filter(Boolean).join("\n")
    const p = bp.pages[s.pi]
    const f = await genPage(config, bp, p, s.brief, shapes).catch(() => null)
    if (f) s.files.push(f)
    s.pi++
    return { state: s, done: false, detail: `página ${s.pi}/${bp.pages.length}: ${p.route}` }
  }
  if (s.phase === "finalize") {
    const files = s.files
    const swipeFile = deterministicSwipeRoute(bp.tables, files.map((f) => f.path))
    if (swipeFile) { const i = files.findIndex((f) => f.path === swipeFile.path); if (i >= 0) files[i] = swipeFile; else files.push(swipeFile) }
    const matchesOverride = deterministicMatchesRoute(bp.tables, files.map((f) => f.path))
    if (matchesOverride) { const i = files.findIndex((f) => f.path === matchesOverride.file.path); if (i >= 0) files[i] = matchesOverride.file; else files.push(matchesOverride.file) }
    const geo = deterministicGeo(bp.tables, files.map((f) => f.path))
    if (geo) {
      const sqlF = files.find((f) => f.path === "sql/app.sql")
      if (sqlF && !/user_locations/.test(sqlF.content)) sqlF.content += `\n\n-- user location store (Puglit geo capability)\n${geo.extraSql}\n`
      for (const gf of geo.files) { const i = files.findIndex((f) => f.path === gf.path); if (i >= 0) files[i] = gf; else files.push(gf) }
    }
    const mem = deterministicMembershipContent(bp.tables)
    if (mem) {
      const idx = files.findIndex((f) => /route\.ts$/.test(f.path) && new RegExp(`(insert\\s+into|from|delete\\s+from)\\s+${mem.tableName}\\b`, "i").test(f.content) && !/acos|distance_km/i.test(f.content))
      if (idx >= 0) files[idx] = { path: files[idx].path, content: mem.content }
      const sqlF = files.find((f) => f.path === "sql/app.sql")
      if (sqlF) sqlF.content = sqlF.content.replace(new RegExp(`CREATE TABLE(?: IF NOT EXISTS)?\\s+${mem.tableName}\\s*\\([\\s\\S]*?\\);`, "i"), mem.ddl)
    }
    const seed = await genCatalogSeed(config, bp, research).catch(() => null)
    if (seed) { files.push(seed); const ingest = research ? await genIngestionCron(config, bp, research).catch(() => null) : null; files.push(ingest || refreshCron(config)) }
    // reusable channel connectors (WhatsApp / email / Telegram) — injected pre-built when the
    // product needs messaging, so the swarm reuses them instead of regenerating an IMAP client.
    const conn = deterministicConnectors(config, bp)
    if (conn) {
      for (const f of conn.files) if (!files.some((x) => x.path === f.path)) files.push(f)
      const sqlF = files.find((f) => f.path === "sql/app.sql")
      if (sqlF && !/channel_messages/.test(sqlF.content)) sqlF.content += `\n\n-- omnichannel inbox (Puglit connectors)\n${conn.extraSql}\n`
      s.connectorDeps = conn.deps // surfaced to the package.json assembler
    }
    // OAuth/SaaS integration plumbing (Nango) — reused so the app never reinvents OAuth.
    const integ = deterministicIntegrations(config, bp)
    if (integ) for (const f of integ.files) if (!files.some((x) => x.path === f.path)) files.push(f)
    // VOICE (STT listen + TTS speak) — the "voice first" capability.
    const voice = deterministicVoice(config, bp)
    if (voice) for (const f of voice.files) if (!files.some((x) => x.path === f.path)) files.push(f)
    // AGENT brain (JARVIS pattern) — omnichannel AI assistant with identity mapping + memory.
    const agent = deterministicAgent(config, bp)
    if (agent) {
      for (const f of agent.files) if (!files.some((x) => x.path === f.path)) files.push(f)
      const sqlF = files.find((f) => f.path === "sql/app.sql")
      if (sqlF && !/agent_contacts/.test(sqlF.content)) sqlF.content += `\n\n-- AI agent (identity + memory) — Puglit JARVIS brain\n${agent.extraSql}\n`
    }
    // CUSTOM modules the swarm built in past projects → reuse their code if this product matches.
    const need = `${config.identity.name} ${typeof config.identity.tagline === "string" ? config.identity.tagline : ""} ${bp.summary}`
    for (const cm of await findCustomModulesFor(need).catch(() => [])) for (const f of cm.files || []) if (!files.some((x) => x.path === f.path)) files.push(f)
    // HARVEST: register any reusable connector/integration the agents wrote that's new → the
    // module directory GROWS from the swarm's own work, available to every future project.
    await harvestModules(files, bp.kind).catch(() => {})
    reconcilePageRoutes(files)
    integratePageRoutes(files)
    if (bp.kind === "accounts") {
      ensureAuthPages(config, files)
      const shell = (await genAppShell(config, s.brief, bp).catch(() => null)) || fallbackShell(bp)
      const si = files.findIndex((f) => f.path === shell.path)
      if (si >= 0) files[si] = shell; else files.push(shell)
    }
    s.phase = "done"
    return { state: s, done: true, detail: `${files.length} archivos generados` }
  }
  return { state: s, done: true, detail: "done" }
}

/** One-shot build (local/CLI): loop buildAdvance until done. Serverless uses buildAdvance directly. */
export async function buildBespokeApp(config: DomainConfig, contracts: string, research?: string, reference?: string): Promise<{ files: AppFile[]; blueprint: Blueprint }> {
  let st = initEngineState()
  for (let i = 0; i < 300; i++) { const r = await buildAdvance(config, contracts, research || "", reference || "", st); st = r.state; if (r.done) break }
  return { files: st.files, blueprint: st.blueprint || { kind: "public", tables: [], routes: [], pages: [], nav: [], summary: "" } }
}
