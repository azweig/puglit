/**
 * Puglit Spine — auth-guards.ts
 * Centralizes the auth+plan boilerplate repeated across API routes. Returns the
 * correct NextResponse (401 unauth / 402 payment-required) so handlers stay thin:
 *
 *   const auth = await requireAuth(request)
 *   if (!auth.ok) return auth.response
 *   const { user, plan } = auth
 *
 * Paid plans and ranking are DERIVED from domain.config (priceUsd>0 = paid;
 * rank = order in monetization.plans) — no hardcoded plan names.
 */
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser, type JWTPayload } from "@/lib/auth"
import { getEffectivePlan } from "@/lib/users"
import config from "@/domain.config"

const PLAN_ORDER = config.monetization.plans.map((p) => p.id)
const PAID_PLANS = new Set(config.monetization.plans.filter((p) => p.priceUsd > 0).map((p) => p.id))
const RANK: Record<string, number> = Object.fromEntries(PLAN_ORDER.map((id, i) => [id, i]))

export type AuthResult =
  | { ok: true; user: JWTPayload; plan: string }
  | { ok: false; response: NextResponse }

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const user = await getAuthUser(request)
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  const plan = await getEffectivePlan(user.userId)
  return { ok: true, user, plan }
}

/** Requires auth AND any paid plan. 402 (Payment Required) lets the client route to /pricing. */
export async function requirePaidPlan(request: NextRequest): Promise<AuthResult> {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth
  if (!PAID_PLANS.has(auth.plan)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "This feature requires a paid plan", upgrade: "/pricing" },
        { status: 402 }
      ),
    }
  }
  return auth
}

/** Requires a specific plan id or higher (by order in monetization.plans). */
export async function requirePlanAtLeast(request: NextRequest, minPlanId: string): Promise<AuthResult> {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth
  const current = RANK[auth.plan] ?? 0
  const needed = RANK[minPlanId] ?? 0
  if (current < needed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `This feature requires the ${minPlanId} plan or higher`, upgrade: "/pricing" },
        { status: 402 }
      ),
    }
  }
  return auth
}

export function isPaidPlan(plan: string): boolean {
  return PAID_PLANS.has(plan)
}
