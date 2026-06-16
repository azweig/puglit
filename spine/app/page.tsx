"use client"
/**
 * Puglit Spine — landing (sales page).
 * 100% driven by domain.config: hero/value-props/FAQ/CTA from `landing`, pricing
 * from `monetization.plans`, brand color from `identity.brandColor`. A generated
 * project gets a real, on-brand sales page with zero hand-editing. When `landing`
 * is absent it falls back to identity.tagline + generic CTAs.
 */
import { useState } from "react"
import Link from "next/link"
import config from "@/domain.config"
import { Mark } from "@/components/Mark"
import { useLanguage } from "@/lib/i18n"

export default function Landing() {
  const { t, tr, lang, setLang, languages } = useLanguage()
  const { identity, monetization, landing } = config
  const es = lang === "es"

  const headline = tr(landing?.hero.headline) || identity.name
  const sub = tr(landing?.hero.subheadline) || identity.tagline
  const ctaPrimary = tr(landing?.hero.ctaPrimary) || t("getStarted")
  const ctaSecondary = tr(landing?.hero.ctaSecondary) || t("pricing")

  const fmtPrice = (p: typeof monetization.plans[number]) => {
    if (p.priceUsd === 0) return t("free")
    if (p.interval === "one-time") return `$${p.priceUsd}`
    return `$${p.priceUsd}`
  }
  const priceUnit = (p: typeof monetization.plans[number]) =>
    p.priceUsd === 0 ? "" : p.interval === "year" ? t("perYear") : p.interval === "one-time" ? ` ${t("oneTime")}` : t("perMonth")

  return (
    <div>
      {/* nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-paper/85 border-b border-black/5">
        <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand">
            <Mark size={30} />
            <span className="font-extrabold text-ink text-lg tracking-tight">{identity.name}</span>
          </div>
          <div className="flex items-center gap-5 text-sm font-medium text-ink/70">
            {landing?.valueProps && <a href="#why" className="hidden sm:inline hover:text-ink">{es ? "Por qué" : "Why"}</a>}
            <a href="#pricing" className="hidden sm:inline hover:text-ink">{t("pricing")}</a>
            <button onClick={() => setLang(es ? (languages.find((x) => x !== "es") || "en") : "es")}
              className="uppercase text-xs tracking-wider hover:text-ink">{es ? "EN" : "ES"}</button>
            <Link href="/login" className="hover:text-ink">{t("signin")}</Link>
            <Link href="/register" className="px-4 py-2 rounded-lg text-white font-semibold shadow-sm" style={{ background: "var(--brand)" }}>{ctaPrimary}</Link>
          </div>
        </nav>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(60% 60% at 75% 0%, color-mix(in srgb, var(--brand) 14%, transparent), transparent 70%)` }} />
        <div className="max-w-6xl mx-auto px-5 py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-brand bg-brand/10 px-3 py-1 rounded-full">{identity.tagline}</span>
            <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight text-ink leading-[1.04]">{headline}</h1>
            <p className="mt-5 text-lg text-ink/70 max-w-xl">{sub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register" className="px-6 py-3.5 rounded-xl text-white font-semibold shadow-lg" style={{ background: "var(--brand)", boxShadow: "0 12px 30px -8px color-mix(in srgb, var(--brand) 55%, transparent)" }}>{ctaPrimary}</Link>
              <a href="#why" className="px-6 py-3.5 rounded-xl font-semibold text-ink border border-black/10 hover:border-black/25">{ctaSecondary}</a>
            </div>
            {landing?.socialProof && (
              <p className="mt-6 text-sm text-ink/55 flex items-center gap-2">
                <span className="flex -space-x-1.5">{[0, 1, 2, 3].map((i) => <span key={i} className="w-5 h-5 rounded-full border-2 border-paper" style={{ background: `color-mix(in srgb, var(--brand) ${40 + i * 15}%, white)` }} />)}</span>
                {tr(landing.socialProof)}
              </p>
            )}
          </div>
          {/* product mock — a visual preview of the app, not real data */}
          <div className="relative">
            <div className="rounded-2xl bg-white border border-black/5 shadow-2xl shadow-black/10 p-5 rotate-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-brand"><Mark size={22} /></span>
                <span className="font-bold text-ink text-sm">{es ? "Tu semana" : "Your week"}</span>
                <span className="ml-auto text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">{es ? "Generado con IA" : "AI-generated"}</span>
              </div>
              <div className="space-y-2">
                {(es
                  ? [["Lun", "Bowl de quinoa y palta"], ["Mar", "Pollo al limón + verduras"], ["Mié", "Pasta integral pesto"], ["Jue", "Tacos de lentejas"]]
                  : [["Mon", "Quinoa & avocado bowl"], ["Tue", "Lemon chicken + veggies"], ["Wed", "Whole-wheat pesto pasta"], ["Thu", "Lentil tacos"]]
                ).map(([d, meal], i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2.5">
                    <span className="w-9 text-xs font-bold text-ink/40 uppercase">{d}</span>
                    <span className="text-sm text-ink/85">{meal}</span>
                    <span className="ml-auto text-brand text-sm">✓</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: "var(--brand)" }}>{es ? "Ver lista de compras" : "View shopping list"}</button>
            </div>
          </div>
        </div>
      </section>

      {/* value props */}
      {landing?.valueProps && landing.valueProps.length > 0 && (
        <section id="why" className="max-w-6xl mx-auto px-5 py-20">
          <div className="grid gap-6 sm:grid-cols-3">
            {landing.valueProps.map((v, i) => (
              <div key={i} className="rounded-2xl border border-black/5 bg-white p-7 shadow-sm">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold mb-4" style={{ background: "var(--brand)" }}>✦</div>
                <h3 className="font-bold text-ink text-lg">{tr(v.title)}</h3>
                <p className="mt-2 text-ink/65 leading-relaxed">{tr(v.body)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* pricing */}
      <section id="pricing" className="bg-white border-y border-black/5">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <h2 className="text-3xl font-extrabold text-ink text-center">{t("pricingTitle")}</h2>
          <p className="mt-2 text-center text-ink/60">{t("pricingSub")}</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {monetization.plans.map((p) => (
              <div key={p.id} className={`rounded-2xl p-7 border ${p.highlight ? "border-brand shadow-xl relative" : "border-black/10"}`} style={p.highlight ? { boxShadow: "0 20px 50px -20px color-mix(in srgb, var(--brand) 50%, transparent)" } : undefined}>
                {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-white px-3 py-1 rounded-full" style={{ background: "var(--brand)" }}>{t("mostPopular")}</span>}
                <h3 className="font-bold text-ink capitalize">{tr(p.name) || p.id}</h3>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-ink">{fmtPrice(p)}</span>
                  <span className="text-ink/50 mb-1.5 text-sm">{priceUnit(p)}</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm text-ink/75">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex gap-2"><span className="text-brand font-bold">✓</span>{tr(f)}</li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-7 block text-center px-4 py-2.5 rounded-lg font-semibold ${p.highlight ? "text-white" : "text-ink border border-black/10 hover:border-black/25"}`} style={p.highlight ? { background: "var(--brand)" } : undefined}>{p.priceUsd === 0 ? t("getStarted") : t("choose")}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* faq */}
      {landing?.faq && landing.faq.length > 0 && (
        <section className="max-w-3xl mx-auto px-5 py-20">
          <h2 className="text-3xl font-extrabold text-ink text-center mb-10">FAQ</h2>
          <div className="divide-y divide-black/5 border-y border-black/5">
            {landing.faq.map((f, i) => <FaqRow key={i} q={tr(f.q)} a={tr(f.a)} defaultOpen={i === 0} />)}
          </div>
        </section>
      )}

      {/* final CTA */}
      {landing?.finalCta && (
        <section className="px-5 pb-20">
          <div className="max-w-5xl mx-auto rounded-3xl px-8 py-16 text-center text-white" style={{ background: "var(--brand)" }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold">{tr(landing.finalCta.headline)}</h2>
            <Link href="/register" className="mt-7 inline-block px-7 py-3.5 rounded-xl bg-white text-ink font-bold hover:bg-white/90">{tr(landing.finalCta.button)}</Link>
          </div>
        </section>
      )}

      {/* footer */}
      <footer className="border-t border-black/5">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink/50">
          <div className="flex items-center gap-2 text-brand"><Mark size={22} /><span className="text-ink/70 font-semibold">{identity.name}</span></div>
          <span>{t("builtWith")} <a href="https://puglit.com" className="font-semibold text-brand hover:underline">Puglit</a></span>
        </div>
      </footer>
    </div>
  )
}

function FaqRow({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="py-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left font-semibold text-ink">
        {q}
        <span className="text-brand text-xl leading-none">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="mt-2 text-ink/65 leading-relaxed">{a}</p>}
    </div>
  )
}
