/** I'm Still Alive — /api/checkin : status (GET), check-in or save settings (POST). */
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { getStatus, checkIn, saveSettings } from "@/lib/deadman"

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await getStatus(u.userId))
}

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  if (body.action === "checkin") {
    await checkIn(u.userId)
  } else if (body.settings && typeof body.settings === "object") {
    await saveSettings(u.userId, body.settings)
  }
  return NextResponse.json(await getStatus(u.userId))
}
