/**
 * POST /api/designs { ...answers, branding }
 * Returns 2 distinct landing DESIGN OPTIONS (bespoke HTML) for the user to
 * choose from — generated, not saved. The chosen one is passed to /api/generate.
 */
import { NextRequest, NextResponse } from "next/server"
import { generateConfig, type IntakeAnswers } from "@/lib/generate"
import { applyBranding } from "@/lib/branding"
import { generateLandingVariants } from "@/lib/landing-gen"
import { generateLogoSvg } from "@/lib/logo-gen"
import { aiConfigured } from "@/lib/openai"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  if (!aiConfigured()) return NextResponse.json({ error: "ai_not_configured" }, { status: 503 })
  try {
    const a = await request.json()
    if (!a.name || !a.what) return NextResponse.json({ error: "missing" }, { status: 400 })
    const answers: IntakeAnswers = {
      name: String(a.name).slice(0, 60),
      what: String(a.what).slice(0, 240),
      audience: String(a.audience || "").slice(0, 120),
      benefits: (Array.isArray(a.benefits) ? a.benefits : []).map((b: unknown) => String(b).slice(0, 80)).filter(Boolean).slice(0, 3),
      color: String(a.color || a.branding?.primaryColor || "#7C3AED"),
      languages: (["es", "en", "both"].includes(String(a.languages)) ? a.languages : "en") as IntakeAnswers["languages"],
      monetization: (["free", "freemium", "subscription"].includes(String(a.monetization)) ? a.monetization : "freemium") as IntakeAnswers["monetization"],
      price: Number(a.price) || 0,
      modules: Array.isArray(a.modules) ? a.modules.map(String) : [],
      email: "",
    }
    const config = applyBranding(generateConfig(answers), a.branding)
    if (!config.identity.logoSvg) {
      const logoSvg = await generateLogoSvg(config)
      if (logoSvg) config.identity.logoSvg = logoSvg
    }
    const designs = await generateLandingVariants(config, 2)
    if (!designs.length) return NextResponse.json({ error: "no_designs" }, { status: 500 })
    return NextResponse.json({ ok: true, designs })
  } catch (e) {
    console.error("[designs]", (e as Error).message)
    return NextResponse.json({ error: "designs_failed" }, { status: 500 })
  }
}
