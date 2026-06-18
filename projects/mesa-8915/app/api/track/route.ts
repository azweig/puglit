/**
 * Puglit Spine — /api/track
 * Page views → page_visits. Funnel/UX events → analytics_events (PERSISTED).
 * (The classic bug this avoids: discarding non-page events and flying blind.)
 */
import { NextRequest, NextResponse } from "next/server"
import { trackPageVisit, trackEvent } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page, referrer, event } = body

    const userAgent = request.headers.get("user-agent") || ""
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip") || "unknown"
    const sessionId = request.cookies.get("visitor_session")?.value || undefined
    const ua = userAgent.toLowerCase()
    const deviceType = /tablet|ipad/.test(ua) ? "tablet" : /mobile|android|iphone/.test(ua) ? "mobile" : "desktop"

    if (!event || event === "page_view") {
      await trackPageVisit({ page: page || "/", referrer: referrer || null, userAgent, ipAddress: ip, sessionId, deviceType })
    } else {
      const { page: _p, referrer: _r, event: _e, ...rest } = body
      await trackEvent({ event, page: page || undefined, sessionId, deviceType, data: rest })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Track error:", error)
    return NextResponse.json({ ok: false })
  }
}
