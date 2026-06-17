import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

// GET: top distances (leaderboard). POST: submit a run {world, level, player, distance}.
export async function GET() {
  try {
    const { rows } = await pool.query(
      "SELECT world, level, player, distance FROM scores ORDER BY distance DESC LIMIT 25"
    )
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  const b = await request.json().catch(() => ({}))
  const world = Number(b.world), level = Number(b.level), distance = Number(b.distance)
  const player = String(b.player || "Pip").slice(0, 24).replace(/[^\w\s.\-]/g, "") || "Pip"
  if (!Number.isFinite(world) || !Number.isFinite(level) || !Number.isFinite(distance)) {
    return NextResponse.json({ error: "world, level, distance required" }, { status: 400 })
  }
  await pool.query(
    "INSERT INTO scores (world, level, player, distance) VALUES ($1, $2, $3, $4)",
    [world, level, player, Math.max(0, Math.floor(distance))]
  )
  return NextResponse.json({ ok: true })
}
