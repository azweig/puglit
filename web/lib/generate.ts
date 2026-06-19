/**
 * Puglit web — generate.ts
 * Deterministic assembly of a DomainConfig from the interview answers. The
 * UNIQUE parts (name, what it does, the 3 benefits) come verbatim from the
 * founder — no hallucination. The boilerplate (CTAs, plan scaffolding, FAQ) is
 * templated per language. (The hosted product will later layer an LLM pass to
 * polish copy + generate entities/prompts; this is the honest deterministic core.)
 */
import type { DomainConfig, Modules } from "@/lib/domain-types"

export interface IntakeAnswers {
  name: string
  what: string
  audience: string
  benefits: string[]
  color: string
  languages: "es" | "en" | "both"
  monetization: "free" | "freemium" | "subscription"
  price: number
  modules: string[]
  email: string
  logo?: string        // data URL of an uploaded logo (rendered on the landing)
  websiteImage?: string // data URL of an existing site screenshot (reference only)
  references?: string  // synthesized digest of references the founder gave up front (URLs/docs/images)
  archetype?: string   // product archetype from the diagnosis ("game", "status_monitoring", …) — routes the build mold
}

const VALID_MODULES = [
  "payments", "emailLifecycle", "contentBlog", "aiLayer", "engine",
  "profiling", "gamification", "growth", "mobile", "geo",
] as const

export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "app"
}

const T = {
  en: {
    cta: "Get started", cta2: "See pricing", free: "Free",
    vpBody: (n: string) => [`Built into ${n} from day one — no glue code.`, `It just works, so you can focus on your users.`, `Reliable, secure and ready to scale.`],
    planFreeFeat: ["Core features", "Community support"],
    planProExtra: "Priority support",
    planYear: ["Everything in Pro", "2 months free"],
    faq: (n: string, price: number, model: string) => [
      { q: "How much does it cost?", a: model === "free" ? `${n} is free.` : `Start free, then ${price ? `$${price}/mo` : "a simple monthly plan"}. Cancel anytime.` },
      { q: "Can I cancel anytime?", a: "Yes — one click, no questions." },
      { q: "Do I own my data?", a: "Yes. Your data is yours and you can export it." },
    ],
    finalCta: (n: string) => `Ready to try ${n}?`,
    finalBtn: "Get started",
    proof: (a: string) => `Made for ${a}.`,
  },
  es: {
    cta: "Empezar gratis", cta2: "Ver precios", free: "Gratis",
    vpBody: (n: string) => [`Viene en ${n} desde el día uno — sin código pegamento.`, `Funciona solo, para que te enfoques en tus usuarios.`, `Confiable, seguro y listo para escalar.`],
    planFreeFeat: ["Funciones principales", "Soporte de la comunidad"],
    planProExtra: "Soporte prioritario",
    planYear: ["Todo lo de Pro", "2 meses gratis"],
    faq: (n: string, price: number, model: string) => [
      { q: "¿Cuánto cuesta?", a: model === "free" ? `${n} es gratis.` : `Empezás gratis y después ${price ? `$${price}/mes` : "un plan mensual simple"}. Cancelás cuando quieras.` },
      { q: "¿Puedo cancelar cuando quiera?", a: "Sí — en un clic, sin preguntas." },
      { q: "¿Mis datos son míos?", a: "Sí. Tus datos son tuyos y los podés exportar." },
    ],
    finalCta: (n: string) => `¿List@ para probar ${n}?`,
    finalBtn: "Empezar gratis",
    proof: (a: string) => `Hecho para ${a}.`,
  },
}

export function generateConfig(a: IntakeAnswers): DomainConfig {
  const langs = a.languages === "both" ? ["en", "es"] : [a.languages || "es"]
  const L = langs[0] === "es" ? T.es : T.en
  const name = (a.name || "").trim()
  const benefits = (a.benefits || []).map((b) => b.trim()).filter(Boolean).slice(0, 3)
  const what = (a.what || "").trim()

  const modules: Modules = {}
  for (const m of a.modules || []) {
    if ((VALID_MODULES as readonly string[]).includes(m)) (modules as Record<string, boolean>)[m] = true
  }

  const price = Math.max(0, Math.round(a.price || 0))
  const proFeatures = [...benefits, L.planProExtra]
  const plans = []
  if (a.monetization === "free") {
    plans.push({ id: "free", priceUsd: 0, features: L.planFreeFeat })
  } else if (a.monetization === "freemium") {
    plans.push({ id: "free", priceUsd: 0, features: L.planFreeFeat })
    plans.push({ id: "pro", priceUsd: price || 9, interval: "month" as const, highlight: true, features: proFeatures })
    plans.push({ id: "anual", priceUsd: (price || 9) * 10, interval: "year" as const, features: L.planYear })
  } else {
    plans.push({ id: "pro", priceUsd: price || 9, interval: "month" as const, highlight: true, features: proFeatures })
    plans.push({ id: "anual", priceUsd: (price || 9) * 10, interval: "year" as const, features: L.planYear })
  }

  const vpBodies = L.vpBody(name)
  const config: DomainConfig = {
    identity: {
      name,
      tagline: what,
      domain: `${slugify(name)}.app`,
      languages: langs,
      brandColor: /^#[0-9a-fA-F]{6}$/.test(a.color) ? a.color : "#7C3AED",
      targetMarkets: [],
      ...(a.logo && a.logo.startsWith("data:image") ? { logoUrl: a.logo } : {}),
    },
    modules,
    entities: [
      {
        name: "Item",
        ownedByUser: true,
        fields: [
          { name: "title", type: "text", required: true },
          { name: "data", type: "json" },
        ],
      },
    ],
    monetization: {
      model: a.monetization,
      providers: ["stripe"],
      plans,
    },
    landing: {
      hero: {
        headline: benefits[0] || what,
        subheadline: what,
        ctaPrimary: L.cta,
        ctaSecondary: L.cta2,
      },
      socialProof: a.audience.trim() ? L.proof(a.audience.trim()) : undefined,
      valueProps: benefits.map((b, i) => ({ title: b, body: vpBodies[i % vpBodies.length] })),
      faq: L.faq(name, price, a.monetization),
      finalCta: { headline: L.finalCta(name), button: L.finalBtn },
    },
    platforms: { web: true, admin: true },
    infra: { deploy: "fly", emailProvider: "resend" },
  }
  if (modules.aiLayer) {
    config.engine = { kind: "ai", description: what, output: "the product's core result" }
  }
  return config
}
