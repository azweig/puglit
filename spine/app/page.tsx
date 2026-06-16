"use client"
/**
 * Puglit Spine — landing page.
 * 100% driven by domain.config: hero from identity, feature cards from the
 * enabled modules, pricing from monetization.plans. A generated project gets a
 * correct, on-brand landing with zero hand-editing.
 */
import Link from "next/link"
import config from "@/domain.config"
import { Mark } from "@/components/Mark"
import { useLanguage } from "@/lib/i18n"

const MODULE_COPY: Record<string, { en: [string, string]; es: [string, string] }> = {
  payments: { en: ["Payments", "Subscriptions, checkout & plan gating out of the box."], es: ["Pagos", "Suscripciones, checkout y gating de planes listos."] },
  emailLifecycle: { en: ["Email lifecycle", "Verification, drip, re-engagement and bounce handling."], es: ["Emails de ciclo", "Verificación, drip, reenganche y manejo de rebotes."] },
  contentBlog: { en: ["Content engine", "AI authors publish SEO-ready posts on a schedule."], es: ["Motor de contenido", "Autores IA publican posts SEO en agenda."] },
  aiLayer: { en: ["AI layer", "Provider adapter, context builder, guardian & cost log."], es: ["Capa de IA", "Adapter, contexto, guardián y log de costos."] },
  engine: { en: ["Custom engine", "Your unique compute — AI, external service or deterministic."], es: ["Motor propio", "Tu cómputo único — IA, servicio externo o determinista."] },
  profiling: { en: ["Profiling", "Implicit events become a latent profile & recommendations."], es: ["Perfilado", "Eventos implícitos → perfil latente y recomendaciones."] },
  gamification: { en: ["Gamification", "Streaks, check-ins, testimonials and live counters."], es: ["Gamificación", "Rachas, check-ins, testimonios y contadores en vivo."] },
  growth: { en: ["Growth kit", "A/B tests, ads optimizer and conversion wizards."], es: ["Kit de growth", "A/B tests, optimizador de ads y wizards de conversión."] },
  mobile: { en: ["Mobile app", "An Expo app sharing the same API, RevenueCat ready."], es: ["App móvil", "App Expo sobre la misma API, lista para RevenueCat."] },
  geo: { en: ["Geo", "Cities, geo-IP, timezones and weather."], es: ["Geo", "Ciudades, geo-IP, zonas horarias y clima."] },
}

const CORE_FEATURE = {
  en: ["Auth & accounts", "JWT sessions (web + mobile), magic links, verification & reset."] as [string, string],
  es: ["Cuentas & auth", "Sesiones JWT (web + móvil), magic links, verificación y reset."] as [string, string],
}

export default function Landing() {
  const { t, lang, setLang, languages } = useLanguage()
  const { identity, monetization, modules } = config
  const l = (lang === "es" ? "es" : "en") as "en" | "es"

  const enabled = (Object.keys(modules) as (keyof typeof modules)[]).filter((k) => modules[k])
  const features = [CORE_FEATURE[l], ...enabled.map((k) => MODULE_COPY[k]?.[l]).filter(Boolean) as [string, string][]]

  const fmtPrice = (p: typeof monetization.plans[number]) => {
    if (p.priceUsd === 0) return t("free")
    const unit = p.interval === "year" ? t("perYear") : p.interval === "one-time" ? "" : t("perMonth")
    return `$${p.priceUsd}${p.interval === "one-time" ? ` ${t("oneTime")}` : unit}`
  }
  const popularIdx = monetization.plans.length > 1 ? 1 : -1

  return (
    <div>
      {/* nav */}
      <header className="sticky top-0 z-20 backdrop-blur bg-paper/80 border-b border-black/5">
        <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand">
            <Mark size={30} />
            <span className="font-extrabold text-ink text-lg tracking-tight">{identity.name}</span>
          </div>
          <div className="flex items-center gap-5 text-sm font-medium text-ink/70">
            <a href="#features" className="hidden sm:inline hover:text-ink">{t("features")}</a>
            <a href="#pricing" className="hidden sm:inline hover:text-ink">{t("pricing")}</a>
            <button onClick={() => setLang(l === "en" ? (languages.find((x) => x !== "en") || "es") : "en")}
              className="uppercase text-xs tracking-wider hover:text-ink">{l === "en" ? "ES" : "EN"}</button>
            <Link href="/login" className="hover:text-ink">{t("signin")}</Link>
            <Link href="/register" className="px-4 py-2 rounded-lg text-white font-semibold" style={{ background: "var(--brand)" }}>{t("getStarted")}</Link>
          </div>
        </nav>
      </header>

      {/* hero */}
      <section className="grid-bg border-b border-black/5">
        <div className="max-w-6xl mx-auto px-5 py-24 sm:py-32 text-center">
          <div className="inline-flex text-brand mb-6"><Mark size={64} /></div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-ink max-w-3xl mx-auto leading-[1.05]">
            {identity.name}
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-ink/70 max-w-2xl mx-auto">{identity.tagline}</p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link href="/register" className="px-6 py-3 rounded-xl text-white font-semibold shadow-lg shadow-brand/20" style={{ background: "var(--brand)" }}>{t("heroCtaPrimary")}</Link>
            <a href="#pricing" className="px-6 py-3 rounded-xl font-semibold text-ink border border-black/10 hover:border-black/25">{t("heroCtaSecondary")}</a>
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-20">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink text-center">{t("features")}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, desc], i) => (
            <div key={i} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold mb-4" style={{ background: "var(--brand)" }}>{i + 1}</div>
              <h3 className="font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-ink/65 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="bg-white border-y border-black/5">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink text-center">{t("pricingTitle")}</h2>
          <p className="mt-2 text-center text-ink/60">{t("pricingSub")}</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {monetization.plans.map((p, i) => (
              <div key={p.id} className={`rounded-2xl p-7 border ${i === popularIdx ? "border-brand shadow-xl shadow-brand/10 relative" : "border-black/10"}`}>
                {i === popularIdx && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-white px-3 py-1 rounded-full" style={{ background: "var(--brand)" }}>{t("mostPopular")}</span>
                )}
                <h3 className="font-bold text-ink capitalize">{p.id}</h3>
                <div className="mt-2 text-3xl font-extrabold text-ink">{fmtPrice(p)}</div>
                <ul className="mt-5 space-y-2 text-sm text-ink/70">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex gap-2"><span className="text-brand font-bold">✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-6 block text-center px-4 py-2.5 rounded-lg font-semibold ${i === popularIdx ? "text-white" : "text-ink border border-black/10 hover:border-black/25"}`} style={i === popularIdx ? { background: "var(--brand)" } : undefined}>{t("choose")}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink/50">
        <div className="flex items-center gap-2 text-brand"><Mark size={22} /><span className="text-ink/70 font-semibold">{identity.name}</span></div>
        <span>{t("builtWith")} <a href="https://puglit.com" className="font-semibold text-brand hover:underline">Puglit</a></span>
      </footer>
    </div>
  )
}
