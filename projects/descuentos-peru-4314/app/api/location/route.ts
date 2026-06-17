import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { pool } from "@/lib/db"

// Save the user's coordinates (deterministic). The "near me" route reads these.
export async function POST(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const b = await request.json().catch(() => ({}))
  const lat = Number(b.latitude ?? b.lat), lng = Number(b.longitude ?? b.lng ?? b.long)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: "latitude/longitude required" }, { status: 400 })
  await pool.query(
    "INSERT INTO user_locations (user_id, latitude, longitude, address) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id) DO UPDATE SET latitude=$2, longitude=$3, address=$4, updated_at=NOW()",
    [u.userId, lat, lng, b.address ?? null]
  )
  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { rows } = await pool.query("SELECT latitude, longitude, address FROM user_locations WHERE user_id=$1", [u.userId])
  return NextResponse.json(rows[0] || null)
}
