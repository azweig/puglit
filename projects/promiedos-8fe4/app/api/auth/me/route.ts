/**
 * Puglit Spine — GET /api/auth/me
 * Returns the current user fresh from the DB (so plan/verification reflect
 * server state, not a possibly-stale JWT). 401 if no valid session.
 */
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { getUserById, getEffectivePlan } from "@/lib/users"

export async function GET(request: NextRequest) {
  const session = await getAuthUser(request)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(session.userId)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const plan = await getEffectivePlan(user.id)
  return NextResponse.json({
    user: {
      id: user.id, email: user.email, name: user.name, plan,
      subscriptionEnd: user.subscription_end, emailVerified: !!user.email_verified,
      profile: user.profile || null,
    },
  })
}
