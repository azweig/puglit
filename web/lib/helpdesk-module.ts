/**
 * helpdesk-module.ts — support tickets connector. Thin client to a self-hosted Chatwoot (omnichannel
 * helpdesk). Create conversations/tickets, post replies, list. env: CHATWOOT_URL, CHATWOOT_TOKEN,
 * CHATWOOT_ACCOUNT_ID, CHATWOOT_INBOX_ID. OSS: Chatwoot · Zammad · FreeScout.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const HD = `const base = () => (process.env.CHATWOOT_URL || "http://localhost:3000").replace(/\\/$/, "")
const acc = () => process.env.CHATWOOT_ACCOUNT_ID || "1"
const h = () => ({ api_access_token: process.env.CHATWOOT_TOKEN || "", "Content-Type": "application/json" })
/** Open a support ticket (conversation) for a contact. */
export async function createTicket(contactEmail: string, subject: string, message: string) {
  return fetch(\`\${base()}/api/v1/accounts/\${acc()}/conversations\`, { method: "POST", headers: h(), body: JSON.stringify({ inbox_id: process.env.CHATWOOT_INBOX_ID || 1, source_id: contactEmail, additional_attributes: { subject }, message: { content: message } }) }).then((r) => r.json()).catch((e) => { console.error("[helpdesk]", e); return null })
}
export async function reply(conversationId: number, message: string, isPrivate = false) {
  return fetch(\`\${base()}/api/v1/accounts/\${acc()}/conversations/\${conversationId}/messages\`, { method: "POST", headers: h(), body: JSON.stringify({ content: message, private: isPrivate }) }).then((r) => r.json()).catch(() => null)
}
export async function listTickets(status = "open") {
  return fetch(\`\${base()}/api/v1/accounts/\${acc()}/conversations?status=\${status}\`, { headers: h() }).then((r) => r.json()).catch(() => null)
}
`
export function deterministicHelpdesk(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/helpdesk|help desk|ticket|soporte|support|atenci[oó]n|sac|postventa|sla|agente|mesa de ayuda|service desk|chatwoot/.test(hay)) return null
  return { files: [{ path: "lib/helpdesk.ts", content: HD }] }
}
