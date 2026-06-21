/**
 * productanalytics-module.ts — product analytics connector (events, funnels, session replay). Thin
 * client to a self-hosted PostHog. capture(event, props, distinctId) + identify(). env: POSTHOG_URL,
 * POSTHOG_KEY. OSS: PostHog · Umami · OpenReplay. (Spine has basic analytics; this is the product layer.)
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const PA = `const base = () => (process.env.POSTHOG_URL || "http://localhost:8000").replace(/\\/$/, "")
/** Capture a product event for funnels/retention. */
export async function capture(distinctId: string, event: string, properties: Record<string, unknown> = {}) {
  fetch(\`\${base()}/capture/\`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: process.env.POSTHOG_KEY || "", event, distinct_id: distinctId, properties }) }).catch(() => {})
}
/** Attach traits to a user. */
export async function identify(distinctId: string, traits: Record<string, unknown> = {}) {
  fetch(\`\${base()}/capture/\`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: process.env.POSTHOG_KEY || "", event: "$identify", distinct_id: distinctId, "$set": traits }) }).catch(() => {})
}
`
export function deterministicProductAnalytics(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/product analytics|funnel|retention|retenci|session replay|posthog|cohort|event.*track|behavior|comportamiento.*usuario|amplitude|mixpanel|umami/.test(hay)) return null
  return { files: [{ path: "lib/productanalytics.ts", content: PA }] }
}
