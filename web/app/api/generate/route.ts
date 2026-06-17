/**
 * POST /api/generate
 * Takes the interview answers, assembles a DomainConfig, persists BOTH the raw
 * answers and the generated config, and returns the slug + config. Free while
 * in beta — generated projects become public examples (featured=true) instead
 * of being pushed to the user's repo.
 */
import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { generateConfig, slugify, type IntakeAnswers } from "@/lib/generate"
import { saveProject, slugExists, isConfigured } from "@/lib/db"
import { designEntities } from "@/lib/entitygen"
import { generateLandingHtml } from "@/lib/landing-gen"
import { applyBranding } from "@/lib/branding"
import { generateLogoSvg } from "@/lib/logo-gen"

// The AI may return human labels ("English", "Both", "Subscription") — normalize.
function normLang(v: string): IntakeAnswers["languages"] {
  const s = v.toLowerCase()
  if (s.includes("both") || s.includes("ambos")) return "both"
  if (s.startsWith("es") || s.includes("span") || s.includes("español")) return "es"
  return "en"
}
function normMon(v: string): IntakeAnswers["monetization"] {
  const s = v.toLowerCase()
  if (s.includes("freemium")) return "freemium"
  if (s.includes("subscription") || s.includes("suscrip")) return "subscription"
  if (s.includes("free") || s.includes("gratis")) return "free"
  return "freemium"
}

export async function POST(request: NextRequest) {
  try {
    const a = (await request.json()) as Partial<IntakeAnswers>
    if (!a.name || !a.what || !Array.isArray(a.benefits)) {
      return NextResponse.json({ error: "Missing name, description or benefits" }, { status: 400 })
    }
    const answers: IntakeAnswers = {
      name: String(a.name).slice(0, 60),
      what: String(a.what).slice(0, 240),
      audience: String(a.audience || "").slice(0, 120),
      benefits: (a.benefits || []).map((b) => String(b).slice(0, 80)).filter(Boolean).slice(0, 3),
      color: String(a.color || "#7C3AED"),
      languages: normLang(String(a.languages || "")),
      monetization: normMon(String(a.monetization || "")),
      price: Number(a.price) || 0,
      modules: Array.isArray(a.modules) ? a.modules.map(String) : [],
      email: String(a.email || "").slice(0, 255),
      // uploaded assets (data URLs) — capped to keep the row small
      logo: typeof a.logo === "string" && a.logo.startsWith("data:image") && a.logo.length < 700_000 ? a.logo : undefined,
      websiteImage: typeof a.websiteImage === "string" && a.websiteImage.startsWith("data:image") && a.websiteImage.length < 900_000 ? a.websiteImage : undefined,
    }

    const config = generateConfig(answers)

    // Apply the branding the diagnosis produced (logo monogram + full palette).
    applyBranding(config, (a as Record<string, any>).branding)
    // Real vector logo mark (reuse the one from the diagnosis if present).
    if (!config.identity.logoSvg) {
      const logoSvg = await generateLogoSvg(config)
      if (logoSvg) config.identity.logoSvg = logoSvg
    }

    // Design the REAL data model with the LLM (replaces the generic "Item").
    const ents = await designEntities({ name: answers.name, what: answers.what, benefits: answers.benefits })
    if (ents && ents.length) config.entities = ents

    // unique slug
    let slug = slugify(answers.name)
    if (await slugExists(slug)) slug = `${slug}-${randomBytes(2).toString("hex")}`

    // Use the design the user chose; otherwise generate one.
    const chosen = (a as Record<string, any>).landingHtml
    const landingHtml = typeof chosen === "string" && chosen.length > 100 ? chosen : await generateLandingHtml(config)

    let saved = false
    if (isConfigured()) {
      try {
        await saveProject({ slug, email: answers.email || null, name: answers.name, answers: answers as unknown as Record<string, unknown>, config, landingHtml })
        saved = true
      } catch (e) {
        console.error("[generate] save failed:", (e as Error).message)
      }
    }

    return NextResponse.json({ ok: true, slug, config, saved })
  } catch (e) {
    console.error("Generate error:", e)
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 })
  }
}
