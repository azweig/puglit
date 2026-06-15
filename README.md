<div align="center">

# 🐶 Puglit

### The opinionated SaaS factory.
**Describe your idea → answer a few questions → get a complete, monetizable, deployable SaaS in a GitHub repo.**

`MIT licensed core` · `Next.js 15` · `PostgreSQL` · `Fly.io` · `Stripe` · `Resend`

</div>

---

## What is this?

Most AI builders (v0, Bolt, Lovable) give you a pretty **frontend** — and then you spend weeks wiring up the boring-but-critical 80%: auth, subscriptions, transactional email, cron jobs, an admin panel, an AI layer, deploy.

**Puglit ships the whole thing.** It's an opinionated, production-tested SaaS **spine** (extracted from a real product doing real revenue) plus a generator that:

1. **Interviews you** (theme, monetization, AI features, blog-with-authors, predictions engine, …).
2. **Assembles the spine deterministically** — auth, payments, email, crons, deploy are *copied & configured*, never hallucinated. They compile on the first try.
3. **Uses an LLM only for your domain** — your entities, schema, prompts, copy, and the unique "engine" of your product.
4. **Runs an automated security pass** (SAST + deps + secret scan + LLM red-team) before delivering.
5. **Pushes a complete repo** to your GitHub.

> The opinion **is** the product. You don't re-decide the stack every time — you configure it.

## Why deterministic + LLM-only-on-domain?

Because the part that must never break (Stripe webhooks, auth, DB migrations, deploy) is mechanical and proven — so it's assembled mechanically. The part that's genuinely unique (your business logic) is where the AI earns its keep. Result: **reliability of a boilerplate + flexibility of a generator.**

## The three layers

| Layer | What | Status |
|---|---|---|
| **1. The Spine** (this repo, MIT) | The opinionated, domain-agnostic SaaS skeleton with toggleable modules + a typed `domain.config.ts` seam. | 🏗️ building |
| **2. The CLI** (`npx create-puglit`) | Runs the interview locally with your own API key, assembles the spine, LLM-generates the domain. | ⏳ next |
| **3. The Web** (puglit.com) | Hosted interview + generation + GitHub push + per-project billing. | ⏳ later |

## Stack (fixed & opinionated)

Next.js 15 (App Router) · TypeScript · Tailwind + Radix/shadcn · PostgreSQL (raw `pg`) · Fly.io (Docker, rolling deploy) · Stripe (+ MercadoPago) · Resend (+ nodemailer) · OpenAI/Anthropic · Sentry.

## Repo map

```
puglit/
├─ BLUEPRINT.md        # the constitution: architecture, modules, conventions, rules
├─ INTAKE.md           # the interview the generator runs
├─ SECURITY.md         # secure-by-default + the automated ethical-hacking gate
├─ domain.config.ts    # the DSL seam: declare entities + features + toggles
├─ examples/           # worked configs (recipes, betting…) proving the seam
├─ modules/            # module catalog (core + optional toggles) with status
├─ spine/              # the actual Next.js skeleton being extracted
└─ infra/              # Dockerfile, fly.toml template, secrets.example
```

## Status

Phase 1 (the Spine) is under active extraction. See [`modules/README.md`](modules/README.md) for per-module progress.

---

<div align="center"><sub>Built with 🐶 in Peru · MIT</sub></div>
