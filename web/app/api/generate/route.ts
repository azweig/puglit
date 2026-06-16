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
      languages: (["es", "en", "both"].includes(String(a.languages)) ? a.languages : "en") as IntakeAnswers["languages"],
      monetization: (["free", "freemium", "subscription"].includes(String(a.monetization)) ? a.monetization : "freemium") as IntakeAnswers["monetization"],
      price: Number(a.price) || 0,
      modules: Array.isArray(a.modules) ? a.modules.map(String) : [],
      email: String(a.email || "").slice(0, 255),
    }

    const config = generateConfig(answers)

    // unique slug
    let slug = slugify(answers.name)
    if (await slugExists(slug)) slug = `${slug}-${randomBytes(2).toString("hex")}`

    let saved = false
    if (isConfigured()) {
      try {
        await saveProject({ slug, email: answers.email || null, name: answers.name, answers: answers as unknown as Record<string, unknown>, config })
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
