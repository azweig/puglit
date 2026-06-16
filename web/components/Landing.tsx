/**
 * Puglit web — Landing renderer.
 * Server component that renders a real sales landing from any DomainConfig.
 * Used by /x/[slug] so every generated project gets an instant live preview —
 * no per-project deploy needed. Mirrors the spine's landing, light theme,
 * brand color injected via --brand. FAQ uses native <details> (no client JS).
 */
import Link from "next/link"
import type { DomainConfig, Localized, Plan } from "@/lib/domain-types"
import { Mark } from "@/components/Mark"

function makeTr(lang: string, fallback: string) {
  return (v: Localized | undefined): string => {
    if (v == null) return ""
    if (typeof v === "string") return v
    return v[lang] ?? v[fallback] ?? Object.values(v)[0] ?? ""
  }
}

export function Landing({ config }: { config: DomainConfig }) {
  const { identity, monetization, landing } = config
  const lang = identity.languages[0] || "en"
  const es = lang === "es"
  const tr = makeTr(lang, identity.languages[0] || "en")
  const brand = identity.brandColor || "#7C3AED"
  const accent = identity.accentColor || brand
  const Logo = ({ size }: { size: number }) =>
    identity.logoUrl ? <img src={identity.logoUrl} alt={identity.name} style={{ height: size }} className="w-auto" />
      : identity.logoMonogram ? <span className="rounded-lg inline-flex items-center justify-center font-extrabold text-white shrink-0" style={{ width: size, height: size, background: brand, fontSize: Math.round(size * 0.46) }}>{identity.logoMonogram}</span>
      : <Mark size={size} />

  const headline = tr(landing?.hero.headline) || identity.name
  const sub = tr(landing?.hero.subheadline) || tr(identity.tagline)
  const ctaPrimary = tr(landing?.hero.ctaPrimary) || (es ? "Empezar" : "Get started")

  const price = (p: Plan) => (p.priceUsd === 0 ? (es ? "Gratis" : "Free") : `$${p.priceUsd}`)
  const unit = (p: Plan) => (p.priceUsd === 0 ? "" : p.interval === "year" ? (es ? "/año" : "/yr") : p.interval === "one-time" ? "" : (es ? "/mes" : "/mo"))
  // A free product shouldn't show a pricing table or a "Pricing" link.
  const isFree = monetization.model === "free" || monetization.plans.every((p) => p.priceUsd === 0)

  return (
    <div style={{ ["--brand" as string]: brand }} className="bg-paper text-ink min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur bg-paper/85 border-b border-black/5">
        <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand"><Logo size={28} /><span className="font-extrabold text-ink text-lg tracking-tight">{identity.name}</span></div>
          <div className="flex items-center gap-4 text-sm font-medium text-ink/70">
            {!isFree && <a href="#pricing" className="hidden sm:inline hover:text-ink">{es ? "Precios" : "Pricing"}</a>}
            <button data-demo-cta className="px-4 py-2 rounded-lg text-white font-semibold cursor-pointer" style={{ background: brand }}>{ctaPrimary}</button>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(60% 50% at 75% 0%, color-mix(in srgb, ${brand} 16%, transparent), transparent 70%)` }} />
        <div className="max-w-6xl mx-auto px-5 py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex text-xs font-semibold tracking-wide uppercase text-brand bg-brand/10 px-3 py-1 rounded-full">{tr(identity.tagline)}</span>
            <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight text-ink leading-[1.04]">{headline}</h1>
            <p className="mt-5 text-lg text-ink/70 max-w-xl">{sub}</p>
            <div className="mt-8 flex gap-3">
              <button data-demo-cta className="px-6 py-3.5 rounded-xl text-white font-semibold shadow-lg cursor-pointer" style={{ background: brand }}>{ctaPrimary}</button>
              {!isFree && <a href="#pricing" className="px-6 py-3.5 rounded-xl font-semibold text-ink border border-black/10">{tr(landing?.hero.ctaSecondary) || (es ? "Ver precios" : "See pricing")}</a>}
            </div>
            {landing?.socialProof && <p className="mt-6 text-sm text-ink/55">{tr(landing.socialProof)}</p>}
          </div>
          {landing?.valueProps && landing.valueProps.length > 0 && (
            <div className="rounded-2xl bg-white border border-black/5 shadow-2xl shadow-black/10 p-5 rotate-1">
              <div className="flex items-center gap-2 mb-4 text-brand"><Logo size={22} /><span className="font-bold text-ink text-sm">{identity.name}</span><span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: accent }}>{es ? "Vistazo" : "Overview"}</span></div>
              <div className="space-y-2">
                {landing.valueProps.slice(0, 4).map((v, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2.5"><span className="text-brand text-sm font-bold">✓</span><span className="text-sm text-ink/85">{tr(v.title)}</span></div>
                ))}
              </div>
              <button data-demo-cta className="mt-4 w-full rounded-lg py-2.5 text-center text-sm font-semibold text-white cursor-pointer" style={{ background: brand }}>{ctaPrimary}</button>
            </div>
          )}
        </div>
      </section>

      {landing?.valueProps && landing.valueProps.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 py-20">
          <div className="grid gap-6 sm:grid-cols-3">
            {landing.valueProps.map((v, i) => (
              <div key={i} className="rounded-2xl border border-black/5 bg-white p-7 shadow-sm">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold mb-4" style={{ background: accent }}>✦</div>
                <h3 className="font-bold text-ink text-lg">{tr(v.title)}</h3>
                <p className="mt-2 text-ink/65 leading-relaxed">{tr(v.body)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isFree && (
      <section id="pricing" className="bg-white border-y border-black/5">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <h2 className="text-3xl font-extrabold text-ink text-center">{es ? "Precios simples y honestos" : "Simple, honest pricing"}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {monetization.plans.map((p) => (
              <div key={p.id} className={`rounded-2xl p-7 border ${p.highlight ? "border-brand shadow-xl relative" : "border-black/10"}`}>
                {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-white px-3 py-1 rounded-full" style={{ background: brand }}>{es ? "Más popular" : "Most popular"}</span>}
                <h3 className="font-bold text-ink capitalize">{tr(p.name) || p.id}</h3>
                <div className="mt-2 flex items-end gap-1"><span className="text-4xl font-extrabold text-ink">{price(p)}</span><span className="text-ink/50 mb-1.5 text-sm">{unit(p)}</span></div>
                <ul className="mt-6 space-y-2.5 text-sm text-ink/75">
                  {p.features.map((f, j) => <li key={j} className="flex gap-2"><span className="text-brand font-bold">✓</span>{tr(f)}</li>)}
                </ul>
                <button data-demo-cta className={`mt-7 w-full text-center px-4 py-2.5 rounded-lg font-semibold cursor-pointer ${p.highlight ? "text-white" : "text-ink border border-black/10"}`} style={p.highlight ? { background: brand } : undefined}>{p.priceUsd === 0 ? (es ? "Empezar" : "Get started") : (es ? "Elegir" : "Choose")}</button>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {landing?.faq && landing.faq.length > 0 && (
        <section className="max-w-3xl mx-auto px-5 py-20">
          <h2 className="text-3xl font-extrabold text-ink text-center mb-10">FAQ</h2>
          <div className="divide-y divide-black/5 border-y border-black/5">
            {landing.faq.map((f, i) => (
              <details key={i} className="py-4 group" open={i === 0}>
                <summary className="font-semibold text-ink cursor-pointer list-none flex justify-between items-center">{tr(f.q)}<span className="text-brand text-xl">+</span></summary>
                <p className="mt-2 text-ink/65 leading-relaxed">{tr(f.a)}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {landing?.finalCta && (
        <section className="px-5 pb-20"><div className="max-w-5xl mx-auto rounded-3xl px-8 py-16 text-center text-white" style={{ background: brand }}>
          <h2 className="text-3xl sm:text-4xl font-extrabold">{tr(landing.finalCta.headline)}</h2>
          <button data-demo-cta className="mt-7 inline-block px-7 py-3.5 rounded-xl bg-white text-ink font-bold cursor-pointer">{tr(landing.finalCta.button)}</button>
        </div></section>
      )}

      <footer className="border-t border-black/5"><div className="max-w-6xl mx-auto px-5 py-8 flex items-center justify-between text-sm text-ink/50">
        <div className="flex items-center gap-2 text-brand"><Logo size={20} /><span className="text-ink/70 font-semibold">{identity.name}</span></div>
        <span>Built with <Link href="/" className="font-semibold text-brand">Puglit</Link></span>
      </div></footer>
    </div>
  )
}
