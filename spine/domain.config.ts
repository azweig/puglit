/**
 * Puglit — domain.config.ts
 * =============================================================================
 * THE SEAM. This is the only thing that changes per project.
 *
 * It is a TYPED CONTRACT that drives two things:
 *   1. [deterministic] which modules turn on, the plans, env, fly.toml, deps.
 *   2. [LLM] the contract the AI must conform to when generating the domain
 *      (entities → schema, routes, prompts, copy, the engine). The LLM may NOT
 *      invent tables, routes, or modules outside what is declared here.
 *
 * The interview (INTAKE.md) produces a filled version of this file.
 * See ./examples for worked configs (recipes, betting).
 * =============================================================================
 */

// ---------------------------------------------------------------------------
// Module toggles (CORE modules are always on and not listed here)
// ---------------------------------------------------------------------------
export interface Modules {
  payments?: boolean        // Stripe subs + checkout + webhooks + plans + gating
  emailLifecycle?: boolean  // verification, drip, cart-abandonment, reengagement, bounce poller
  contentBlog?: boolean     // blog/magazine with AI author personas + SEO + scheduled publish
  aiLayer?: boolean         // provider adapter, prompt-services, context-builder, guardian, cost log
  engine?: boolean          // prediction/compute slot (external service / AI / deterministic)
  profiling?: boolean       // implicit events → latent profile, progressive questions, recs
  gamification?: boolean    // streaks, check-ins, testimonials, live counters
  growth?: boolean          // A/B, ads-optimizer, exit-intent, conversion wizards
  mobile?: boolean          // Expo app + RevenueCat
  geo?: boolean             // cities, geoip, tz, weather
}

// ---------------------------------------------------------------------------
// Entities — the LLM generates schema (SQL + types + RLS), CRUD routes and UI
// from these. Keep them declarative; do not write SQL here.
// ---------------------------------------------------------------------------
export type FieldType =
  | "text" | "longtext" | "int" | "float" | "bool" | "date" | "datetime"
  | "json" | "enum" | "ref" | "money" | "slug" | "url" | "email"

export interface Field {
  name: string
  type: FieldType
  required?: boolean
  unique?: boolean
  enumValues?: string[]      // for type:"enum"
  ref?: string               // for type:"ref" → target entity name
  aiGenerated?: boolean      // value produced by the AI layer (e.g. a generated article body)
  note?: string              // hint for the LLM
}

export interface Entity {
  name: string               // singular, e.g. "Recipe"
  plural?: string
  fields: Field[]
  ownedByUser?: boolean       // adds user_id + RLS so users only see their rows
  public?: boolean            // readable without auth (e.g. blog posts)
  searchable?: boolean
}

// ---------------------------------------------------------------------------
// The Engine — the unique "compute" of the product (optional).
// ---------------------------------------------------------------------------
export interface Engine {
  kind: "external-service" | "ai" | "deterministic"
  description: string                 // what it computes, in plain words
  inputs?: string[]                   // what the user provides
  output?: string                     // what it returns
  externalServiceEnv?: string         // env var with the service URL (for external-service)
  deterministicNote?: string          // algorithm description (for deterministic)
}

// ---------------------------------------------------------------------------
// Content/blog with author personas (optional)
// ---------------------------------------------------------------------------
export interface AuthorPersona {
  name: string
  voice: string               // tone/personality the AI writes in
  expertise: string
}
export interface ContentConfig {
  contentType: string         // "recipe", "article", "match preview"…
  authors?: AuthorPersona[]   // the personalities that "write" the blog
  cadence?: "daily" | "morning-noon-evening" | "weekly" | "manual"
  autoPublishSocial?: boolean
}

// ---------------------------------------------------------------------------
// Monetization
// ---------------------------------------------------------------------------
export interface Plan {
  id: string                  // "free" | "pro" | "mensual" | "anual" | "lifetime"
  priceUsd: number            // 0 for free
  interval?: "month" | "year" | "one-time"
  features: string[]          // human-readable; gated via getEffectivePlan
}
export interface Monetization {
  model: "free" | "freemium" | "subscription" | "one-time" | "ads"
  providers: ("stripe" | "mercadopago" | "revenuecat")[]
  plans: Plan[]
}

// ---------------------------------------------------------------------------
// Identity / brand / compliance
// ---------------------------------------------------------------------------
export interface Identity {
  name: string
  tagline: string
  domain: string
  languages: ("es" | "en" | string)[]
  brandColor?: string
  targetMarkets?: string[]    // countries
}
export interface Compliance {
  // domain-specific guardrails baked in as first-class (e.g. responsible gambling,
  // allergen/nutrition disclaimers, medical disclaimers).
  notices?: string[]
  ageGate?: number
}

// ---------------------------------------------------------------------------
// The full config
// ---------------------------------------------------------------------------
export interface DomainConfig {
  identity: Identity
  modules: Modules
  entities: Entity[]
  engine?: Engine
  content?: ContentConfig
  monetization: Monetization
  compliance?: Compliance
  platforms: { web: boolean; mobile?: boolean; admin?: boolean }
  infra?: { deploy: "fly"; region?: string; emailProvider?: "resend" }
}

// ---------------------------------------------------------------------------
// Example (minimal) — see ./examples for full ones.
// ---------------------------------------------------------------------------
const example: DomainConfig = {
  identity: {
    name: "Example",
    tagline: "A Puglit-generated SaaS",
    domain: "example.com",
    languages: ["es", "en"],
  },
  modules: { payments: true, emailLifecycle: true, aiLayer: true },
  entities: [
    {
      name: "Note",
      ownedByUser: true,
      fields: [
        { name: "title", type: "text", required: true },
        { name: "body", type: "longtext" },
      ],
    },
  ],
  monetization: {
    model: "freemium",
    providers: ["stripe"],
    plans: [
      { id: "free", priceUsd: 0, features: ["10 notes"] },
      { id: "pro", priceUsd: 9, interval: "month", features: ["unlimited notes", "AI summaries"] },
    ],
  },
  platforms: { web: true, admin: true },
  infra: { deploy: "fly", emailProvider: "resend" },
}

export default example
