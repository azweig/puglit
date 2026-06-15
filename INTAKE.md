# Puglit — INTAKE (the interview)

The generator (CLI or web) runs this conversation, then writes a `domain.config.ts`. The LLM asks one block at a time, infers smart defaults, and only asks what it can't infer. **Goal: a non-technical founder can answer all of it.** Each block maps to fields in `domain.config.ts`.

> Interview principles: short, plain-language, one decision at a time, propose a default and let them confirm. Never ask for anything the answer to a previous question already implies.

---

### Block 1 — Identity → `identity`
- What does your product do, in one sentence?
- Name + tagline. (Suggest some if they don't have one.)
- Domain (they provide; e.g. `puglit.com`).
- Languages (default `es` + `en`).
- Target markets/countries. Brand color (optional).

### Block 2 — The core value / "engine" → `engine`
- What's the *unique* thing your product computes or produces?
- Is there a prediction/computation system? → **no** / **AI generates it** / **deterministic algorithm** / **external model service**.
- If external: what does it take in, what does it return? (→ `engine.kind="external-service"`, env var.)
- *(This is the heart of the 20% the LLM builds. Probe until concrete.)*

### Block 3 — Entities → `entities`
- What are the main "things" in your product? (e.g. recipes, matches, notes, clients.)
- For each: key fields, is it private-per-user or public, is it searchable, is any field AI-generated?
- *(The LLM proposes a schema from the answers and confirms.)*

### Block 4 — Monetization → `monetization`
- Free / freemium / subscription / one-time / ads?
- Tiers + prices (propose 2–3). What's gated behind paid?
- Payment provider: Stripe (global) and/or MercadoPago (LATAM); RevenueCat if mobile.

### Block 5 — AI features → `modules.aiLayer`
- Does it use AI beyond the engine? (chat, generation, summaries, recommendations?)
- Provider preference (OpenAI/Anthropic). Cost ceiling per user?

### Block 6 — Content / blog with authors → `content`, `modules.contentBlog`
- Do you want a blog/magazine? (great for SEO + retention)
- **Author personas?** Define 1–3 "writers" with a voice + expertise (e.g. recipe chefs, sports columnists). The AI writes in their voice.
- Cadence (daily / morning-noon-evening / weekly / manual). Auto-publish to social?

### Block 7 — Personalization & lifecycle → `modules.profiling`, `modules.emailLifecycle`, `modules.gamification`
- Profile users implicitly (learn preferences) and recommend?
- Lifecycle emails: verification, onboarding drip, cart-abandonment, reengagement, weekly summary?
- Gamification: streaks, check-ins, testimonials, live counters?

### Block 8 — Growth → `modules.growth`
- A/B testing? Ads-optimizer? Exit-intent / conversion wizards on the landing?

### Block 9 — Platforms → `platforms`, `modules.mobile`, `modules.geo`
- Web only, or also a mobile app (Expo + RevenueCat)?
- Admin panel? Geo features (cities, geoip, timezone, weather)?

### Block 10 — Compliance → `compliance`
- Any domain that needs guardrails? (betting → responsible gambling + age gate; health/food → disclaimers; finance → risk notices.)
- Age gate? Required legal notices?

---

## Output

A complete `domain.config.ts`. The generator then runs the pipeline in `BLUEPRINT.md §4` (assemble → schema → domain → security → verify → deliver). Show the user a summary + estimated complexity tier (which sets the price on the web product) before generating.
