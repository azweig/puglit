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

// n8n — thin client to a self-hosted n8n (Docker), the workflow engine with 400+ integrations.
// The app TRIGGERS workflows (webhook) + can manage them (API). env: N8N_URL, N8N_API_KEY
const N8N = `const host = () => (process.env.N8N_URL || "http://localhost:5678").replace(/\\/$/, "")

/** Trigger an n8n workflow by webhook path (or full URL). The workflow does the heavy lifting
 *  (Slack/Stripe/Salesforce/… via n8n's 400+ nodes); returns whatever the workflow responds. */
export async function trigger(workflow: string, data?: unknown) {
  const url = workflow.startsWith("http") ? workflow : \`\${host()}/webhook/\${workflow.replace(/^\\//, "")}\`
  try { return await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data || {}) }).then((r) => r.json().catch(() => ({}))) }
  catch (e) { console.error("[n8n]", (e as Error).message); return null }
}
/** List workflows via the n8n API (needs N8N_API_KEY). */
export async function listWorkflows() {
  return fetch(\`\${host()}/api/v1/workflows\`, { headers: { "X-N8N-API-KEY": process.env.N8N_API_KEY || "" } }).then((r) => r.json()).catch(() => null)
}
/** Activate or deactivate a workflow by id. */
export async function setWorkflowActive(id: string, active: boolean) {
  await fetch(\`\${host()}/api/v1/workflows/\${id}/\${active ? "activate" : "deactivate"}\`, { method: "POST", headers: { "X-N8N-API-KEY": process.env.N8N_API_KEY || "" } }).catch(() => {})
}
`
// Receiver so n8n workflows can push events back into the app.
const N8N_WEBHOOK = `import { NextRequest, NextResponse } from "next/server"
// n8n posts here from an HTTP Request node. Wire it to your app's logic (persist / notify / agent).
export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => ({}))
  console.log("[n8n] event:", JSON.stringify(data).slice(0, 500))
  return NextResponse.json({ ok: true })
}
`

/** Detect SaaS/OAuth (→ Nango) and/or workflow-automation (→ n8n) needs, inject the matching client(s). */
export function deterministicIntegrations(config: DomainConfig, bp: Blueprint): { files: AppFile[]; deps: Record<string, string> } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wantsOAuth = /oauth|integrac|integration|salesforce|hubspot|\bcrm\b|jira|asana|notion|google\s?(cal|drive|sheet|workspace)|github|gitlab|conectar con|connect to|nango|sincroniz|\bsync\b/.test(hay)
  const wantsWorkflow = /n8n|workflow|flujo de trabajo|automatiz|automation|zapier|make\b|pipeline|orquest|orchestrat|cron|programad/.test(hay)
  const wantsAll = /chief of staff|jarvis|assistant|asistente/.test(hay)
  const oauth = wantsOAuth || wantsAll
  const wf = wantsWorkflow || wantsAll
  if (!oauth && !wf) return null
  const files: AppFile[] = []
  if (oauth) {
    files.push({ path: "lib/integrations/nango.ts", content: NANGO })
    files.push({ path: "app/api/integrations/[provider]/connect/route.ts", content: NANGO_CONNECT })
  }
  if (wf) {
    files.push({ path: "lib/integrations/n8n.ts", content: N8N })
    files.push({ path: "app/api/integrations/n8n/webhook/route.ts", content: N8N_WEBHOOK })
  }
  return { files, deps: {} }
}
