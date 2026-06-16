/** GET /api/examples — community-generated projects (from DB), newest first. */
import { NextResponse } from "next/server"
import { listProjects } from "@/lib/db"

export async function GET() {
  try {
    const projects = await listProjects(24)
    return NextResponse.json({
      ok: true,
      projects: projects.map((p) => ({
        slug: p.slug,
        name: p.name,
        headline: typeof p.config?.landing?.hero?.headline === "string"
          ? p.config.landing.hero.headline
          : Object.values(p.config?.landing?.hero?.headline || {})[0] || p.name,
        color: p.config?.identity?.brandColor || "#7C3AED",
        modules: Object.keys(p.config?.modules || {}).filter((k) => (p.config.modules as Record<string, boolean>)[k]),
      })),
    })
  } catch {
    return NextResponse.json({ ok: true, projects: [] })
  }
}
