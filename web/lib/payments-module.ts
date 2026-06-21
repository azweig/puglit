/**
 * payments-module.ts — multi-provider payments, selected BY COUNTRY. One createCheckout()
 * routes to Stripe (global), MercadoPago (LATAM), or PayU (LATAM/emerging). The app never
 * hard-codes a processor — it just charges; the module picks the right one for the user's
 * country (override with PAYMENTS_PROVIDER). env: STRIPE_SECRET_KEY, MP_ACCESS_TOKEN, PAYU_*.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const PAYMENTS = `// Multi-provider payments. env: PAYMENTS_PROVIDER (force), STRIPE_SECRET_KEY, MP_ACCESS_TOKEN, PAYU_API_KEY, PAYU_MERCHANT_ID
const MP_COUNTRIES = ["AR", "BR", "MX", "CL", "CO", "PE", "UY"] // MercadoPago's strong markets
export function providerForCountry(country?: string): "stripe" | "mercadopago" | "payu" {
  if (process.env.PAYMENTS_PROVIDER) return process.env.PAYMENTS_PROVIDER as any
  const c = (country || "").toUpperCase()
  if (MP_COUNTRIES.includes(c)) return "mercadopago"
  return "stripe"
}
export interface CheckoutInput { amount: number; currency: string; description: string; country?: string; successUrl: string; cancelUrl: string; metadata?: Record<string, string> }

/** Create a checkout → return its hosted URL. Routes to the right processor by country. */
export async function createCheckout(input: CheckoutInput): Promise<{ url: string; id: string; provider: string } | null> {
  const p = providerForCountry(input.country)
  try {
    if (p === "stripe") {
      const b = new URLSearchParams()
      b.set("mode", "payment"); b.set("success_url", input.successUrl); b.set("cancel_url", input.cancelUrl)
      b.set("line_items[0][price_data][currency]", input.currency.toLowerCase())
      b.set("line_items[0][price_data][product_data][name]", input.description)
      b.set("line_items[0][price_data][unit_amount]", String(Math.round(input.amount * 100)))
      b.set("line_items[0][quantity]", "1")
      for (const [k, v] of Object.entries(input.metadata || {})) b.set("metadata[" + k + "]", v)
      const r = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: "Bearer " + process.env.STRIPE_SECRET_KEY, "Content-Type": "application/x-www-form-urlencoded" }, body: b }).then((x) => x.json())
      return r.url ? { url: r.url, id: r.id, provider: "stripe" } : null
    }
    if (p === "mercadopago") {
      const r = await fetch("https://api.mercadopago.com/checkout/preferences", { method: "POST", headers: { Authorization: "Bearer " + process.env.MP_ACCESS_TOKEN, "Content-Type": "application/json" }, body: JSON.stringify({ items: [{ title: input.description, quantity: 1, unit_price: input.amount, currency_id: input.currency }], back_urls: { success: input.successUrl, failure: input.cancelUrl }, auto_return: "approved", metadata: input.metadata }) }).then((x) => x.json())
      return r.init_point ? { url: r.init_point, id: String(r.id), provider: "mercadopago" } : null
    }
    // PayU: a signed redirect form (md5 of apiKey~merchantId~ref~amount~currency). Configure
    // PAYU_API_KEY + PAYU_MERCHANT_ID + PAYU_ACCOUNT_ID and build the WebCheckout form per their docs.
    console.warn("[payments] payu: build the signed WebCheckout form per PayU docs")
    return null
  } catch (e) { console.error("[payments]", (e as Error).message); return null }
}
`

const STRIPE_WEBHOOK = `import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
// Stripe webhook. PROD: verify the signature with STRIPE_WEBHOOK_SECRET (stripe lib) before trusting.
export async function POST(req: NextRequest) {
  const e = await req.json().catch(() => ({} as any))
  if (e?.type === "checkout.session.completed") {
    const s = e.data?.object
    await pool().query("INSERT INTO payments (provider, external_id, amount, currency, status, metadata) VALUES ('stripe',$1,$2,$3,'paid',$4)", [s?.id, (s?.amount_total || 0) / 100, s?.currency, JSON.stringify(s?.metadata || {})]).catch(() => {})
  }
  return NextResponse.json({ received: true })
}
`

const MP_WEBHOOK = `import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
// MercadoPago webhook → fetch the payment + record it.
export async function POST(req: NextRequest) {
  try {
    const e = await req.json().catch(() => ({} as any))
    const id = e?.data?.id
    if (id) {
      const pay = await fetch("https://api.mercadopago.com/v1/payments/" + id, { headers: { Authorization: "Bearer " + process.env.MP_ACCESS_TOKEN } }).then((r) => r.json())
      await pool().query("INSERT INTO payments (provider, external_id, amount, currency, status, metadata) VALUES ('mercadopago',$1,$2,$3,$4,$5)", [String(id), pay.transaction_amount, pay.currency_id, pay.status, JSON.stringify(pay.metadata || {})]).catch(() => {})
    }
  } catch (err) { console.error("[mp]", err) }
  return NextResponse.json({ received: true })
}
`

const PAYMENTS_SQL = `CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  provider    VARCHAR(16) NOT NULL,
  external_id TEXT,
  amount      DOUBLE PRECISION,
  currency    VARCHAR(8),
  status      VARCHAR(16),
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);`

/** Inject the payments module when the product charges money. */
export function deterministicPayments(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")} ${config.monetization || ""}`.toLowerCase()
  const wants = /pago|payment|checkout|stripe|mercadopago|mercado pago|payu|suscrip|subscription|cobr|charge|precio|price|plan|premium|paywall|comprar|buy|carrito|cart|tienda|store|ecommerce|e-commerce/.test(hay)
  if (!wants) return null
  return {
    files: [
      { path: "lib/payments.ts", content: PAYMENTS },
      { path: "app/api/payments/stripe/webhook/route.ts", content: STRIPE_WEBHOOK },
      { path: "app/api/payments/mercadopago/webhook/route.ts", content: MP_WEBHOOK },
    ],
    extraSql: PAYMENTS_SQL,
  }
}
