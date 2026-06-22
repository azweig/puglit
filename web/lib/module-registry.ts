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
import { chatJSON, MODELS } from "@/lib/openai"
import { securityScan } from "@/lib/swarm-checks"
import { writeFileSync, mkdirSync } from "node:fs"
import { join, basename } from "node:path"

/** A module NEVER enters the genome if it carries a secret or an RCE vector (#17 deterministic gate). */
function moduleIsUnsafe(file: { path: string; content: string }): string | null {
  const hi = securityScan([file]).find((i) => i.severity === "high")
  return hi ? hi.kind : null
}

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
  status?: string // experimental | candidate | stable | core (harvest lifecycle)
  requires?: string[] // hard module dependencies — auto-injected with this one (crítica: dep graph)
  tier?: "core" | "infra" | "integration" | "business" | "meta" // for cognitive grouping
}

// Hard dependency graph (crítica #2: billing→storage, etc.). Used to auto-inject requirements
// so a keyword that triggers a dependent never ships a broken build missing its base module.
export const MODULE_REQUIRES: Record<string, string[]> = {
  "social-auth": ["crypto"],
  billing: ["crypto"],
  payments: ["crypto"],
  inappnotify: ["realtime"],
  moderation: ["llm"],
  rag: ["llm"],
  agent: ["llm", "crypto"],
  charts: ["stats"],
  forms: ["validation"],
  webhooksout: ["crypto", "queue"],
  imagegen: ["storage"],
  media: ["storage"],
  graphify: ["llm"],
}
/** Transitive closure of module dependencies. */
export function dependencyClosure(names: string[]): string[] {
  const seen = new Set<string>(names)
  const stack = [...names]
  while (stack.length) {
    const n = stack.pop()!
    for (const dep of MODULE_REQUIRES[n] || []) if (!seen.has(dep)) { seen.add(dep); stack.push(dep) }
  }
  return [...seen]
}

