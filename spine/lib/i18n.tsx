"use client"
/**
 * Puglit Spine — i18n.
 * Minimal bilingual context (matches TodoAstros' useLanguage pattern). Chrome
 * strings live in DICT; domain content (name, tagline, plan features) comes from
 * domain.config. Default language = first entry in identity.languages. Choice is
 * persisted to localStorage. Add languages by extending identity.languages + DICT.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import config from "@/domain.config"

type Lang = string
const SUPPORTED = config.identity.languages
const DEFAULT_LANG: Lang = SUPPORTED[0] || "en"

const DICT: Record<string, Record<string, string>> = {
  en: {
    signin: "Sign in",
    getStarted: "Get started",
    pricing: "Pricing",
    features: "Features",
    heroCtaPrimary: "Start free",
    heroCtaSecondary: "See pricing",
    pricingTitle: "Simple, honest pricing",
    pricingSub: "Start free. Upgrade when it pays for itself.",
    mostPopular: "Most popular",
    perMonth: "/mo",
    perYear: "/yr",
    oneTime: "one-time",
    free: "Free",
    choose: "Choose",
    builtWith: "Built with",
  },
  es: {
    signin: "Iniciar sesión",
    getStarted: "Empezar",
    pricing: "Precios",
    features: "Funciones",
    heroCtaPrimary: "Empezar gratis",
    heroCtaSecondary: "Ver precios",
    pricingTitle: "Precios simples y honestos",
    pricingSub: "Empezá gratis. Subí de plan cuando se paga solo.",
    mostPopular: "Más popular",
    perMonth: "/mes",
    perYear: "/año",
    oneTime: "pago único",
    free: "Gratis",
    choose: "Elegir",
    builtWith: "Hecho con",
  },
}

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
  languages: string[]
}
const LanguageContext = createContext<Ctx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG)

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("lang") : null
    if (saved && SUPPORTED.includes(saved)) setLangState(saved)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    if (typeof window !== "undefined") window.localStorage.setItem("lang", l)
  }

  const t = (key: string) => DICT[lang]?.[key] ?? DICT[DEFAULT_LANG]?.[key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: SUPPORTED }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}
