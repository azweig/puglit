import { NextResponse } from "next/server"
import { isServiceRequest } from "@/lib/auth"
import { exportBrain, mergeBrain, consolidateActiveSkills } from "@/lib/brain-sync"

export const maxDuration = 800

/**
 * Brain durability endpoint (hybrid persistence).
 *   GET  /api/admin/brain            → export a full brain snapshot (JSON) for backup.
 *   POST /api/admin/brain  {snapshot} → MERGE a snapshot into the live brain (union + objective
 *                                       arbitration; never clobbers). ?consolidate=1 → only reconcile.
 * Auth: x-puglit-service: $PUGLIT_SERVICE_TOKEN.
 */
export async function GET(req: Request) {
  if (!isServiceRequest(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  return NextResponse.json({ ok: true, snapshot: await exportBrain() })
}

export async function POST(req: Request) {
  if (!isServiceRequest(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  if (new URL(req.url).searchParams.get("consolidate") === "1") { await consolidateActiveSkills(); return NextResponse.json({ ok: true, consolidated: true }) }
  try {
    const body = await req.json()
    const snap = body?.snapshot || body
    const report = await mergeBrain(snap)
    return NextResponse.json({ ok: true, merged: report })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