/** Metadata for the builtin modules (their code is injected by connectors.ts / integrations.ts). */
export const BUILTIN_MODULES: Module[] = [
  { name: "scrape", category: "integration", description: "Smart web extraction (ScrapeGraphAI) — prompt + URL → structured JSON. Self-hosted on local Ollama (SCRAPE_URL) or cloud (SCRAPEGRAPH_API_KEY).", whenToUse: "the product pulls info/leads/clients/competitor data from web pages", envVars: ["SCRAPE_URL"] },
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
  { name: "voice", category: "agent", description: "Voice — STT (transcribe) + TTS (speak), provider-agnostic: ElevenLabs (BYOK) or any OpenAI-compatible endpoint (OpenAI/Groq, or LOCAL+FREE Whisper/Voxtral/Piper/XTTS). The 'voice first' capability. /api/voice route included.", whenToUse: "the product listens to voice notes or speaks (assistant, dictation, podcast)", envVars: ["ELEVENLABS_API_KEY", "VOICE_BASE_URL", "TTS_VOICE"] },
  { name: "storage", category: "util", description: "Object storage (S3/MinIO/R2/B2), zero-dep — presigned URLs (SigV4 via node crypto) so the browser uploads DIRECTLY to the bucket. presignPut() + publicUrl() + /api/upload route.", whenToUse: "the product uploads files/images/documents", gateway: "MinIO or any S3 (Docker)", envVars: ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY", "S3_SECRET_KEY"] },
  { name: "queue", category: "util", description: "Durable background jobs on Postgres (zero-dep) — the SAFE fire-and-forget: enqueue() + a worker that leases FOR UPDATE SKIP LOCKED with retries+backoff. No parallel in-process loops. jobs table.", whenToUse: "the product runs background work (emails, reminders, heavy tasks)", envVars: [] },
  { name: "search", category: "util", description: "Full-text search: Postgres FTS (zero-dep, ts_rank) + an optional Meilisearch client (instant/typo-tolerant/faceted). pgSearch(table,cols,q) / meiliSearch().", whenToUse: "the product needs search/filtering over its data", envVars: ["MEILI_URL", "MEILI_KEY"] },
  { name: "realtime", category: "util", description: "Live updates via Server-Sent Events (zero-dep): publish(channel,data) + /api/realtime/[channel]. For notifications, live feeds, chat, presence.", whenToUse: "the product needs realtime/live updates", envVars: [] },
  { name: "pdf", category: "util", description: "HTML → PDF (invoices/reports/contracts/tickets) via the gateway's chromium. renderPdf(html) + /api/pdf route. No chromium in-app.", whenToUse: "the product generates PDFs/documents", gateway: "scraper-server /pdf (Docker)", envVars: ["PDF_URL"] },
  { name: "media", category: "util", description: "Image processing (resize/optimize/thumbnail/convert) via the gateway (Pillow). optimizeImage(url|bytes,{width,fmt}). Pairs with storage.", whenToUse: "the product processes/optimizes images", gateway: "scraper-server /image (Docker)", envVars: ["MEDIA_URL"] },
  { name: "billing", category: "integration", description: "RECURRING subscriptions + usage metering (payments is one-time): createSubscription() by country (Stripe Subscriptions / MercadoPago preapproval), meter(), isSubscribed(). subscriptions + usage_events tables.", whenToUse: "the product has subscriptions / SaaS plans", envVars: ["STRIPE_SECRET_KEY", "MP_ACCESS_TOKEN", "BILLING_PROVIDER"] },
  { name: "llm", category: "agent", description: "Generic AI client (OpenAI-compatible, Ollama local by default/free): chat(), extractJSON(), classify(), summarize(). Add intelligence to any app.", whenToUse: "the product needs AI (chat/classify/summarize/extract)", envVars: ["LLM_BASE_URL", "LLM_MODEL"] },
  { name: "rag", category: "agent", description: "Semantic search + RAG with pgvector (Postgres-native): indexDoc() embeds+stores, search() nearest-neighbour, buildRagPrompt() for 'ask your docs'. Needs the pgvector extension (SQL enables it).", whenToUse: "the product does semantic search / knowledge base / Q&A over content", envVars: ["EMBED_BASE_URL", "EMBED_MODEL"] },
  { name: "imagegen", category: "util", description: "Text → image (products/banners/avatars/illustrations), provider-agnostic: local FLUX/SD (free) or OpenAI. generateImage(prompt). General-purpose (beyond logos).", whenToUse: "the product generates images from text", gateway: "flux-server (Docker)", envVars: ["IMAGE_GEN_URL", "IMAGE_PROVIDER"] },
  { name: "cache", category: "util", description: "Caching, zero-dep: in-memory (per-instance) + Upstash Redis REST (distributed, no client dep). cached(key,ttl,fn) cache-aside cuts DB load + absorbs traffic spikes.", whenToUse: "the product has hot/expensive reads, high traffic, leaderboards/feeds", envVars: ["CACHE_REDIS_URL", "CACHE_REDIS_TOKEN"] },
  { name: "cloudflare", category: "integration", description: "Edge integration (app-side of DDoS defense): verifyTurnstile() (free captcha — stops bot floods on signup/forms before they hit the DB), realIP() (CF-Connecting-IP for rate-limit), purgeCache(). True volumetric DDoS is handled at the edge (DNS through Cloudflare + WAF). Pairs with spine rate-limit + cache.", whenToUse: "the product is public-facing / needs bot+abuse protection / Cloudflare", envVars: ["TURNSTILE_SECRET", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ZONE_ID"] },
  { name: "twofa", category: "util", description: "TOTP two-factor auth (Google Authenticator/Authy compatible), zero-dep: generateSecret/otpauthUrl (QR) + verifyTotp (±1 step drift). Encrypt the secret with the crypto module.", whenToUse: "the product needs 2FA / secure login (fintech, wallets, accounts)", envVars: [] },
  { name: "sms", category: "integration", description: "Send SMS + verification codes via Twilio (zero-dep): sendSMS(), sendCode()/verifyCode() for OTP-by-SMS. sms_codes table.", whenToUse: "the product sends SMS / phone verification", envVars: ["TWILIO_SID", "TWILIO_TOKEN", "TWILIO_FROM"] },
  { name: "push", category: "util", description: "Push notifications, zero-dep: Expo Push (perfect for React Native/Expo apps, no keys) + raw FCM (Android). sendPush() auto-routes by token type.", whenToUse: "the product sends push notifications (mobile/RN apps)", envVars: ["FCM_SERVER_KEY"] },
  { name: "docparse", category: "agent", description: "Any document → clean Markdown (microsoft/markitdown via gateway): PDF/Word/Excel/PowerPoint/HTML/images. The bridge from files to AI — feed straight into rag/llm. toMarkdown(url|bytes).", whenToUse: "the product ingests documents for AI / 'chat with your PDF' / knowledge base", gateway: "scraper-server /parse (Docker)", envVars: ["DOCPARSE_URL"] },
  { name: "ocr", category: "agent", description: "Image/scan → text (Tesseract via the gateway). ocr(url|bytes, lang). For receipts, IDs, documents, business cards. No native dep in-app.", whenToUse: "the product reads text from images/scans (receipts, IDs, docs)", gateway: "scraper-server /ocr (Docker)", envVars: ["OCR_URL"] },
  { name: "memorygraph", category: "agent", description: "Knowledge-graph memory (cognee-inspired), Postgres-native zero-dep: addFact(subject,relation,object) + graphContext(entity) — upgrades flat memory to a connected graph of entities & relations. Pairs with the agent + llm (extract triples).", whenToUse: "the product is an assistant / second brain / CRM that should remember relationships", envVars: [] },
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
  { name: "api", category: "integration", description: "API builder: makeCrud(table,cols) → injection-safe REST handlers + openApiSpec() served at /api/openapi. Turns an app into a documented platform with REST + OpenAPI.", whenToUse: "the product exposes a REST API / is a platform / needs developer access", envVars: [] },
  { name: "entitlements", category: "util", description: "Plan-based feature gating (billing × featureflags): can(user,feature) + requireFeature() against a plan→features map (plan_features table). The SaaS gating layer.", whenToUse: "the product gates features by subscription plan/tier", envVars: ["PLANS_JSON"] },
  { name: "errortracking", category: "util", description: "Self-hosted error tracking (Sentry-style, Postgres): captureError + withErrorTracking() route wrapper, fingerprint-grouped with counts, optional webhook forward. Observability beyond analytics.", whenToUse: "the product needs error monitoring / observability", envVars: ["ERROR_WEBHOOK"] },
  { name: "migrations", category: "util", description: "Versioned schema migrations (Postgres): runMigrations([{version,name,sql}]) in a transaction, tracked in schema_migrations. Turns raw SQL into a tracked, repeatable history.", whenToUse: "the product needs evolving/versioned schema (enterprise, long-lived)", envVars: [] },
  { name: "wallet", category: "util", description: "In-app credits/points ledger (append-only, Postgres): credit/debit (atomic, no negative) + balance = sum (can't drift) + history. For AI credits, loyalty points, in-app currency.", whenToUse: "the product sells credits / has points / in-app currency", envVars: [] },
  { name: "validation", category: "util", description: "Tiny shared validator (client+server, zero-dep): validate(schema, data) → { ok, errors }. Same rules in the form and the API → no drift.", whenToUse: "the product validates user input (forms, signup, checkout)", envVars: [] },
  { name: "forms", category: "util", description: "Dynamic forms (Postgres): defineForm(fields) + submitForm (validated) + submissions(). Contact/lead/survey/intake without hardcoding each.", whenToUse: "the product collects form/survey/lead submissions", envVars: [] },
  { name: "admin", category: "util", description: "Auto CRUD admin over your tables (Postgres), allowlist-scoped + injection-safe: adminList/Create/Update/Delete. Guard by role. The back-office everyone asks for after a build.", whenToUse: "the product needs an admin/back-office panel", envVars: ["ADMIN_TABLES"] },
  { name: "shipping", category: "integration", description: "Logistics: rates, labels & tracking across carriers via Shippo (FedEx/UPS/USPS/DHL) + direct FedEx. track(carrier,number) → status/eta/events, rates() for checkout, createLabel(). For e-commerce/fulfillment.", whenToUse: "the product ships/tracks physical orders", envVars: ["SHIPPO_TOKEN", "FEDEX_API_KEY"] },
  { name: "flights", category: "integration", description: "Real-time flight/airline tracking: flightStatus(iata) → status, scheduled vs actual, delay, gate/terminal. AviationStack or AeroDataBox (free tiers). Travel, logistics ETAs, ops.", whenToUse: "the product tracks flights / airline status / travel", envVars: ["AVIATIONSTACK_KEY", "FLIGHTS_PROVIDER"] },
  { name: "stats", category: "util", description: "Statistics & math for dashboards (zero-dep): mean/median/stddev/percentile, correlation, linear regression, growth %, groupBy aggregation, histogram, movingAvg. The math layer every dashboard needs.", whenToUse: "the product has dashboards/analytics/metrics/operations", envVars: [] },
  { name: "charts", category: "util", description: "Charts (zero npm dep): a <Chart> React component (Chart.js via CDN) for line/bar/pie/doughnut/radar + quickChartUrl() static chart IMAGE (QuickChart) for emails/PDFs + seriesFromRows() to shape DB rows.", whenToUse: "the product visualizes data (dashboards, reports)", envVars: [] },
  { name: "crm", category: "integration", description: "CRM (HubSpot alt) via EspoCRM REST: leads/contacts/deals + pipeline stages (createRecord/moveStage). OSS service runs separately.", whenToUse: "the product manages leads/contacts/deals/sales pipeline", gateway: "EspoCRM/Twenty (Docker)", envVars: ["CRM_URL", "CRM_KEY"] },
  { name: "helpdesk", category: "integration", description: "Support tickets via Chatwoot: createTicket/reply/listTickets (omnichannel helpdesk, SLA). Postventa.", whenToUse: "the product handles support tickets / customer service", gateway: "Chatwoot (Docker)", envVars: ["CHATWOOT_URL", "CHATWOOT_TOKEN"] },
  { name: "marketing", category: "integration", description: "Marketing automation (HubSpot core) via Mautic: contacts, segments, lead scoring, campaigns.", whenToUse: "the product runs marketing campaigns / nurture / lead scoring", gateway: "Mautic (Docker)", envVars: ["MAUTIC_URL", "MAUTIC_USER", "MAUTIC_PASS"] },
  { name: "knowledgebase", category: "integration", description: "Self-service docs/FAQ via Outline: createDoc/searchDocs. Support deflection.", whenToUse: "the product has a help center / knowledge base", gateway: "Outline (Docker)", envVars: ["OUTLINE_URL", "OUTLINE_TOKEN"] },
  { name: "esign", category: "integration", description: "E-signature (DocuSign alt) via Documenso: sendForSignature/status.", whenToUse: "the product needs document signing / contracts", gateway: "Documenso (Docker)", envVars: ["DOCUMENSO_URL", "DOCUMENSO_KEY"] },
  { name: "ecommerce", category: "integration", description: "Headless commerce via Medusa: products, carts, line items, complete order. Pairs with payments+shipping.", whenToUse: "the product is an online store / marketplace", gateway: "Medusa (Docker)", envVars: ["MEDUSA_URL", "MEDUSA_KEY"] },
  { name: "pim", category: "integration", description: "Product Information Management via Akeneo: product attributes/families/variants at scale.", whenToUse: "the product manages a large product catalog", gateway: "Akeneo (Docker)", envVars: ["PIM_URL", "PIM_TOKEN"] },
  { name: "wms", category: "integration", description: "Warehouse Management via OpenBoxes: stock by location, receive/pick/transfer.", whenToUse: "the product runs a warehouse (locations/picking)", gateway: "OpenBoxes (Docker)", envVars: ["WMS_URL", "WMS_TOKEN"] },
  { name: "inventory", category: "util", description: "Lightweight stock tracking, Postgres-native: onHand/adjust/reserve (atomic, no overselling) via an append-only ledger. Graduate to wms for locations.", whenToUse: "the product tracks simple stock/inventory", envVars: [] },
  { name: "pos", category: "util", description: "Point of sale, Postgres-native: ringSale (decrements inventory if present) + dailyZ close. For shops/restaurants/kiosks.", whenToUse: "the product rings up sales at a register", envVars: [] },
  { name: "invoicing", category: "integration", description: "Invoices/quotes/tax via Invoice Ninja: createInvoice/emailInvoice/list. Fiscal docs (LATAM IVA).", whenToUse: "the product issues invoices/receipts/quotes", gateway: "Invoice Ninja (Docker)", envVars: ["INVOICENINJA_URL", "INVOICENINJA_TOKEN"] },
  { name: "observability", category: "util", description: "APM (New Relic/Datadog alt): ship traces+metrics to a self-hosted SigNoz/OpenTelemetry collector (OTLP-HTTP). trace()/metric().", whenToUse: "the product needs APM / tracing / performance monitoring", gateway: "SigNoz (Docker)", envVars: ["OTEL_URL", "OTEL_SERVICE"] },
  { name: "uptime", category: "util", description: "Uptime/API health monitoring, Postgres-native: addMonitor + checkAll (cron) + uptimePct. Deploy Uptime Kuma for a full UI.", whenToUse: "the product monitors endpoints/APIs uptime", envVars: [] },
  { name: "statuspage", category: "util", description: "Public/internal status page, Postgres-native + a /status page: components health + incidents (investigating→resolved). Pairs with uptime. OSS UI: Cachet.", whenToUse: "the product needs a status page / incident comms", envVars: [] },
  { name: "productanalytics", category: "integration", description: "Product analytics (events/funnels/session replay) via PostHog: capture/identify. The product layer over the spine's basic analytics.", whenToUse: "the product needs funnels/retention/behavior analytics", gateway: "PostHog (Docker)", envVars: ["POSTHOG_URL", "POSTHOG_KEY"] },
  { name: "logs", category: "util", description: "Centralized structured logging via OpenObserve/Loki: log(level,msg,meta) → searchable + retained.", whenToUse: "the product needs centralized/searchable logs", gateway: "OpenObserve (Docker)", envVars: ["LOGS_URL", "LOGS_STREAM"] },
  { name: "sso", category: "integration", description: "Enterprise SSO / OIDC (unblocks big B2B) via Keycloak/Authentik/Zitadel: authorize→callback→token→userinfo + routes. SAML/OIDC/SCIM.", whenToUse: "the product needs enterprise SSO / SAML / OIDC login", gateway: "Keycloak (Docker)", envVars: ["OIDC_ISSUER", "OIDC_CLIENT_ID", "OIDC_CLIENT_SECRET"] },
  { name: "bi", category: "integration", description: "BI/dashboards via Metabase: signed-JWT embedded dashboards (no data leaves infra) + run saved questions. OSS: Metabase/Superset/Redash.", whenToUse: "the product needs embedded BI dashboards/reports", gateway: "Metabase (Docker)", envVars: ["METABASE_URL", "METABASE_SECRET"] },
  { name: "projectmgmt", category: "integration", description: "Project management (boards/issues/sprints) via Plane: createIssue/list/update. OSS: Plane/Focalboard/Vikunja.", whenToUse: "the product manages projects/issues/sprints/kanban", gateway: "Plane (Docker)", envVars: ["PLANE_URL", "PLANE_TOKEN"] },
  { name: "dms", category: "integration", description: "Document management (archival/full-text/tags) via Paperless-ngx: upload/search/get. Pairs with docparse/ocr.", whenToUse: "the product archives/manages documents", gateway: "Paperless-ngx (Docker)", envVars: ["PAPERLESS_URL", "PAPERLESS_TOKEN"] },
  { name: "rentals", category: "util", description: "Booking/rental marketplace vertical (Airbnb/hotel/coworking): PRE-BUILT correct domain logic — priceQuote (deterministic integer-cents pricing, search==checkout), isAvailable + half-open overlap, createBooking (atomic anti-double-booking via a DB EXCLUDE-gist constraint) + state machine, refund-by-policy-snapshot, double-blind reviews. Ships scripts/verify-rentals.mjs + /api/health.", whenToUse: "the product is a rental/stay/booking marketplace with availability + bookings", envVars: [] },
  { name: "obsidian", category: "agent", description: "Use an Obsidian vault (markdown + [[wikilinks]] + backlinks + link graph) as a second-brain/PKM store, filesystem-based (works whether Obsidian is open or not). writeNote/readNote/search/backlinks/linkGraph. Same vault format the swarm uses for its diary.", whenToUse: "the product is a notes/PKM/second-brain app or stores knowledge as linked markdown", envVars: ["OBSIDIAN_VAULT"] },
  { name: "graphify", category: "agent", description: "Turn ANY input into a knowledge graph: the LLM extracts entities + (subject,relation,object) triples from text/docs into kg_nodes/kg_edges. The brain's ingestion layer — pairs with docparse (file→text), memorygraph (query) and rag.", whenToUse: "the product builds a knowledge graph from documents/text/conversations", envVars: ["LLM_BASE_URL", "LLM_MODEL"] },
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

/** Custom modules relevant to a product — ONLY promoted ones (stable/core) are auto-injected, so
 *  raw harvested modules can't contaminate real builds (crítica: catalog rot / harvest governance). */
export async function findCustomModulesFor(text: string): Promise<Module[]> {
  const t = text.toLowerCase()
  return (await customModules()).filter((m) => {
    if (!["stable", "core"].includes(m.status || "")) return false // experimental/candidate stay out
    const words = `${m.name} ${m.description} ${m.whenToUse || ""}`.toLowerCase().split(/\W+/).filter((w) => w.length > 4)
    return words.some((w) => t.includes(w))
  })
}

/** Promote a harvested module along the lifecycle: experimental → candidate → stable → core. */
export async function promoteModule(name: string, to: "candidate" | "stable" | "core"): Promise<void> {
  await query("UPDATE puglit_modules SET status=$2, updated_at=NOW() WHERE name=$1", [name, to]).catch(() => {})
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
type Candidate = { name: string; category: Module["category"]; file: ModuleFile }

const CURATOR_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string" }, target: { type: ["string", "null"] }, reusable: { type: "boolean" },
    reason: { type: "string" }, description: { type: "string" }, whenToUse: { type: "string" },
  }, required: ["verdict", "reason"],
} as const

/**
 * MODULE CURATOR — the post-duel registrar that GUARDS the reusable module genome. The duel never
 * touches modules; after the winner builds, this agent reviews each harvested candidate against the
 * EXISTING registry (old vs new) and decides on merit: accept (genuinely new + reusable), improve
 * (a better version of an existing module → heal it), or reject (app-specific / duplicate / low
 * quality). Only worthy, reusable modules enter the genome — no more dumb auto-registration.
 */
export async function curateModules(candidates: Candidate[], createdBy?: string): Promise<{ accepted: string[]; improved: string[]; rejected: { name: string; reason: string }[] }> {
  const accepted: string[] = [], improved: string[] = [], rejected: { name: string; reason: string }[] = []
  if (!candidates.length) return { accepted, improved, rejected }
  const customs = await customModules().catch(() => [] as Module[])
  const existing = [...BUILTIN_MODULES, ...customs].map((m) => `- ${m.name} (${m.category}): ${m.description}`).join("\n")
  for (const c of candidates) {
    const unsafe = moduleIsUnsafe(c.file) // #17: deterministic security gate BEFORE the LLM review
    if (unsafe) { rejected.push({ name: c.name, reason: `security: ${unsafe}` }); continue }
    const out = (await chatJSON([
      { role: "system", content: `You are the MODULE CURATOR — the registrar that guards Puglit's REUSABLE module genome. A build produced a candidate connector/integration. Decide, on merit, whether it earns a place in the SHARED registry every future app can reuse. Be strict:
- REUSABLE: generic across products — NOT hardcoded to this one app (no app-specific table names, business rules or copy). If it's bespoke to this product → reject.
- NOVEL vs DUPLICATE: genuinely new, or does an EXISTING module already cover it? Duplicate → reject; a clearly BETTER version of an existing one → "improve" (name it in target).
- QUALITY: parameterized SQL, no secrets/hardcoded keys, clean typed contract, no missing deps.
Return ONLY JSON {"verdict":"accept|improve|reject","target":"<existing module name if improve, else null>","reusable":true|false,"reason":"<one sentence>","description":"<crisp catalog description>","whenToUse":"<when an app needs it>"}.` },
      { role: "user", content: `EXISTING MODULES:\n${existing}\n\nCANDIDATE: ${c.name} (${c.category})\nCODE:\n${c.file.content.slice(0, 4000)}` },
    ], { model: MODELS.premium, temperature: 0.2, schema: CURATOR_SCHEMA }).catch(() => null)) as { verdict?: string; target?: string | null; reusable?: boolean; reason?: string; description?: string; whenToUse?: string } | null
    const reason = String(out?.reason || "no rationale").slice(0, 200)
    if (out?.verdict === "accept" && out?.reusable !== false) {
      await registerModule({ name: c.name, category: c.category, description: String(out.description || `Harvested ${c.category}`).slice(0, 200), whenToUse: String(out.whenToUse || `the product uses ${c.name}`).slice(0, 160), files: [c.file], status: "experimental", createdBy })
      accepted.push(c.name)
    } else if (out?.verdict === "improve" && out?.target) {
      const tgt = String(out.target).toLowerCase().replace(/[^a-z0-9_-]/g, "")
      if (tgt) { await registerModule({ name: tgt, category: c.category, description: String(out.description || "").slice(0, 200), whenToUse: String(out.whenToUse || "").slice(0, 160), files: [c.file], status: "improved", createdBy }); improved.push(tgt) }
      else rejected.push({ name: c.name, reason })
    } else {
      rejected.push({ name: c.name, reason })
    }
  }
  return { accepted, improved, rejected }
}

/** HARVEST: after a build, COLLECT the candidate connectors/integrations the agents wrote and route
 *  them through the CURATOR (no more dumb auto-registration). Returns the names that entered the genome. */
export async function harvestModules(files: ModuleFile[], createdBy?: string): Promise<string[]> {
  const customNames = new Set((await customModules().catch(() => [] as Module[])).map((x) => x.name))
  const candidates: Candidate[] = []
  for (const f of files) {
    const m = f.path.match(/^lib\/(connectors|integrations)\/([a-z0-9_-]+)\.ts$/i)
    if (!m) continue
    const name = m[2].toLowerCase()
    if (name === "types" || name === "index" || BUILTIN_NAMES.has(name) || customNames.has(name)) continue
    if (!candidates.some((c) => c.name === name)) candidates.push({ name, category: m[1] === "connectors" ? "channel" : "integration", file: f })
  }
  if (!candidates.length) return []
  const res = await curateModules(candidates, createdBy)
  if (res.rejected.length) console.warn("[curator] rejected:", res.rejected.map((r) => `${r.name} (${r.reason})`).join("; "))
  if (res.accepted.length || res.improved.length) console.warn(`[curator] accepted: ${res.accepted.join(", ") || "—"} · improved: ${res.improved.join(", ") || "—"}`)
  return [...res.accepted, ...res.improved]
}

const CATS = new Set(["channel", "integration", "util", "agent"])
const asCat = (s: unknown): Module["category"] => (CATS.has(String(s)) ? (s as Module["category"]) : "util")

const GAP_SCHEMA = {
  type: "object",
  properties: { gaps: { type: "array", items: { type: "object", properties: { name: { type: "string" }, category: { type: "string" }, reason: { type: "string" }, spec: { type: "string" } }, required: ["name", "reason", "spec"] } } },
  required: ["gaps"],
} as const

/** GAP ANALYST — after a build, identify REUSABLE capabilities the app had to HAND-ROLL inline (or
 *  clearly lacked) that SHOULD be shared modules next time. Generic only; never app-specific logic. */
export async function proposeModuleGaps(productName: string, summary: string, files: ModuleFile[], existing: string): Promise<{ name: string; category: Module["category"]; reason: string; spec: string }[]> {
  const libDigest = files.filter((f) => /^lib\/.+\.ts$/.test(f.path) && !/\.(test|spec)\.ts$/.test(f.path)).slice(0, 10).map((f) => `// ${f.path}\n${f.content.slice(0, 1100)}`).join("\n\n")
  if (libDigest.length < 100) return []
  const out = (await chatJSON([
    { role: "system", content: `You are the GAP ANALYST for Puglit's reusable module genome. Looking at a freshly built app, identify REUSABLE capabilities it had to HAND-ROLL inline (or clearly lacked) that SHOULD become shared modules every FUTURE app can reuse — e.g. CSV export, webhook signing, ICS calendar generation, slugify, cursor pagination, rating aggregation, geo-distance, a retry/queue helper. ONLY generic, cross-product capabilities — NEVER app-specific business logic. Do NOT propose anything already in the existing module list. Return ONLY JSON {"gaps":[{"name":"<kebab>","category":"util|integration|channel|agent","reason":"what was hand-rolled or missing","spec":"1-2 sentence spec of the reusable module"}]} — at MOST 3, highest-value first.` },
    { role: "user", content: `Product: ${productName} — ${summary}\n\nEXISTING MODULES (do not duplicate):\n${existing}\n\nApp lib/ code:\n${libDigest}` },
  ], { model: MODELS.premium, temperature: 0.3, schema: GAP_SCHEMA }).catch(() => null)) as { gaps?: { name?: string; category?: string; reason?: string; spec?: string }[] } | null
  return (out?.gaps || []).filter((g) => g?.name && g?.spec).map((g) => ({ name: String(g.name).toLowerCase().replace(/[^a-z0-9_-]/g, ""), category: asCat(g.category), reason: String(g.reason || "").slice(0, 200), spec: String(g.spec).slice(0, 300) })).filter((g) => g.name)
}

/** The curator BUILDS a missing reusable module from a gap spec, then registers it (experimental,
 *  so it's quarantined until promotion vets it — it can't break apps before it's proven). */
export async function buildMissingModule(gap: { name: string; category: Module["category"]; reason: string; spec: string }, createdBy?: string): Promise<string | null> {
  const out = (await chatJSON([
    { role: "system", content: `You are a Backend Engineer building a REUSABLE Puglit module — a lib/ helper ANY generated app can import. Production-grade TypeScript: parameterized SQL via \`import { pool } from "@/lib/db"\` when it touches the DB, NO external npm deps, NO hardcoded secrets, NO app-specific logic — fully GENERIC and configurable via params/env. Must compile under tsc. Return ONLY JSON {"code":"<full contents of lib/${gap.name}.ts>","envVars":["..."],"sql":"<optional CREATE TABLE IF NOT EXISTS ..., or empty>","description":"<crisp catalog description>","whenToUse":"<when an app needs it>"}.` },
    { role: "user", content: `Build the reusable module "${gap.name}" (${gap.category}).\nSpec: ${gap.spec}\nWhy it's needed: ${gap.reason}` },
  ], { model: MODELS.code, temperature: 0.2 }).catch(() => null)) as { code?: string; envVars?: string[]; sql?: string; description?: string; whenToUse?: string } | null
  if (!out?.code || out.code.length < 80) return null
  const files: ModuleFile[] = [{ path: `lib/${gap.name}.ts`, content: String(out.code).slice(0, 12000) }]
  if (moduleIsUnsafe(files[0])) return null // #17: never register a built module with a secret/RCE
  if (out.sql && /create table/i.test(out.sql)) files.push({ path: `sql/${gap.name}.sql`, content: String(out.sql).slice(0, 4000) })
  await registerModule({ name: gap.name, category: gap.category, description: String(out.description || gap.spec).slice(0, 200), whenToUse: String(out.whenToUse || gap.reason).slice(0, 160), envVars: Array.isArray(out.envVars) ? out.envVars.slice(0, 8) : [], files, status: "experimental", createdBy })
  return gap.name
}

/** Grow the genome after a build: CURATE what the swarm wrote (harvest) AND BUILD what it WISHED
 *  existed (gaps). Both land as 'experimental' — promotion vets them before any app uses them. */
export async function growGenome(productName: string, summary: string, files: ModuleFile[], createdBy?: string): Promise<{ harvested: string[]; built: string[] }> {
  const harvested = await harvestModules(files, createdBy).catch(() => [] as string[])
  const customs = await customModules().catch(() => [] as Module[])
  const have = new Set([...BUILTIN_NAMES, ...customs.map((m) => m.name)])
  const existing = [...BUILTIN_MODULES, ...customs].map((m) => `- ${m.name}: ${m.description}`).join("\n")
  const gaps = (await proposeModuleGaps(productName, summary, files, existing).catch(() => [])).filter((g) => !have.has(g.name)).slice(0, 2)
  const built: string[] = []
  for (const g of gaps) { const n = await buildMissingModule(g, createdBy).catch(() => null); if (n) built.push(n) }
  if (built.length) console.warn(`[genome] built missing modules (wishlist): ${built.join(", ")}`)
  return { harvested, built }
}

/** #9 AUTO-PROMOTION: a harvested/built module matures experimental → candidate → stable as it
 *  survives evolution cycles, gated by a clean security re-scan. Only 'stable'/'core' are injected
 *  into apps (findCustomModulesFor), so this is the governance that lets proven modules graduate. */
export async function autoPromoteModules(): Promise<{ name: string; to: string }[]> {
  const promoted: { name: string; to: string }[] = []
  try {
    const { rows } = await query<{ name: string; status: string; files: ModuleFile[] }>(
      "SELECT name, status, files FROM puglit_modules WHERE status IN ('experimental','new','improved','candidate') AND created_at < NOW() - interval '1 hour'")
    for (const r of rows) {
      const file = (Array.isArray(r.files) ? r.files : [])[0]
      if (file && moduleIsUnsafe(file)) continue // never promote a module carrying a secret/RCE
      const next = r.status === "candidate" ? "stable" : "candidate"
      await query("UPDATE puglit_modules SET status=$2, updated_at=NOW() WHERE name=$1", [r.name, next]).catch(() => {})
      promoted.push({ name: r.name, to: next })
    }
  } catch { /* best-effort */ }
  return promoted
}
