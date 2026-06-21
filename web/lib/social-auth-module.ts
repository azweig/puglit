/**
 * social-auth-module.ts — "Sign in with X" + API access for Facebook, Instagram, LinkedIn,
 * TikTok and Google. One generic OAuth flow drives all of them: a /api/social/[provider] start
 * route and a /callback that exchanges the code, fetches the profile, and STORES the access
 * token in social_accounts — so the app can both log the user in AND call the provider's API
 * (post to IG, read LinkedIn, etc.). BYO app credentials per provider (never stored in repo).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const PROVIDERS = `// Per-provider OAuth config. Register an app with each + set the client id/secret env vars.
export interface Provider { authUrl: string; tokenUrl: string; scope: string; userInfo?: string; clientIdEnv: string; clientSecretEnv: string; idParam?: string }
export const providers: Record<string, Provider> = {
  google: { authUrl: "https://accounts.google.com/o/oauth2/v2/auth", tokenUrl: "https://oauth2.googleapis.com/token", scope: "openid email profile", userInfo: "https://www.googleapis.com/oauth2/v2/userinfo", clientIdEnv: "GOOGLE_CLIENT_ID", clientSecretEnv: "GOOGLE_CLIENT_SECRET" },
  facebook: { authUrl: "https://www.facebook.com/v19.0/dialog/oauth", tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token", scope: "email public_profile", userInfo: "https://graph.facebook.com/me?fields=id,name,email", clientIdEnv: "FACEBOOK_CLIENT_ID", clientSecretEnv: "FACEBOOK_CLIENT_SECRET" },
  instagram: { authUrl: "https://api.instagram.com/oauth/authorize", tokenUrl: "https://api.instagram.com/oauth/access_token", scope: "user_profile,user_media", userInfo: "https://graph.instagram.com/me?fields=id,username", clientIdEnv: "INSTAGRAM_CLIENT_ID", clientSecretEnv: "INSTAGRAM_CLIENT_SECRET" },
  linkedin: { authUrl: "https://www.linkedin.com/oauth/v2/authorization", tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken", scope: "openid profile email", userInfo: "https://api.linkedin.com/v2/userinfo", clientIdEnv: "LINKEDIN_CLIENT_ID", clientSecretEnv: "LINKEDIN_CLIENT_SECRET" },
  tiktok: { authUrl: "https://www.tiktok.com/v2/auth/authorize", tokenUrl: "https://open.tiktokapis.com/v2/oauth/token", scope: "user.info.basic", userInfo: "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name", clientIdEnv: "TIKTOK_CLIENT_KEY", clientSecretEnv: "TIKTOK_CLIENT_SECRET", idParam: "client_key" },
}
export const redirectUri = (provider: string) => (process.env.APP_URL || "http://localhost:3000").replace(/\\/$/, "") + "/api/social/" + provider + "/callback"
`

const START = `import { NextRequest, NextResponse } from "next/server"
import { providers, redirectUri } from "@/lib/social/providers"
export async function GET(_req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const p = providers[provider]
  if (!p) return NextResponse.json({ error: "unknown provider" }, { status: 404 })
  const u = new URL(p.authUrl)
  u.searchParams.set(p.idParam || "client_id", process.env[p.clientIdEnv] || "")
  u.searchParams.set("redirect_uri", redirectUri(provider))
  u.searchParams.set("scope", p.scope)
  u.searchParams.set("response_type", "code")
  u.searchParams.set("state", provider)
  return NextResponse.redirect(u.toString())
}
`

const CALLBACK = `import { NextRequest, NextResponse } from "next/server"
import { providers, redirectUri } from "@/lib/social/providers"
import { pool } from "@/lib/db"
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const p = providers[provider]
  const code = req.nextUrl.searchParams.get("code")
  const home = (process.env.APP_URL || "").replace(/\\/$/, "")
  if (!p || !code) return NextResponse.redirect(home + "/?auth=error")
  try {
    const body = new URLSearchParams({ [p.idParam || "client_id"]: process.env[p.clientIdEnv] || "", client_secret: process.env[p.clientSecretEnv] || "", code, grant_type: "authorization_code", redirect_uri: redirectUri(provider) })
    const tok = await fetch(p.tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body }).then((r) => r.json())
    const accessToken = tok.access_token || tok.data?.access_token
    let profile: any = {}
    if (p.userInfo && accessToken) profile = await fetch(p.userInfo, { headers: { Authorization: "Bearer " + accessToken } }).then((r) => r.json()).catch(() => ({}))
    const pid = String(profile.id || profile.sub || profile.open_id || profile.data?.user?.open_id || "")
    await pool().query("INSERT INTO social_accounts (provider, provider_user_id, name, email, access_token, refresh_token) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (provider, provider_user_id) DO UPDATE SET access_token=EXCLUDED.access_token, refresh_token=EXCLUDED.refresh_token, name=EXCLUDED.name", [provider, pid, profile.name || profile.username || profile.display_name || profile.data?.user?.display_name || "", profile.email || "", accessToken || "", tok.refresh_token || ""])
    const res = NextResponse.redirect(home + "/?auth=ok")
    res.cookies.set("sa_session", provider + ":" + pid, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 })
    return res
  } catch (e) { console.error("[social]", (e as Error).message); return NextResponse.redirect(home + "/?auth=error") }
}
`

const SOCIAL_SQL = `CREATE TABLE IF NOT EXISTS social_accounts (
  id BIGSERIAL PRIMARY KEY,
  provider         VARCHAR(16) NOT NULL,
  provider_user_id TEXT NOT NULL,
  name  TEXT,
  email TEXT,
  access_token  TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider, provider_user_id)
);`

/** Inject social login when the product offers it / needs social-platform API access. */
export function deterministicSocialAuth(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /social login|login social|iniciar sesi[oó]n con|sign in with|oauth|facebook|instagram|linkedin|tiktok|google login|redes sociales|social media|publicar en|post to|conectar (con )?(tu )?(cuenta|red)/.test(hay)
  if (!wants) return null
  return {
    files: [
      { path: "lib/social/providers.ts", content: PROVIDERS },
      { path: "app/api/social/[provider]/route.ts", content: START },
      { path: "app/api/social/[provider]/callback/route.ts", content: CALLBACK },
    ],
    extraSql: SOCIAL_SQL,
  }
}
