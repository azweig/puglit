/**
 * Puglit — domain.config.ts
 * =============================================================================
 * THE SEAM. This is the only thing that changes per project.
 *
 * It is a TYPED CONTRACT that drives two things:
 *   1. [deterministic] which modules turn on, the plans, env, fly.toml, deps,
 *      AND the marketing landing (hero/value props/pricing/FAQ).
 *   2. [LLM] the contract the AI must conform to when generating the domain
 *      (entities → schema, routes, prompts, copy, the engine). The LLM may NOT
 *      invent tables, routes, or modules outside what is declared here.
 *
 * The interview (INTAKE.md) produces a filled version of this file.
 * See ./examples for worked configs (recipes, betting).
 * =============================================================================
 */

// A string, or a per-language map ({ es: "...", en: "..." }). The landing
// resolves it against the active language; falls back to the first language.
export type Localized = string | Record<string, string>

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
  name?: Localized            // display name (defaults to id, capitalized)
  priceUsd: number            // 0 for free
  interval?: "month" | "year" | "one-time"
  features: Localized[]       // human-readable; gated via getEffectivePlan
  highlight?: boolean         // render as the "most popular" card
}
export interface Monetization {
  model: "free" | "freemium" | "subscription" | "one-time" | "ads"
  providers: ("stripe" | "mercadopago" | "revenuecat")[]
  plans: Plan[]
}

// ---------------------------------------------------------------------------
// Landing / marketing — drives the public sales page. Optional: when absent the
// landing falls back to identity.tagline + generic CTAs. Fill it to actually sell.
// ---------------------------------------------------------------------------
export interface LandingHero {
  headline: Localized
  subheadline: Localized
  ctaPrimary: Localized
  ctaSecondary?: Localized
}
export interface ValueProp {
  title: Localized
  body: Localized
}
export interface FaqItem {
  q: Localized
  a: Localized
}
export interface LandingConfig {
  hero: LandingHero
  socialProof?: Localized         // a one-line stat or quote shown under the hero
  valueProps?: ValueProp[]        // the benefit cards (NOT internal modules)
  faq?: FaqItem[]
  finalCta?: { headline: Localized; button: Localized }
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
  landing?: LandingConfig
  compliance?: Compliance
  platforms: { web: boolean; mobile?: boolean; admin?: boolean }
  infra?: { deploy: "fly"; region?: string; emailProvider?: "resend" }
}

