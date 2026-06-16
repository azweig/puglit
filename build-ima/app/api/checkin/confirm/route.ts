/**
 * I'm Still Alive — /api/checkin/confirm?token=…
 * The tokenized check-in link embedded in reminder emails: lets the user confirm
 * they're alive in one click, no login. Token = userId.HMAC(userId, JWT_SECRET).
 */
import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "node:crypto"
import { checkIn } from "@/lib/deadman"

const SECRET = process.env.JWT_SECRET || "dev"
function sign(userId: number): string {
  return createHmac("sha256", SECRET).update(String(userId)).digest("base64url")
}
export function checkinToken(userId: number): string {
  return `${userId}.${sign(userId)}`
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || ""
  const [idStr, sig] = token.split(".")
  const userId = Number(idStr)
  if (!userId || !sig || sig !== sign(userId)) {
    return NextResponse.redirect(new URL("/?checkin=invalid", request.url))
  }
  await checkIn(userId)
  return NextResponse.redirect(new URL("/checkin-confirmed", request.url))
}
