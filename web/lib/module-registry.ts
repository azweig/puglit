/**
 * module-registry.ts — the LIVING module directory.
 *
 *  - Agents SEE it: moduleCatalog() is injected into their prompts so they reuse what exists.
 *  - Agents EXTEND it: when a build produces a reusable connector/integration that isn't in
 *    the catalog, harvestModules() registers it → the directory GROWS.
 *  - Agents HEAL it: registerModule() upserts (version bump) → improvements/fixes flow back.
 *
 * Builtins (telegram/email/whatsapp/slack/discord/teams/apprise/nango) keep their code in
 * connectors.ts / integrations.ts; their metadata is catalogued here. Swarm-created modules
 * live in Postgres (puglit_modules) + are mirrored to modules/<name>/ for git review.
 */
import { query } from "@/lib/db"
import { writeFileSync, mkdirSync } from "node:fs"
import { join, basename } from "node:path"

export interface ModuleFile { path: string; content: string }
export interface Module {
  name: string
  category: "channel" | "integration" | "util" | "agent"
  description: string
  whenToUse?: string
  envVars?: string[]
  deps?: Record<string, string>
  gateway?: string
  files?: ModuleFile[]
  version?: number
  status?: string
}

/** Metadata for the builtin modules (their code is injected by connectors.ts / integrations.ts). */
export const BUILTIN_MODULES: Module[] = [
  { name: "telegram", category: "channel", description: "Telegram bot — bidirectional, zero deps (Bot API + long polling).", whenToUse: "the product sends/receives Telegram messages", envVars: ["TELEGRAM_BOT_TOKEN"] },
  { name: "email", category: "channel", description: "Universal email — IMAP read + SMTP send, ANY provider (Gmail/Outlook/custom).", whenToUse: "the product reads/sends email", envVars: ["EMAIL_USER", "EMAIL_PASS", "IMAP_HOST", "SMTP_HOST"], deps: { imapflow: "^1", nodemailer: "^6" } },
  { name: "whatsapp", category: "channel", description: "WhatsApp via the OpenWA gateway — thin HTTP client + webhook (no puppeteer in-app).", whenToUse: "the product uses WhatsApp", gateway: "OpenWA (Docker)", envVars: ["OPENWA_URL", "OPENWA_KEY"] },
  { name: "slack", category: "channel", description: "Slack — bidirectional (Events API webhook + chat.postMessage).", whenToUse: "the product uses Slack", envVars: ["SLACK_BOT_TOKEN"] },
  { name: "discord", category: "channel", description: "Discord — send via an incoming webhook.", whenToUse: "the product posts to Discord", envVars: ["DISCORD_WEBHOOK_URL"] },
  { name: "teams", category: "channel", description: "Microsoft Teams — send via an incoming webhook.", whenToUse: "the product posts to Teams", envVars: ["TEAMS_WEBHOOK_URL"] },
  { name: "apprise", category: "util", description: "Apprise notify() — ONE call fans out to 80+ platforms (SMS/push/chat/email).", whenToUse: "the product sends alerts/notifications", gateway: "apprise-api (Docker)", envVars: ["APPRISE_URL"] },
  { name: "nango", category: "integration", description: "Nango OAuth proxy — connect to 100s of SaaS (Salesforce/Jira/Notion/Google/GitHub) without ever touching tokens.", whenToUse: "the product integrates with external SaaS over OAuth", gateway: "Nango (Docker)", envVars: ["NANGO_HOST", "NANGO_SECRET_KEY"] },
  { name: "n8n", category: "integration", description: "n8n workflow engine (400+ integrations) — trigger() runs a self-hosted n8n workflow by webhook (Slack/Stripe/Salesforce/etc. via its nodes) + manage workflows via the API. Delegate complex automation instead of coding each integration.", whenToUse: "the product runs multi-step automations / workflows", gateway: "n8n (Docker)", envVars: ["N8N_URL", "N8N_API_KEY"] },
  { name: "crypto", category: "util", description: "Security primitives (Node built-in, no deps): encrypt/decrypt (AES-256-GCM, at rest for tokens/secrets/PII), hashPassword/verifyPassword (scrypt, constant-time), sign/verifySignature (HMAC). Co-injected with payments/social-auth so stored tokens aren't plaintext. env: ENCRYPTION_KEY.", whenToUse: "the product stores secrets/tokens/passwords/PII", envVars: ["ENCRYPTION_KEY"] },
  { name: "payments", category: "integration", description: "Multi-provider payments BY COUNTRY: createCheckout() routes to Stripe (global), MercadoPago (LATAM: AR/BR/MX/CL/CO/PE/UY) or PayU. One call, the module picks the processor + records to the payments table (webhooks included).", whenToUse: "the product charges money / subscriptions / e-commerce", envVars: ["STRIPE_SECRET_KEY", "MP_ACCESS_TOKEN", "PAYMENTS_PROVIDER"] },
  { name: "social-auth", category: "integration", description: "Sign in with Facebook/Instagram/LinkedIn/TikTok/Google + API access — one generic OAuth flow stores the access token in social_accounts so the app can log users in AND call the platform's API (post to IG, read LinkedIn). BYO app credentials per provider.", whenToUse: "the product offers social login or needs Facebook/IG/LinkedIn/TikTok API access", envVars: ["FACEBOOK_CLIENT_ID", "GOOGLE_CLIENT_ID", "LINKEDIN_CLIENT_ID", "TIKTOK_CLIENT_KEY"] },
  { name: "scraper", category: "util", description: "Web scraping via a gateway: Scrapling (stealth — bypasses Cloudflare/anti-bot + JS) + ScrapeGraph-ai (LLM extraction). scrape(url,{cookies}) + extract(url,prompt). Handles LinkedIn/paywalls with YOUR session cookie (gray-area, ban risk). No chromium in-app.", whenToUse: "the product scrapes/monitors/extracts web data (prices, LinkedIn, competitors)", gateway: "scraper-server (Scrapling, Docker)", envVars: ["SCRAPER_URL"] },
  { name: "maps", category: "util", description: "Location stack, all open-source/no key: a Map UI (Leaflet + OpenStreetMap, CDN, no dep), IP geolocation (ip-api / MaxMind GeoLite2), and geocoding address↔coords (Nominatim). /api/whereami route. Pairs with the Haversine nearby search.", whenToUse: "the product shows maps, places, nearby search or detects the user's location", envVars: ["GEOCODE_URL", "IPGEO_URL"] },
  { name: "voice", category: "util", description: "Voice — STT (transcribe) + TTS (speak), provider-agnostic: ElevenLabs (BYOK) or any OpenAI-compatible endpoint (OpenAI/Groq, or LOCAL+FREE Whisper/Voxtral/Piper/XTTS). The 'voice first' capability. /api/voice route included.", whenToUse: "the product listens to voice notes or speaks (assistant, dictation, podcast)", envVars: ["ELEVENLABS_API_KEY", "VOICE_BASE_URL", "TTS_VOICE"] },
  { name: "storage", category: "util", description: "Object storage (S3/MinIO/R2/B2), zero-dep — presigned URLs (SigV4 via node crypto) so the browser uploads DIRECTLY to the bucket. presignPut() + publicUrl() + /api/upload route.", whenToUse: "the product uploads files/images/documents", gateway: "MinIO or any S3 (Docker)", envVars: ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY", "S3_SECRET_KEY"] },
  { name: "queue", category: "util", description: "Durable background jobs on Postgres (zero-dep) — the SAFE fire-and-forget: enqueue() + a worker that leases FOR UPDATE SKIP LOCKED with retries+backoff. No parallel in-process loops. jobs table.", whenToUse: "the product runs background work (emails, reminders, heavy tasks)", envVars: [] },
  { name: "search", category: "util", description: "Full-text search: Postgres FTS (zero-dep, ts_rank) + an optional Meilisearch client (instant/typo-tolerant/faceted). pgSearch(table,cols,q) / meiliSearch().", whenToUse: "the product needs search/filtering over its data", envVars: ["MEILI_URL", "MEILI_KEY"] },
  { name: "realtime", category: "util", description: "Live updates via Server-Sent Events (zero-dep): publish(channel,data) + /api/realtime/[channel]. For notifications, live feeds, chat, presence.", whenToUse: "the product needs realtime/live updates", envVars: [] },
  { name: "pdf", category: "util", description: "HTML → PDF (invoices/reports/contracts/tickets) via the gateway's chromium. renderPdf(html) + /api/pdf route. No chromium in-app.", whenToUse: "the product generates PDFs/documents", gateway: "scraper-server /pdf (Docker)", envVars: ["PDF_URL"] },
  { name: "media", category: "util", description: "Image processing (resize/optimize/thumbnail/convert) via the gateway (Pillow). optimizeImage(url|bytes,{width,fmt}). Pairs with storage.", whenToUse: "the product processes/optimizes images", gateway: "scraper-server /image (Docker)", envVars: ["MEDIA_URL"] },
  { name: "billing", category: "integration", description: "RECURRING subscriptions + usage metering (payments is one-time): createSubscription() by country (Stripe Subscriptions / MercadoPago preapproval), meter(), isSubscribed(). subscriptions + usage_events tables.", whenToUse: "the product has subscriptions / SaaS plans", envVars: ["STRIPE_SECRET_KEY", "MP_ACCESS_TOKEN", "BILLING_PROVIDER"] },
  { name: "llm", category: "util", description: "Generic AI client (OpenAI-compatible, Ollama local by default/free): chat(), extractJSON(), classify(), summarize(). Add intelligence to any app.", whenToUse: "the product needs AI (chat/classify/summarize/extract)", envVars: ["LLM_BASE_URL", "LLM_MODEL"] },
  { name: "rag", category: "util", description: "Semantic search + RAG with pgvector (Postgres-native): indexDoc() embeds+stores, search() nearest-neighbour, buildRagPrompt() for 'ask your docs'. Needs the pgvector extension (SQL enables it).", whenToUse: "the product does semantic search / knowledge base / Q&A over content", envVars: ["EMBED_BASE_URL", "EMBED_MODEL"] },
  { name: "imagegen", category: "util", description: "Text → image (products/banners/avatars/illustrations), provider-agnostic: local FLUX/SD (free) or OpenAI. generateImage(prompt). General-purpose (beyond logos).", whenToUse: "the product generates images from text", gateway: "flux-server (Docker)", envVars: ["IMAGE_GEN_URL", "IMAGE_PROVIDER"] },
  { name: "cache", category: "util", description: "Caching, zero-dep: in-memory (per-instance) + Upstash Redis REST (distributed, no client dep). cached(key,ttl,fn) cache-aside cuts DB load + absorbs traffic spikes.", whenToUse: "the product has hot/expensive reads, high traffic, leaderboards/feeds", envVars: ["CACHE_REDIS_URL", "CACHE_REDIS_TOKEN"] },
  { name: "cloudflare", category: "integration", description: "Edge integration (app-side of DDoS defense): verifyTurnstile() (free captcha — stops bot floods on signup/forms before they hit the DB), realIP() (CF-Connecting-IP for rate-limit), purgeCache(). True volumetric DDoS is handled at the edge (DNS through Cloudflare + WAF). Pairs with spine rate-limit + cache.", whenToUse: "the product is public-facing / needs bot+abuse protection / Cloudflare", envVars: ["TURNSTILE_SECRET", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ZONE_ID"] },
  { name: "twofa", category: "util", description: "TOTP two-factor auth (Google Authenticator/Authy compatible), zero-dep: generateSecret/otpauthUrl (QR) + verifyTotp (±1 step drift). Encrypt the secret with the crypto module.", whenToUse: "the product needs 2FA / secure login (fintech, wallets, accounts)", envVars: [] },
  { name: "sms", category: "integration", description: "Send SMS + verification codes via Twilio (zero-dep): sendSMS(), sendCode()/verifyCode() for OTP-by-SMS. sms_codes table.", whenToUse: "the product sends SMS / phone verification", envVars: ["TWILIO_SID", "TWILIO_TOKEN", "TWILIO_FROM"] },
  { name: "push", category: "util", description: "Push notifications, zero-dep: Expo Push (perfect for React Native/Expo apps, no keys) + raw FCM (Android). sendPush() auto-routes by token type.", whenToUse: "the product sends push notifications (mobile/RN apps)", envVars: ["FCM_SERVER_KEY"] },
  { name: "docparse", category: "util", description: "Any document → clean Markdown (microsoft/markitdown via gateway): PDF/Word/Excel/PowerPoint/HTML/images. The bridge from files to AI — feed straight into rag/llm. toMarkdown(url|bytes).", whenToUse: "the product ingests documents for AI / 'chat with your PDF' / knowledge base", gateway: "scraper-server /parse (Docker)", envVars: ["DOCPARSE_URL"] },
  { name: "ocr", category: "util", description: "Image/scan → text (Tesseract via the gateway). ocr(url|bytes, lang). For receipts, IDs, documents, business cards. No native dep in-app.", whenToUse: "the product reads text from images/scans (receipts, IDs, docs)", gateway: "scraper-server /ocr (Docker)", envVars: ["OCR_URL"] },
  { name: "memorygraph", category: "util", description: "Knowledge-graph memory (cognee-inspired), Postgres-native zero-dep: addFact(subject,relation,object) + graphContext(entity) — upgrades flat memory to a connected graph of entities & relations. Pairs with the agent + llm (extract triples).", whenToUse: "the product is an assistant / second brain / CRM that should remember relationships", envVars: [] },
  { name: "socialsearch", category: "util", description: "Agent eyes (Agent-Reach-inspired): search Reddit + GitHub + Hacker News (free, zero-dep) + YouTube (key). searchAll(q) fans out. For Twitter/IG/LinkedIn use the scraper. Research, monitoring, trend-spotting, lead-gen.", whenToUse: "the product researches/monitors the public web & social", envVars: ["GITHUB_TOKEN", "YOUTUBE_API_KEY"] },
  { name: "forecast", category: "util", description: "Time-series forecasting (TimesFM-inspired): zero-dep linear+seasonal baseline (forecast(series)) or a TimesFM gateway for SOTA accuracy. Project sales/demand/traffic/KPIs.", whenToUse: "the product forecasts/projects metrics over time", envVars: ["FORECAST_URL"] },
  { name: "compress", category: "util", description: "Trim text/logs/RAG chunks before the LLM (headroom-inspired): compressText/clampTokens/packChunks — fewer tokens = lower cost+latency. Zero-dep heuristics.", whenToUse: "the product makes LLM calls with large context (RAG, logs, docs)", envVars: [] },
  { name: "featureflags", category: "util", description: "Feature flags / gradual rollout / A-B tests (Postgres, zero-dep): isEnabled(flag,user) with %-rollout + allowlist, variant() for A/B. Ship dark, flip without deploy.", whenToUse: "the product needs feature toggles, gradual rollout or experiments", envVars: [] },
  { name: "auditlog", category: "util", description: "Tamper-evident audit trail (Postgres, zero-dep): audit(actor,action,target,meta), hash-chained rows. Compliance (SOC2/GDPR), debugging, trust.", whenToUse: "the product needs an activity/audit trail (fintech, admin, B2B)", envVars: [] },
  { name: "webhooksout", category: "integration", description: "Let YOUR app EMIT signed webhooks to subscribers (HMAC + retries): subscribe(url,event) + emit(event,payload). The hallmark of a platform/API.", whenToUse: "the product is a platform/API that notifies external systems", envVars: [] },
  { name: "booking", category: "util", description: "Scheduling & appointments (Cal.com-style, Postgres): availability windows, freeSlots(), book() with double-booking prevention.", whenToUse: "the product books appointments/reservations/demos/rentals", envVars: [] },
  { name: "reviews", category: "util", description: "Ratings & reviews (Postgres): addReview + summary (avg/count/histogram). One per (subject,author).", whenToUse: "the product has products/services/sellers users rate", envVars: [] },
  { name: "comments", category: "util", description: "Threaded comments on any entity (Postgres): addComment(parentId?) + nested commentTree().", whenToUse: "the product has discussions/comments (posts, products, forum)", envVars: [] },
  { name: "inappnotify", category: "util", description: "In-app notification center / bell (Postgres + realtime): notify(user,type,text,link), unread(), markRead(). Publishes live if realtime is present.", whenToUse: "the product has an in-app notification center", envVars: [] },
  { name: "referrals", category: "util", description: "Referral/invite system with rewards (Postgres): codeFor(user) + redeem(code,newUser) with self/double guards. Growth loops.", whenToUse: "the product has referral/invite/affiliate growth", envVars: [] },
  { name: "moderation", category: "util", description: "Content moderation: fast wordlist/PII/spam pass + optional LLM toxicity/NSFW classifier. moderate(text). Protect any UGC.", whenToUse: "the product has user-generated content to moderate", envVars: ["MODERATION_WORDS"] },
  { name: "multitenancy", category: "util", description: "Orgs/teams/workspaces with roles (Postgres) — the B2B SaaS backbone: createOrg, addMember(role), roleOf, orgsOf. Scope data by org_id.", whenToUse: "the product is multi-tenant B2B (teams/workspaces/orgs)", envVars: [] },
  { name: "seo", category: "util", description: "SEO building blocks: buildMetadata() (OG/Twitter/canonical), slugify(), jsonLd() schema.org + dynamic sitemap.ts & robots.ts.", whenToUse: "the product is public-facing and needs to be found (landing/blog/marketplace)", envVars: ["APP_URL"] },
  { name: "docgen", category: "util", description: "GENERATE Office docs (anthropics/skills-inspired): makeDocx(title,paragraphs) + makeXlsx(title,rows) via gateway (python-docx/openpyxl). The write-side of docparse.", whenToUse: "the product generates Word/Excel files (reports, exports, contracts)", gateway: "scraper-server /docgen (Docker)", envVars: ["DOCGEN_URL"] },
  { name: "agent", category: "agent", description: "The JARVIS brain (NanoClaw pattern) — omnichannel AI assistant with cross-channel identity mapping + persistent memory + TOOL-CALLING (create_task/list_tasks/save_note built-in; Calendar/Gmail/GitHub/LinkedIn via an MCP server). It DOES things, not just chats. startAgent() runs the loop.", whenToUse: "the product is an AI assistant / chief-of-staff / chatbot", envVars: ["AGENT_MODEL", "AGENT_BASE_URL", "AGENT_SYSTEM", "MCP_URL"] },
]

const DIR = join(process.cwd(), "modules")

/** Swarm-created/improved modules (DB-backed). */
export async function customModules(): Promise<Module[]> {
  try {
    const { rows } = await query<{ name: string; category: Module["category"]; description: string; when_to_use: string | null; env_vars: string[] | null; deps: Record<string, string> | null; gateway: string | null; files: ModuleFile[] | null; version: number; status: string }>(
      `SELECT name, category, description, when_to_use, env_vars, deps, gateway, files, version, status FROM puglit_modules ORDER BY name`)
    return rows.map((r) => ({ name: r.name, category: r.category, description: r.description, whenToUse: r.when_to_use || undefined, envVars: r.env_vars || [], deps: r.deps || {}, gateway: r.gateway || undefined, files: r.files || [], version: r.version, status: r.status }))
  } catch { return [] }
}

/** Builtins + custom (a custom module overrides a builtin of the same name = an improvement). */
export async function allModules(): Promise<Module[]> {
  const custom = await customModules()
  const overridden = new Set(custom.map((m) => m.name))
  return [...BUILTIN_MODULES.filter((m) => !overridden.has(m.name)), ...custom]
}

/** Compact catalog injected into agent prompts — so they SEE what exists and reuse it. */
export async function moduleCatalog(): Promise<string> {
  const mods = await allModules()
  if (!mods.length) return ""
  return mods.map((m) => `- ${m.name} (${m.category}): ${m.description}${m.whenToUse ? ` — use when ${m.whenToUse}` : ""}${m.gateway ? ` [needs ${m.gateway}]` : ""}`).join("\n")
}

/** Custom modules relevant to a product (for injecting their code into the build). */
export async function findCustomModulesFor(text: string): Promise<Module[]> {
  const t = text.toLowerCase()
  return (await customModules()).filter((m) => {
    const words = `${m.name} ${m.description} ${m.whenToUse || ""}`.toLowerCase().split(/\W+/).filter((w) => w.length > 4)
    return words.some((w) => t.includes(w))
  })
}

/** Register a NEW module or an IMPROVEMENT (upsert + version bump). DB + git-trackable mirror. */
export async function registerModule(m: Module & { createdBy?: string }): Promise<void> {
  await query(
    `INSERT INTO puglit_modules (name, category, description, when_to_use, env_vars, deps, gateway, files, version, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,$9,$10)
     ON CONFLICT (name) DO UPDATE SET
       category=EXCLUDED.category, description=EXCLUDED.description, when_to_use=EXCLUDED.when_to_use,
       env_vars=EXCLUDED.env_vars, deps=EXCLUDED.deps, gateway=EXCLUDED.gateway, files=EXCLUDED.files,
       version=puglit_modules.version+1, status='improved', updated_at=NOW()`,
    [m.name, m.category, m.description, m.whenToUse || null, JSON.stringify(m.envVars || []), JSON.stringify(m.deps || {}), m.gateway || null, JSON.stringify(m.files || []), m.status || "new", m.createdBy || null],
  ).catch((e) => console.error("[modules]", (e as Error).message))
  try {
    const dir = join(DIR, m.name.replace(/[^a-z0-9_-]/gi, "_"))
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "module.json"), JSON.stringify({ name: m.name, category: m.category, description: m.description, whenToUse: m.whenToUse, envVars: m.envVars, deps: m.deps, gateway: m.gateway, files: (m.files || []).map((f) => f.path) }, null, 2))
    for (const f of m.files || []) writeFileSync(join(dir, basename(f.path)), f.content)
  } catch { /* mirror is best-effort */ }
}

const BUILTIN_NAMES = new Set(BUILTIN_MODULES.map((m) => m.name))

/** HARVEST: after a build, register any reusable connector/integration the agents wrote that
 *  isn't already a module → the directory GROWS from the swarm's own work. */
export async function harvestModules(files: ModuleFile[], createdBy?: string): Promise<string[]> {
  const harvested: string[] = []
  for (const f of files) {
    const m = f.path.match(/^lib\/(connectors|integrations)\/([a-z0-9_-]+)\.ts$/i)
    if (!m) continue
    const name = m[2].toLowerCase()
    if (name === "types" || name === "index" || BUILTIN_NAMES.has(name)) continue
    if ((await customModules()).some((x) => x.name === name)) continue
    await registerModule({
      name, category: m[1] === "connectors" ? "channel" : "integration",
      description: `Auto-harvested ${m[1] === "connectors" ? "channel" : "integration"} connector from a generated app.`,
      whenToUse: `the product uses ${name}`, files: [f], status: "new", createdBy,
    })
    harvested.push(name)
  }
  return harvested
}
