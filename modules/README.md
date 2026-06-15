# Puglit — Module catalog & extraction status

Each module is being extracted from the production TodoAstros codebase, cleaned of domain coupling, and templatized with a toggle. Status legend: ⬜ not started · 🏗️ extracting · ✅ done.

> Extraction rule: a module is "done" when it (a) compiles standalone, (b) has zero astrology-specific references, (c) reads its config from `domain.config.ts`, and (d) documents its env + DB tables here.

## CORE (always assembled)

| Module | Status | Source in TodoAstros | Notes |
|---|---|---|---|
| **app-shell** | ⬜ | `app/`, `components/ui/*`, `lib/get-language.ts` | Next15 skeleton, Radix kit, i18n es/en, landing |
| **db** | ✅ | `lib/database.ts` (4.2k LOC → generic core), `lib/db-indexes.ts` | pool (pooler-tuned) + ensureSchema(core) + tracking. SQL in `scripts/sql/001_core.sql` |
| **auth** | ✅ | `lib/auth.ts`, `auth-guards.ts`, `app/api/auth/*` | JWT+Bearer, register/login/logout/me, magic-link, verify-email, forgot/reset. Plans/gating config-driven. SQL `002_auth.sql`. Google OAuth deferred to growth-ish. |
| **middleware** | ✅ | `middleware.ts`, `lib/rate-limit*.ts` | rate-limit map (tuned) + headers + session cookie |
| **analytics** | ✅ | `lib/analytics.ts`, `app/api/track`, `page_visits`+`analytics_events` | the FIXED funnel tracking |
| **admin** | ⬜ | `lib/admin-auth.ts`, `app/api/admin/*` | admin gate + minimal dashboard |
| **deploy** | ✅ (template) | `Dockerfile`, `fly.toml` | in `infra/` — done as template |
| **observability** | ⬜ | `lib/sentry.ts` | Sentry |

## OPTIONAL (toggled in domain.config.ts)

| Module | Toggle | Source | Notes |
|---|---|---|---|
| **payments** | `payments` | `app/api/stripe/*`, `mercadopago/*`, `billing/*`, `coupons/*`, `lib/services` gating | subs, webhooks, plans, `getEffectivePlan`, feature-usage |
| **email-lifecycle** | `emailLifecycle` | `lib/email-*.ts`, `services/cart-abandonment-emails`, `email-bounce-poller`, crons `drip-onboarding`/`reengagement`/`verification-reminder` | Resend + bounce IMAP + tracked sends |
| **content-blog** | `contentBlog` | `lib/revista*.ts`, `app/revista/*`, crons `revista-morning/noon/evening`, `lib/seo` | AI author personas + SEO + scheduled publish + social |
| **ai-layer** | `aiLayer` | `lib/services/*` (prompt services), `user-context-builder`, `guardian.ts`, `ai_cost_log` | provider adapter, MCP context, guardian, cost log |
| **engine** | `engine` | `lib/services-config.ts`, `astronomy-service`, `astro-engine` (pattern) | external compute + API key + fallback |
| **profiling** | `profiling` | `app/api/espejo`, `app/api/profile/*`, `pre-profile-prompt` | implicit events → latent profile, progressive Qs |
| **gamification** | `gamification` | `app/api/gamification`, `checkin`, `testimonials`, `live-count` | streaks, check-ins |
| **growth** | `growth` | `lib/ab-test.ts`, `services/google-ads`, `growth-agent`, exit-intent components | A/B, ads, wizards |
| **mobile** | `mobile` | `mobile/` (Expo) + `app/api/mobile/*` + RevenueCat | shares the API |
| **geo** | `geo` | `app/api/cities`/`geo`/`weather`, `geoip-country`, `tz-lookup` | |

## Extraction order (slices)
1. ✅ Frame — repo, BLUEPRINT, INTAKE, SECURITY, `domain.config.ts`, examples, infra.
2. 🏗️ Core — db ✅, middleware ✅, analytics ✅, auth ✅; **pending: app-shell, admin, observability.** **(this slice)**
3. ⬜ payments · 4. email-lifecycle · 5. ai-layer · 6. content-blog · 7. engine · 8. profiling · 9. gamification+growth · 10. mobile.

Each slice leaves the Spine compiling & deployable.
