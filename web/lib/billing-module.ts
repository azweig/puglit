/**
 * billing-module.ts — RECURRING subscriptions + usage metering (the payments module is one-time).
 * createSubscription() routes by country: Stripe Subscriptions (global) or MercadoPago preapproval
 * (LATAM). Tracks plan + status in subscriptions, and meter() records usage for usage-based pricing.
 * env: STRIPE_SECRET_KEY, MP_ACCESS_TOKEN, BILLING_PROVIDER.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const BILLING = `import { pool } from "@/lib/db"
const MP_COUNTRIES = ["AR", "BR", "MX", "CL", "CO", "PE", "UY"]
function provider(country?: string): "stripe" | "mercadopago" {
  if (process.env.BILLING_PROVIDER) return process.env.BILLING_PROVIDER as any
  return MP_COUNTRIES.includes((country || "").toUpperCase()) ? "mercadopago" : "stripe"
}
export interface SubInput { userId: string; priceId?: string; amount?: number; currency?: string; email: string; country?: string; successUrl: string; cancelUrl: string }

/** Start a recurring subscription → return the checkout URL. */
export async function createSubscription(s: SubInput): Promise<{ url: string; provider: string } | null> {
  const p = provider(s.country)
  try {
    if (p === "stripe") {
      const b = new URLSearchParams({ mode: "subscription", success_url: s.successUrl, cancel_url: s.cancelUrl, customer_email: s.email, "line_items[0][price]": s.priceId || "", "line_items[0][quantity]": "1", "metadata[userId]": s.userId })
      const r = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: "Bearer " + process.env.STRIPE_SECRET_KEY, "Content-Type": "application/x-www-form-urlencoded" }, body: b }).then((x) => x.json())
      return r.url ? { url: r.url, provider: "stripe" } : null
    }
    // MercadoPago preapproval (recurring)
    const r = await fetch("https://api.mercadopago.com/preapproval", { method: "POST", headers: { Authorization: "Bearer " + process.env.MP_ACCESS_TOKEN, "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Subscription", payer_email: s.email, back_url: s.successUrl, auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: s.amount, currency_id: s.currency || "USD" }, external_reference: s.userId }) }).then((x) => x.json())
    return r.init_point ? { url: r.init_point, provider: "mercadopago" } : null
  } catch (e) { console.error("[billing]", (e as Error).message); return null }
}

/** Record a unit of usage for usage-based billing / quotas. */
export async function meter(userId: string, metric: string, qty = 1) {
  await pool().query("INSERT INTO usage_events (user_id, metric, qty) VALUES ($1,$2,$3)", [userId, metric, qty]).catch(() => {})
}
/** Is this user on an active subscription? */
export async function isSubscribed(userId: string): Promise<boolean> {
  const { rows } = await pool().query("SELECT 1 FROM subscriptions WHERE user_id=$1 AND status='active' LIMIT 1", [userId])
  return rows.length > 0
}
`

const BILLING_SQL = `CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider VARCHAR(16),
  external_id TEXT,
  plan TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',  -- pending | active | canceled | past_due
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS usage_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  metric VARCHAR(48) NOT NULL,
  qty DOUBLE PRECISION NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`

export function deterministicBilling(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")} ${config.monetization || ""}`.toLowerCase()
  const wants = /suscrip|subscription|recurr|recurring|plan|membership|membres[ií]a|saas|mensual|monthly|premium|tier|metering|usage|billing|abono|plan pago/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/billing.ts", content: BILLING }], extraSql: BILLING_SQL }
}
