/** I'm Still Alive — /api/cron/deliver : scheduled job; delivers for silent users. */
import { NextResponse } from "next/server"
import { runDeliveries } from "@/lib/deadman"

export async function GET() {
  const delivered = await runDeliveries()
  return NextResponse.json({ delivered })
}
