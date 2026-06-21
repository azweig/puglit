/**
 * sso-module.ts — enterprise SSO / OIDC connector (the thing that unblocks big B2B clients). Generic
 * OpenID Connect login against Keycloak/Authentik/Zitadel: authorize → callback → token → userinfo.
 * env: OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, APP_URL. OSS: Keycloak · Authentik · Zitadel.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const SSO = `const issuer = () => (process.env.OIDC_ISSUER || "").replace(/\\/$/, "")
const redirect = () => (process.env.APP_URL || "http://localhost:3000").replace(/\\/$/, "") + "/api/sso/callback"
export function authorizeUrl(state = "sso"): string {
  const u = new URL(issuer() + "/protocol/openid-connect/auth")
  u.searchParams.set("client_id", process.env.OIDC_CLIENT_ID || ""); u.searchParams.set("redirect_uri", redirect())
  u.searchParams.set("response_type", "code"); u.searchParams.set("scope", "openid email profile"); u.searchParams.set("state", state)
  return u.toString()
}
export async function exchangeCode(code: string) {
  const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirect(), client_id: process.env.OIDC_CLIENT_ID || "", client_secret: process.env.OIDC_CLIENT_SECRET || "" })
  const tok = await fetch(issuer() + "/protocol/openid-connect/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }).then((r) => r.json()).catch(() => null)
  if (!tok?.access_token) return null
  const profile = await fetch(issuer() + "/protocol/openid-connect/userinfo", { headers: { Authorization: "Bearer " + tok.access_token } }).then((r) => r.json()).catch(() => ({}))
  return { token: tok.access_token, profile }
}
`
const START = `import { NextResponse } from "next/server"
import { authorizeUrl } from "@/lib/sso"
export async function GET() { return NextResponse.redirect(authorizeUrl()) }
`
const CB = `import { NextRequest, NextResponse } from "next/server"
import { exchangeCode } from "@/lib/sso"
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const home = (process.env.APP_URL || "").replace(/\\/$/, "")
  if (!code) return NextResponse.redirect(home + "/?sso=error")
  const r = await exchangeCode(code)
  if (!r) return NextResponse.redirect(home + "/?sso=error")
  const res = NextResponse.redirect(home + "/?sso=ok")
  res.cookies.set("sso_user", r.profile?.email || r.profile?.sub || "", { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 })
  return res
}
`
export function deterministicSso(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/\bsso\b|single sign|saml|oidc|openid|keycloak|enterprise.*login|identity provider|scim|active directory|ldap|authentik|zitadel|b2b.*auth/.test(hay)) return null
  return { files: [{ path: "lib/sso.ts", content: SSO }, { path: "app/api/sso/route.ts", content: START }, { path: "app/api/sso/callback/route.ts", content: CB }] }
}
