/**
 * Puglit home (puglit.com). Server component: the examples gallery merges the
 * curated seed demos with community-generated projects pulled live from the DB.
 */
import Link from "next/link"
import { Mark } from "@/components/Mark"
import { WaitlistForm } from "@/components/WaitlistForm"
import { SEEDS } from "@/lib/seeds"
import { listProjects } from "@/lib/db"

export const dynamic = "force-dynamic"
const GH = "https://github.com/azweig/puglit"

export default async function Home() {
  const community = (await listProjects(12).catch(() => [])).map((p) => ({
    slug: p.slug,
    name: p.name,
    headline: typeof p.config?.landing?.hero?.headline === "string" ? p.config.landing.hero.headline : (Object.values(p.config?.landing?.hero?.headline || {})[0] as string) || p.name,
    color: p.config?.identity?.brandColor || "#7C3AED",
    modules: Object.keys(p.config?.modules || {}).filter((k) => (p.config.modules as Record<string, boolean>)[k]),
    href: `/x/${p.slug}`,
  }))

  const steps = [
    ["1", "Interview", "Answer a few questions about your idea — 2 minutes."],
    ["2", "Assemble", "The spine is configured deterministically. It compiles first try."],
    ["3", "Generate", "Your entities, copy, plans & the unique engine get written for you."],
    ["4", "Preview live", "Your SaaS goes live instantly as a real example you can share."],
  ]
  const caps = [
    ["🔐", "Auth & accounts"], ["💳", "Payments"], ["✉️", "Email lifecycle"], ["⏰", "Cron jobs"],
    ["🛠️", "Admin panel"], ["🤖", "AI layer"], ["📈", "Analytics"], ["🚀", "Deploy on Fly"],
  ]

  return (
    <div>
      <header className="sticky top-0 z-50 backdrop-blur bg-ink/72 border-b border-white/8">
        <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg text-violet-bright"><Mark size={28} /><span className="text-white">Puglit</span></Link>
          <div className="flex items-center gap-5 text-sm font-semibold text-white/65">
            <a href="#how" className="hidden sm:inline hover:text-white">How it works</a>
            <a href="#examples" className="hidden sm:inline hover:text-white">Examples</a>
            <a href={GH} target="_blank" rel="noopener" className="hover:text-white">★ GitHub</a>
            <Link href="/generate" className="px-4 py-2 rounded-lg text-white" style={{ background: "var(--violet)" }}>Generate free</Link>
          </div>
        </nav>
      </header>

      {/* hero */}
      <section className="relative grid-bg overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(60% 50% at 50% -10%, rgba(124,58,237,.34), transparent 70%)" }} />
        <div className="max-w-6xl mx-auto px-5 py-24 sm:py-32 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-violet-bright bg-violet/12 border border-violet/30 px-3 py-1.5 rounded-full">Open-core SaaS factory · free in beta</span>
          <h1 className="mt-6 text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.02] max-w-4xl mx-auto">Describe your idea.<br /><span className="bg-gradient-to-r from-violet-bright to-[#c4b1ff] bg-clip-text text-transparent">Get a real SaaS.</span></h1>
          <p className="mt-6 text-lg sm:text-xl text-white/65 max-w-2xl mx-auto">Puglit interviews you, then assembles a complete, monetizable SaaS — auth, payments, email, AI, admin, deploy included. Not a frontend mockup. The whole thing.</p>
          <div className="mt-9 flex gap-3 justify-center flex-wrap">
            <Link href="/generate" className="px-7 py-3.5 rounded-xl font-bold text-white shadow-lg" style={{ background: "var(--violet)", boxShadow: "0 14px 34px -10px rgba(124,58,237,.7)" }}>Generate your SaaS — free</Link>
            <a href="#examples" className="px-7 py-3.5 rounded-xl font-bold text-white border border-white/12 hover:border-white/25">See examples</a>
          </div>
          <p className="mt-5 text-sm text-white/45">Free while in beta · generated projects become public examples · <span className="text-white/70">MIT core</span></p>
        </div>
      </section>

      {/* how */}
      <section id="how" className="border-t border-white/8 py-20">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl font-extrabold text-center">How it works</h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map(([n, t, d]) => (
              <div key={n} className="bg-ink2 border border-white/8 rounded-2xl p-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm text-white mb-3" style={{ background: "var(--violet)" }}>{n}</div>
                <h3 className="font-bold">{t}</h3><p className="mt-1.5 text-sm text-white/60 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* batteries */}
      <section className="border-t border-white/8 py-20">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl font-extrabold text-center">Batteries included</h2>
          <p className="text-white/60 text-center mt-2">Every generated SaaS gets the full spine. Toggle optional modules per project.</p>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {caps.map(([ic, t]) => (
              <div key={t} className="bg-ink2 border border-white/8 rounded-xl p-5"><div className="text-xl mb-2">{ic}</div><b className="text-sm">{t}</b></div>
            ))}
          </div>
        </div>
      </section>

      {/* examples */}
      <section id="examples" className="border-t border-white/8 py-20">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl font-extrabold text-center">Live examples — one config each</h2>
          <p className="text-white/60 text-center mt-2 max-w-2xl mx-auto">Each was produced by Puglit’s own interview. Swap one typed <code className="text-violet-bright">domain.config.ts</code> and the whole app rebrands.</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SEEDS.map((s) => (
              <a key={s.slug} href={s.live} target="_blank" rel="noopener" className="relative bg-ink2 border border-white/8 rounded-2xl p-6 hover:-translate-y-1 hover:border-white/20 transition block overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: s.color }} />
                <div className="flex items-center gap-2 font-extrabold text-lg"><span className="w-3 h-3 rounded" style={{ background: s.color }} />{s.name}</div>
                <div className="text-xs text-white/55 mt-0.5">{s.category}</div>
                <div className="mt-3 font-bold">{s.headline}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">{s.modules.map((m) => <span key={m} className="text-[10px] font-semibold text-white/55 bg-white/5 border border-white/8 px-2 py-0.5 rounded">{m}</span>)}</div>
                <div className="mt-4 text-sm font-bold" style={{ color: s.color }}>See it live →</div>
              </a>
            ))}
            {community.map((c) => (
              <Link key={c.slug} href={c.href} className="relative bg-ink2 border border-white/8 rounded-2xl p-6 hover:-translate-y-1 hover:border-white/20 transition block overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: c.color }} />
                <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wide bg-violet/20 text-violet-bright px-2 py-0.5 rounded-full">Community</span>
                <div className="flex items-center gap-2 font-extrabold text-lg"><span className="w-3 h-3 rounded" style={{ background: c.color }} />{c.name}</div>
                <div className="mt-3 font-bold">{c.headline}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">{c.modules.slice(0, 5).map((m) => <span key={m} className="text-[10px] font-semibold text-white/55 bg-white/5 border border-white/8 px-2 py-0.5 rounded">{m}</span>)}</div>
                <div className="mt-4 text-sm font-bold" style={{ color: c.color }}>See it live →</div>
              </Link>
            ))}
            <Link href="/generate" className="flex flex-col items-center justify-center text-center bg-transparent border border-dashed border-white/15 rounded-2xl p-6 hover:border-violet/50 transition">
              <div className="text-3xl">＋</div><div className="font-bold mt-2">Your idea here</div><div className="text-xs text-white/50 mt-1">2 minutes · free</div>
              <span className="mt-4 px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: "var(--violet)" }}>Generate free</span>
            </Link>
          </div>
        </div>
      </section>

      {/* open source */}
      <section id="opensource" className="border-t border-white/8 py-20">
        <div className="max-w-4xl mx-auto px-5 text-center bg-ink2 border border-white/8 rounded-3xl py-12">
          <span className="text-xs font-bold tracking-widest uppercase text-violet-bright">Open core · MIT</span>
          <h2 className="text-3xl font-extrabold mt-3">The spine is open source</h2>
          <p className="text-white/60 mt-3 max-w-xl mx-auto">Read it, fork it, self-host it. The domain-agnostic SaaS skeleton is MIT-licensed; the hosted generator is the layer on top.</p>
          <a href={GH} target="_blank" rel="noopener" className="inline-block mt-6 px-6 py-3 rounded-xl font-bold text-white border border-white/12 hover:border-white/25">★ Star azweig/puglit on GitHub</a>
        </div>
      </section>

      {/* waitlist (paid tier) */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl font-extrabold">Want it pushed to your own repo?</h2>
          <p className="text-white/60 mt-3">Generation is free in beta and lands in our public gallery. Leave your email and we’ll tell you when private generation (your GitHub, your billing) opens.</p>
          <WaitlistForm />
        </div>
      </section>

      <footer className="border-t border-white/8 py-10">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between flex-wrap gap-4 text-sm text-white/50">
          <Link href="/" className="flex items-center gap-2 text-violet-bright font-extrabold"><Mark size={22} /><span className="text-white">Puglit</span></Link>
          <span>The opinionated SaaS factory · MIT core · built in Peru 🇵🇪</span>
          <a href={GH} target="_blank" rel="noopener" className="text-violet-bright font-bold">GitHub →</a>
        </div>
      </footer>
    </div>
  )
}