// ---------------------------------------------------------------------------
// DEMO CONFIG — "Mesa", an AI meal-planning SaaS. This is the live showcase at
// puglit-spine.vercel.app: everything on the landing (name, color, copy, plans)
// comes from THIS object. Swap it and the whole site rebrands. See ./examples
// for other verticals.
// ---------------------------------------------------------------------------
const mesa: DomainConfig = {
  identity: {
    name: "Mesa",
    tagline: "Planificá tus comidas con IA",
    domain: "mesa.app",
    languages: ["es", "en"],
    brandColor: "#10B981", // emerald — note how it recolors the entire site
    targetMarkets: ["AR", "MX", "ES"],
  },
  modules: { payments: true, aiLayer: true, contentBlog: true, emailLifecycle: true },
  entities: [
    {
      name: "MealPlan",
      ownedByUser: true,
      fields: [
        { name: "week_of", type: "date", required: true },
        { name: "servings", type: "int", required: true },
        { name: "plan", type: "json", aiGenerated: true, note: "7 days × meals" },
      ],
    },
    {
      name: "Recipe",
      public: true,
      searchable: true,
      fields: [
        { name: "title", type: "text", required: true },
        { name: "slug", type: "slug", unique: true },
        { name: "body", type: "longtext", aiGenerated: true },
        { name: "minutes", type: "int" },
      ],
    },
  ],
  engine: {
    kind: "ai",
    description: "Builds a weekly meal plan from tastes, budget, restrictions and pantry.",
    inputs: ["servings", "dietary restrictions", "budget", "pantry items"],
    output: "a 7-day plan + an aisle-ordered shopping list",
  },
  monetization: {
    model: "freemium",
    providers: ["stripe"],
    plans: [
      {
        id: "free",
        priceUsd: 0,
        features: [
          { es: "1 plan por semana", en: "1 plan per week" },
          { es: "Recetas con pasos claros", en: "Recipes with clear steps" },
          { es: "Lista de compras", en: "Shopping list" },
        ],
      },
      {
        id: "pro",
        name: { es: "Pro", en: "Pro" },
        priceUsd: 6,
        interval: "month",
        highlight: true,
        features: [
          { es: "Planes ilimitados", en: "Unlimited plans" },
          { es: "IA que aprende tus gustos", en: "AI that learns your tastes" },
          { es: "Usa lo que ya tenés en casa", en: "Uses what's already in your kitchen" },
          { es: "Soporte prioritario", en: "Priority support" },
        ],
      },
      {
        id: "anual",
        name: { es: "Pro anual", en: "Pro yearly" },
        priceUsd: 49,
        interval: "year",
        features: [
          { es: "Todo lo de Pro", en: "Everything in Pro" },
          { es: "2 meses gratis", en: "2 months free" },
        ],
      },
    ],
  },
  landing: {
    hero: {
      headline: { es: "Comé bien sin pensarlo.", en: "Eat well without thinking." },
      subheadline: {
        es: "Mesa arma tu plan semanal de comidas con IA según tus gustos, tu presupuesto y lo que ya tenés en casa — con la lista de compras lista para usar.",
        en: "Mesa builds your weekly meal plan with AI around your tastes, budget and what's already in your kitchen — shopping list included.",
      },
      ctaPrimary: { es: "Armá tu plan gratis", en: "Build your free plan" },
      ctaSecondary: { es: "Ver cómo funciona", en: "See how it works" },
    },
    socialProof: { es: "+12.000 planes generados esta semana", en: "+12,000 plans generated this week" },
    valueProps: [
      {
        title: { es: "Personalizado de verdad", en: "Truly personal" },
        body: { es: "Aprende qué te gusta y qué descartás. Cada semana afina un poco más.", en: "It learns what you love and what you skip. Sharper every single week." },
      },
      {
        title: { es: "Listo en 30 segundos", en: "Ready in 30 seconds" },
        body: { es: "Decí cuántos son y qué evitás. Mesa hace el resto al instante.", en: "Say who's eating and what to avoid. Mesa does the rest instantly." },
      },
      {
        title: { es: "Cero desperdicio", en: "Zero waste" },
        body: { es: "Tu plan se convierte en una lista ordenada por góndola y usa lo que ya tenés.", en: "Your plan becomes an aisle-ordered list and uses what you already have." },
      },
    ],
    faq: [
      {
        q: { es: "¿Necesito saber cocinar?", en: "Do I need to know how to cook?" },
        a: { es: "No. Cada receta trae pasos claros y tiempos reales, pensados para días ocupados.", en: "No. Every recipe has clear steps and realistic timings, made for busy days." },
      },
      {
        q: { es: "¿Funciona si soy vegetariano o celíaco?", en: "Does it work if I'm vegetarian or celiac?" },
        a: { es: "Sí. Configurás tus restricciones una vez y Mesa nunca las rompe.", en: "Yes. Set your restrictions once and Mesa never breaks them." },
      },
      {
        q: { es: "¿Puedo cancelar cuando quiera?", en: "Can I cancel anytime?" },
        a: { es: "Sí, en un clic y sin preguntas. El plan gratis no caduca.", en: "Yes, one click, no questions. The free plan never expires." },
      },
    ],
    finalCta: {
      headline: { es: "Tu próxima semana de comidas, resuelta.", en: "Next week's meals, sorted." },
      button: { es: "Empezar gratis", en: "Start free" },
    },
  },
  platforms: { web: true, admin: true },
  infra: { deploy: "fly", emailProvider: "resend" },
}

export default mesa
