/**
 * integrations.ts — reusable SaaS/OAuth integration component (Nango), injected like the
 * channel connectors. Nango (self-hosted Docker) manages the OAuth dance + token refresh for
 * 100s of providers (Salesforce, HubSpot, Jira, Notion, Google, GitHub, Slack, LinkedIn…), so
 * the generated app NEVER touches tokens — it just asks Nango to proxy a call. This is the
 * "connect to any SaaS" plumbing the swarm reuses instead of reinventing OAuth every time.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

// Thin client to a self-hosted Nango. env: NANGO_HOST, NANGO_SECRET_KEY
const NANGO = `const host = () => (process.env.NANGO_HOST || "http://localhost:3003").replace(/\\/$/, "")
const auth = () => ({ Authorization: "Bearer " + (process.env.NANGO_SECRET_KEY || "") })

/** A stored connection's FRESH access token (Nango auto-refreshes). providerConfigKey = the
 *  integration id you configured in Nango (e.g. "salesforce"); connectionId = which user. */
export async function getConnection(providerConfigKey: string, connectionId: string) {
  const r = await fetch(\`\${host()}/connection/\${connectionId}?provider_config_key=\${providerConfigKey}&refresh_token=true\`, { headers: auth() })
  return r.json()
}

/** Proxy an API call to the provider — Nango injects + refreshes the token transparently. */
export async function proxy(providerConfigKey: string, connectionId: string, opts: { method?: string; endpoint: string; data?: unknown; params?: Record<string, string> }) {
  const qs = opts.params ? "?" + new URLSearchParams(opts.params).toString() : ""
  const r = await fetch(\`\${host()}/proxy/\${opts.endpoint.replace(/^\\//, "")}\${qs}\`, {
    method: opts.method || "GET",
    headers: { ...auth(), "Provider-Config-Key": providerConfigKey, "Connection-Id": connectionId, "Content-Type": "application/json" },
    body: opts.data ? JSON.stringify(opts.data) : undefined,
  })
  return r.json()
}
`

// Kick off Nango's OAuth flow for a provider (the proper way is @nangohq/frontend in the UI;
// this redirect is the no-JS fallback). app/api/integrations/[provider]/connect
const NANGO_CONNECT = `import { NextRequest, NextResponse } from "next/server"
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const host = (process.env.NANGO_HOST || "http://localhost:3003").replace(/\\/$/, "")
  const connectionId = req.nextUrl.searchParams.get("connectionId") || "default"
  return NextResponse.redirect(\`\${host}/oauth/connect/\${provider}?connection_id=\${connectionId}&public_key=\${process.env.NANGO_PUBLIC_KEY || ""}\`)
}
`

/** Detect a product that integrates with external SaaS over OAuth → inject the Nango client. */
export function deterministicIntegrations(config: DomainConfig, bp: Blueprint): { files: AppFile[]; deps: Record<string, string> } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /oauth|integrac|integration|salesforce|hubspot|\bcrm\b|jira|asana|notion|google\s?(cal|drive|sheet|workspace)|github|gitlab|conectar con|connect to|nango|sincroniz|sync|chief of staff|jarvis|assistant|asistente/.test(hay)
  if (!wants) return null
  return {
    files: [
      { path: "lib/integrations/nango.ts", content: NANGO },
      { path: "app/api/integrations/[provider]/connect/route.ts", content: NANGO_CONNECT },
    ],
    deps: {},
  }
}
