/**
 * /api/genetic/modules — the living module directory.
 *   GET            → the full catalog (builtins + swarm-created), for agents/UI to browse.
 *   POST {module}  → register a NEW module or an IMPROVEMENT (upsert + version bump).
 * This is how the swarm reads, extends and heals the component library.
 */
import { NextRequest, NextResponse } from "next/server"
import { allModules, registerModule, type Module } from "@/lib/module-registry"
import { isServiceRequest, getSession } from "@/lib/auth"

export async function GET() {
  const mods = await allModules().catch(() => [])
  return NextResponse.json({ ok: true, count: mods.length, modules: mods })
}

export async function POST(request: NextRequest) {
  // only the swarm (service token) or a logged-in user can extend the registry
  if (!isServiceRequest(request) && !(await getSession())) return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 })
  try {
    const m = (await request.json()) as Module & { createdBy?: string }
    if (!m?.name || !m?.category || !m?.description) return NextResponse.json({ ok: false, error: "name, category, description required" }, { status: 400 })
    await registerModule(m)
    return NextResponse.json({ ok: true, registered: m.name })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
