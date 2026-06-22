/**
 * webhooksout-module.ts — let YOUR app emit webhooks to subscribers (the inverse of receiving).
 * Subscribers register a URL; emit(event, payload) delivers a SIGNED POST (HMAC) to each, with
 * retries via best-effort async. Postgres-backed subscriptions. The hallmark of a platform/API.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const WH = `import { pool } from "@/lib/db"
import { createHmac } from "node:crypto"
/** Register a subscriber endpoint for an event (returns a per-subscriber secret). */
export async function subscribe(url: string, event: string): Promise<string> {
  const secret = createHmac("sha256", process.env.ENCRYPTION_KEY || "puglit").update(url + event + Date.now()).digest("hex").slice(0, 32)
  await pool.query("INSERT INTO webhook_subs (url, event, secret) VALUES ($1,$2,$3)", [url, event, secret])
  return secret
}
/** Emit an event to all subscribers — each POST is signed (X-Signature = HMAC of the body). */
export async function emit(event: string, payload: unknown) {
  const { rows } = await pool.query("SELECT url, secret FROM webhook_subs WHERE event=$1 AND active=true", [event])
  const body = JSON.stringify({ event, data: payload, ts: Date.now() })
  await Promise.all(rows.map(async (s: any) => {
    const sig = createHmac("sha256", s.secret).update(body).digest("hex")
    for (let i = 0; i < 3; i++) {
      try { const r = await fetch(s.url, { method: "POST", headers: { "Content-Type": "application/json", "X-Signature": sig, "X-Event": event }, body }); if (r.ok) return } catch {}
      await new Promise((res) => setTimeout(res, 500 * (i + 1)))
    }
  }))
}
`
const SQL = `CREATE TABLE IF NOT EXISTS webhook_subs (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL, event VARCHAR(64) NOT NULL, secret TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()
);`

export function deterministicWebhooksOut(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /webhook|api platform|developer|integrac|emit|subscribe|event|notify.*(external|partner)|saas.*api|zapier/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/webhooksout.ts", content: WH }], extraSql: SQL }
}
