/**
 * Puglit Spine — middleware.ts
 * Per-route rate limiting (tuned per BLUEPRINT §5: auth generous so fumbling
 * users / shared mobile IPs aren't locked out; webhooks high; payments strict)
 * + visitor session cookie for analytics + security headers.
 *
 * The generator extends RATE_LIMITS with domain routes from domain.config.ts.
 */
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

// [maxRequests, windowMs]
const RATE_LIMITS: Record<string, [number, number]> = {
  "/api/auth/login": [10, 60_000],
  "/api/auth/register": [20, 60_000],     // generous on purpose (CGNAT + typos)
  "/api/auth/magic": [10, 60_000],
  "/api/auth/reset": [10, 60_000],
  "/api/stripe/webhook": [100, 60_000],   // provider retries
  "/api/track": [120, 60_000],            // cheap, high volume
}
const DEFAULT_LIMIT: [number, number] = [60, 60_000]

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip") || "unknown"
}

function isPublicCacheable(path: string): boolean {
  // Public, cacheable GET pages should not get a session cookie (keeps CDN cache).
  return path === "/" || path.startsWith("/blog") || path.startsWith("/_next") || path.startsWith("/static")
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  if (path.startsWith("/_next") || path.startsWith("/favicon") || path.startsWith("/static")) {
    return NextResponse.next()
  }

  if (path.startsWith("/api/")) {
    const matched = Object.entries(RATE_LIMITS).find(([r]) => path.startsWith(r))
    const [limit, windowMs] = matched ? matched[1] : DEFAULT_LIMIT
    const key = `${getClientIp(request)}:${matched ? matched[0] : "default"}`
    const { allowed, remaining } = rateLimit(key, limit, windowMs)
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(windowMs / 1000)), "X-RateLimit-Remaining": "0" } }
      )
    }
    const res = NextResponse.next()
    res.headers.set("X-RateLimit-Remaining", String(remaining))
    return res
  }

  const res = NextResponse.next()
  // Security headers
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Visitor session cookie for funnel analytics (skip Bearer + cacheable pages)
  const isBearer = request.headers.get("Authorization")?.startsWith("Bearer ")
  if (!isBearer && !isPublicCacheable(path) && !request.cookies.get("visitor_session")) {
    res.cookies.set("visitor_session", `vs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`, {
      httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 * 60 * 24 * 365,
    })
  }
  return res
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
