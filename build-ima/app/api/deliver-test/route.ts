/** I'm Still Alive — /api/deliver-test : deliver this user's messages NOW (test). */
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { deliverFor } from "@/lib/deadman"

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request)
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const results = await deliverFor(u.userId)
  return NextResponse.json({ results })
}
