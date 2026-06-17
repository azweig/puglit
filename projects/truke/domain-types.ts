/**
 * Puglit — domain-types.ts
 * The TYPES of the seam, split out from the config instance so the active
 * config (domain.config.ts) can be swapped without touching the contract, and
 * so examples + the showcase build can share one source of truth for types.
 */

// A string, or a per-language map ({ es: "...", en: "..." }). The landing
// resolves it against the active language; falls back to the first language.
export type Localized = string | Record<string, string>

export interface Modules {
  payments?: boolean
  emailLifecycle?: boolean
  contentBlog?: boolean
  aiLayer?: boolean
  engine?: boolean
  profiling?: boolean
  gamification?: boolean
  growth?: boolean
  mobile?: boolean
  geo?: boolean
}

export type FieldType =
  | "text" | "longtext" | "int" | "float" | "bool" | "date" | "datetime"
  | "json" | "enum" | "ref" | "money" | "slug" | "url" | "email"

export interface Field {
  name: string
  type: FieldType
  required?: boolean
  unique?: boolean
  enumValues?: string[]
  ref?: string
  aiGenerated?: boolean
  note?: string
}

export interface Entity {
  name: string
  plural?: string
  fields: Field[]
  ownedByUser?: boolean
  public?: boolean
  searchable?: boolean
}

export interface Engine {
  kind: "external-service" | "ai" | "deterministic"
  description: string
  inputs?: string[]
  output?: string
  externalServiceEnv?: string
  deterministicNote?: string
}

export interface AuthorPersona {
  name: string
  voice: string
  expertise: string
}
export interface ContentConfig {
  contentType: string
  authors?: AuthorPersona[]
  cadence?: "daily" | "morning-noon-evening" | "weekly" | "manual"
  autoPublishSocial?: boolean
}

export interface Plan {
  id: string
  name?: Localized
  priceUsd: number
  interval?: "month" | "year" | "one-time"
  features: Localized[]
  highlight?: boolean
}
export interface Monetization {
  model: "free" | "freemium" | "subscription" | "one-time" | "ads"
  providers: ("stripe" | "mercadopago" | "revenuecat")[]
  plans: Plan[]
}

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
  socialProof?: Localized
  valueProps?: ValueProp[]
  faq?: FaqItem[]
  finalCta?: { headline: Localized; button: Localized }
}

export interface Identity {
  name: string
  tagline: Localized
  domain: string
  languages: ("es" | "en" | string)[]
  brandColor?: string
  targetMarkets?: string[]
}
export interface Compliance {
  notices?: string[]
  ageGate?: number
}

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
