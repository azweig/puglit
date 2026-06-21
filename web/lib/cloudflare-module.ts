/**
 * cloudflare-module.ts — the edge integration. True volumetric DDoS protection lives at the EDGE
 * (point your DNS through Cloudflare + WAF + "Under Attack" mode — infra, not app code). This
 * module is the APP-SIDE counterpart:
 *   - verifyTurnstile(): Cloudflare Turnstile (free, privacy-first captcha) → stops bot floods on
 *     signup/login/forms before they hit your DB. The practical app-level DDoS/abuse defense.
 *   - realIP(): the true client IP behind Cloudflare (CF-Connecting-IP) → feed it to rate-limit.
 *   - purgeCache(): invalidate the Cloudflare cache after a deploy/update.
 * Pair with the spine's rate-limit + the cache module. env: TURNSTILE_SECRET, CLOUDFLARE_API_TOKEN,
 * CLOUDFLARE_ZONE_ID.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const CLOUDFLARE = `/** Verify a Cloudflare Turnstile token (free captcha — protects forms/signup from bots & floods). */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  try {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET || "", response: token })
    if (ip) body.set("remoteip", ip)
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body }).then((x) => x.json())
    return !!r.success
  } catch { return false }
}
/** Real client IP behind Cloudflare (use this for rate-limiting / geo / logging). */
export function realIP(req: Request): string {
  const h = req.headers
  return (h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim()
}
/** Purge the Cloudflare cache — all, or specific URLs. Run after a deploy / content update. */
export async function purgeCache(urls?: string[]): Promise<boolean> {
  try {
    const r = await fetch(\`https://api.cloudflare.com/client/v4/zones/\${process.env.CLOUDFLARE_ZONE_ID}/purge_cache\`, { method: "POST", headers: { Authorization: "Bearer " + process.env.CLOUDFLARE_API_TOKEN, "Content-Type": "application/json" }, body: JSON.stringify(urls ? { files: urls } : { purge_everything: true }) }).then((x) => x.json())
    return !!r.success
  } catch { return false }
}
`

// Route to verify a Turnstile token from the frontend before allowing a sensitive action.
const TURNSTILE_ROUTE = `import { NextRequest, NextResponse } from "next/server"
import { verifyTurnstile, realIP } from "@/lib/cloudflare"
export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}))
  const ok = await verifyTurnstile(String(token || ""), realIP(req))
  return NextResponse.json({ ok }, { status: ok ? 200 : 403 })
}
`

export function deterministicCloudflare(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /cloudflare|ddos|captcha|turnstile|bot|abuse|abuso|waf|edge|cdn|purge|protec|security|seguridad|signup|registro|public api|rate/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/cloudflare.ts", content: CLOUDFLARE }, { path: "app/api/turnstile/verify/route.ts", content: TURNSTILE_ROUTE }] }
}
