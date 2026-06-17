# Puglit Project Standard (derived from TodoAstros)

The quality bar **every Puglit-generated project must meet**, reverse-engineered from the production SaaS at `/Users/alvaroz/projects/2026/todoastros` (Next.js `frontend/`). This is the spec the generator is built against. Companion to `BLUEPRINT.md` (BLUEPRINT = how it's built; STANDARD = what "done" means).

Legend: ✅ Spine does it deterministically · 🧩 LLM generates inside the contract · ⚠️ gap (see §4).

---

## 1. Baseline — every generated project MUST have

### Auth & accounts
- [ ] Cookie JWT (web) + Bearer token (mobile) via a single `getAuthUser()` that handles both. *(TA: `lib/auth.ts`, `auth_token` cookie + `Authorization: Bearer`.)*
- [ ] Magic-link / OTP login + register, forgot/reset, Google OAuth.
- [ ] Email verification as a **soft gate** (banner, not a hard block) with reminder cron.
- [ ] `refresh_tokens` table + rotation for mobile.

### Payments / subscriptions
- [ ] Stripe **recurring subscriptions** + Checkout + webhook (idempotent, signature-verified). *(TA: `app/api/stripe/`, prices $9.99/$49/$79.)*
- [ ] MercadoPago path for LATAM (toggle), coupons.
- [ ] Plan ladder `free → premium → mensual → semestral → anual → lifetime`, persisted on `users` with `subscription_end` (+ separate `mobile_plan`).
- [ ] **All gating through one function** `getEffectivePlan(userId)` returning the max of web/mobile active ranks. *(TA: `lib/database.ts:2769`.)*
- [ ] Per-feature usage metering (`feature-usage`) for free-tier limits.

### Transactional email + lifecycle
- [ ] Resend primary + nodemailer fallback; verified domain (SPF/DKIM/DMARC); sender is the product address, never a personal Gmail.
- [ ] Every send goes through `email-logger` (tracked, bounce-aware) — never a raw transporter call.
- [ ] Lifecycle set: verification, onboarding drip, cart-abandonment, reengagement, weekly summary. *(TA: `lib/services/cart-abandonment-emails.ts`, `app/api/cron/drip-onboarding`, `reengagement`, `weekly-summary`.)*
- [ ] **IMAP bounce poller** + `email_bounced` flag, pre/post-send suppression. *(TA: `lib/services/email-bounce-poller.ts`.)*

### Cron jobs
- [ ] Crons are HTTP routes under `app/api/cron/*`, authed by `CRON_SECRET` (query string), rate-limit map allows bursts.
- [ ] **Fire-and-forget**: route returns `{ ok, queued }` immediately; work runs in `void Promise.resolve().then(...)` with `maxDuration` set; `Promise.allSettled` so one failure doesn't sink the batch. *(TA: `app/api/cron/generate-horoscopes/route.ts`.)*
- [ ] **One cron primary** when ≥2 machines (`CRON_PRIMARY_MACHINE_ID`) to avoid double runs.
- [ ] Backfills are **never** in-process fire-and-forget loops — endpoint processes 1 item/call, driven by an external bash loop (incident learned the hard way).

### Admin panel
- [ ] Separate admin auth (`admin-auth.ts`, `admin_users`) behind an obscure path. *(TA: `app/alvaro-admin-99/`.)*
- [ ] Minimal dashboard: status/monitor, content moderation/testimonials, ads/growth views.

### Analytics & funnels
- [ ] `page_visits` **and** `analytics_events` tables + `/api/track` that **persists funnel events**, not just pageviews. *(The "optimize blind" fix.)*
- [ ] GA4 + Microsoft Clarity + optional Meta Pixel hooks via an `analytics` provider.
- [ ] `visitor_session` cookie set in middleware (skipped for Bearer + public-cacheable routes so the CDN can cache).

### A/B testing
- [ ] `getABVariant()` / `getWeightedABVariant()` + `trackABConversion()` deterministic-by-user assignment. *(TA: `lib/ab-test.ts`.)*
- [ ] Conversion levers shipped: exit-intent, scarcity counter, sticky CTA, multiple landing variants.

### SEO
- [ ] Per-page `metadata`, canonical=self, `x-default`, robots (allow AI bots), dynamic titles.
- [ ] JSON-LD (Article + Breadcrumb + FAQ), dynamic `sitemap.ts`.
- [ ] Programmatic pages at scale where the domain allows (`/[thing]/[city]`). *(TA: 29 `/carta-astral/[ciudad]` pages.)*

### Security (RLS, rate-limit, validation)
- [ ] **RLS enabled** on public tables; app role granted `BYPASSRLS` (avoids `current_setting` policies while clearing the Supabase warning).
- [ ] **Parameterized queries only** (`$1,$2`), never string interpolation.
- [ ] Per-route rate-limit map in `middleware.ts` (payments/login tight, register ≥20/min for CGNAT). *(TA: `middleware.ts:6`.)*
- [ ] Security headers on every response (X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy/CSP).
- [ ] No fail-open insecure defaults; secrets only via env, never committed.
- [ ] Input sanitized where rendered (XSS) and at the AI boundary (Guardian).

### AI layer
- [ ] Provider adapter (OpenAI/Anthropic), one model default, **cost logged to `ai_cost_log`**.
- [ ] Prompt-service pattern (one file per AI feature in `lib/services/`).
- [ ] Layered context-builder for hyper-personalization (the "MCP" — user data + location + history). *(TA: `lib/services/user-context-builder.ts`.)*
- [ ] **Guardian** safety/validation pass + response cache (`ai_response_cache`) to cap cost.
- [ ] No hallucinations: deterministic facts come from a real engine/source, not the model.

### Observability
- [ ] Sentry wired (client + server), source-mapped.
- [ ] Structured `console.*` logs tagged `[cron:name]` etc.; error boundary in the UI.

---

## 2. Conventions the generated code MUST follow

- **`ensureSchema()` pattern** — all schema as idempotent `CREATE TABLE IF NOT EXISTS` in `lib/database.ts`. In **production `ensureSchema` is skipped** (`initialized = NODE_ENV==='production'`); DDL ships as `scripts/sql/*.sql` to run manually (app role isn't owner). Never assume a column exists in prod just because it's in `ensureSchema`.
- **Pooler connection** — Supabase via the Supavisor **pooler** (`aws-N-<region>.pooler.supabase.com`, user `dbuser.<ref>`, session mode :5432). The direct `db.<ref>.supabase.co` host is IPv6-only and dies when Fly's IPv4 egress can't reach it.
- **Fire-and-forget crons** — `void Promise.resolve().then(() => job()).catch(log)`; never block the request; `Promise.allSettled` for parallel work.
- **`getEffectivePlan` gating** — single source of truth for premium checks; no ad-hoc `plan === 'x'` scattered around.
- **`email-logger` for all sends**; **`services-config` for all external compute** (API key + graceful fallback, no hardcoded URLs).
- **Parameterized queries**, **env-only secrets**, **bilingual (es/en)** user-facing strings via a language context.
- **No disabled submit buttons** for validation — submit always enabled (except `isLoading`); validate on click, show inline errors.
- **Surgical, simplicity-first** (Karpathy): generate only what `domain.config.ts` declares; LLM never edits Spine files.

---

## 3. Per-project deliverables (beyond code)

- [ ] **SQL migrations** — `scripts/sql/NNN_*.sql`, ordered, idempotent, run-by-hand-safe (mirror of `ensureSchema`), including the RLS + BYPASSRLS grant block.
- [ ] **ER diagram / UML** of the data model.
- [ ] **`.env.example`** — every key the project reads, with placeholder + comment (DB pooler URL, JWT secret, Stripe, Resend, OpenAI, Sentry, CRON_SECRET, CRON_PRIMARY_MACHINE_ID, OAuth, analytics IDs). *(TA currently lacks this — Puglit must always emit it.)*
- [ ] **README** — setup, env, migrate, dev, deploy, cron registration.
- [ ] **Seed data** — minimal rows to make the app demoable on first boot.
- [ ] **`SECURITY_REPORT.md`** — output of the SAST + deps + secrets + red-team gate.
- [ ] **Deploy artifacts** — Dockerfile, `fly.toml` (auto_stop off, ≥2 machines, rolling).

---

## 4. Gap list — Puglit generator today vs this standard

**Puglit currently produces:** data model, logo/brand, bespoke landing, SQL, ER diagram, and assembles a spine with auth + dashboard + analytics (`spine/lib`: auth, auth-guards, auth-emails, mailer, analytics, rate-limit, db, records, users).

| Area | Standard | Puglit today | Gap |
|---|---|---|---|
| Auth | magic-link, Google OAuth, mobile Bearer, verification gate | basic auth + emails + guards | ⚠️ magic-link/OAuth/mobile/verification not wired |
| Payments | Stripe subs + MP + coupons + `getEffectivePlan` + metering | none | ⚠️ **fully missing** — no payments wiring |
| Email lifecycle | drip/cart/reengage/weekly + bounce poller + email-logger | `mailer.ts` + auth emails only | ⚠️ lifecycle crons + bounce poller + tracked-send logger missing |
| Cron | fire-and-forget routes + cron-primary + secret | none | ⚠️ no cron scaffold |
| Admin | admin-auth + dashboard | none (only user dashboard) | ⚠️ missing |
| Analytics | `page_visits` + `analytics_events` + funnel `/api/track` | `analytics.ts` + `/api/track` | 🟡 partial — confirm funnel-event persistence + GA4/Clarity hooks |
| A/B testing | variant assign + conversion track + levers | none | ⚠️ missing |
| SEO | metadata + JSON-LD + sitemap + programmatic pages | landing only | ⚠️ no per-page SEO / sitemap / pSEO |
| Security gate | RLS+BYPASSRLS, rate-limit map, headers, red-team | rate-limit lib present | 🟡 partial — RLS block, full middleware map, SECURITY gate loop missing |
| AI layer | provider adapter + prompt services + context-builder + Guardian + cost log | none | ⚠️ missing |
| Engine (bespoke 20%) | domain compute slot via services-config + fallback | none | ⚠️ **the unique product is not generated** |
| Observability | Sentry client+server | none | ⚠️ missing |
| Deliverables | `.env.example`, README, seed, SECURITY_REPORT, fly.toml | README, SQL, ER | 🟡 partial — `.env.example`, seed, security report, deploy artifacts missing |

**Net:** the Spine's *auth/dashboard/analytics third* is roughly in place; **payments, email lifecycle, cron, admin, A/B, SEO, AI layer, observability, and the bespoke domain engine are not yet generated** — these are the priority build-out to reach the TodoAstros bar.
