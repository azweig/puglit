/**
 * invoicing-module.ts — invoices/quotes/tax connector (fiscal-friendly). Thin client to a
 * self-hosted Invoice Ninja. Create invoices, email them, list. env: INVOICENINJA_URL,
 * INVOICENINJA_TOKEN. OSS: Invoice Ninja · Crater. (Complements payments/billing with formal docs.)
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const INV = `const base = () => (process.env.INVOICENINJA_URL || "http://localhost:8090").replace(/\\/$/, "")
const h = () => ({ "X-Api-Token": process.env.INVOICENINJA_TOKEN || "", "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" })
/** Create an invoice for a client with line items [{product_key, notes, cost, quantity}]. */
export async function createInvoice(clientId: string, items: { notes: string; cost: number; quantity: number }[], taxRate?: number) {
  return fetch(\`\${base()}/api/v1/invoices\`, { method: "POST", headers: h(), body: JSON.stringify({ client_id: clientId, line_items: items, tax_rate1: taxRate, tax_name1: taxRate ? "IVA" : undefined }) }).then((r) => r.json()).catch((e) => { console.error("[invoicing]", e); return null })
}
export async function emailInvoice(invoiceId: string) {
  return fetch(\`\${base()}/api/v1/invoices/\${invoiceId}/email\`, { method: "POST", headers: h() }).then((r) => r.json()).catch(() => null)
}
export async function listInvoices(params: Record<string, string> = {}) {
  return fetch(\`\${base()}/api/v1/invoices?\${new URLSearchParams(params)}\`, { headers: h() }).then((r) => r.json()).catch(() => null)
}
`
export function deterministicInvoicing(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")} ${config.monetization || ""}`.toLowerCase()
  if (!/factura|invoice|presupuesto|quote|boleta|comprobante|fiscal|impuesto|tax|iva|billing.*formal|invoice ninja|recibo/.test(hay)) return null
  return { files: [{ path: "lib/invoicing.ts", content: INV }] }
}
