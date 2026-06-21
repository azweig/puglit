/**
 * shipping-module.ts — logistics: rates, labels & tracking across carriers via Shippo (aggregates
 * FedEx/UPS/USPS/DHL) + direct FedEx tracking. track(carrier, number) → status/eta/events; rates()
 * for checkout; createLabel(). For e-commerce, marketplaces, fulfillment ops. env: SHIPPO_TOKEN,
 * FEDEX_API_KEY, FEDEX_SECRET.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const SHIP = `const shippo = () => ({ Authorization: "ShippoToken " + (process.env.SHIPPO_TOKEN || ""), "Content-Type": "application/json" })

/** Track a shipment. carrier e.g. "fedex","ups","usps","dhl_express". Returns normalized status. */
export async function track(carrier: string, trackingNumber: string) {
  try {
    const r = await fetch(\`https://api.goshippo.com/tracks/\${carrier}/\${trackingNumber}\`, { headers: shippo() }).then((x) => x.json())
    const s = r.tracking_status
    return { status: s?.status || "UNKNOWN", detail: s?.status_details, location: s?.location, eta: r.eta, events: (r.tracking_history || []).map((h: any) => ({ status: h.status, at: h.status_date, location: h.location })) }
  } catch (e) { console.error("[shipping] track", (e as Error).message); return null }
}
/** Get shipping rate quotes for a parcel between two addresses (Shippo). */
export async function rates(from: any, to: any, parcel: { length: number; width: number; height: number; weight: number; unit?: string; massUnit?: string }) {
  try {
    const r = await fetch("https://api.goshippo.com/shipments", { method: "POST", headers: shippo(), body: JSON.stringify({ address_from: from, address_to: to, parcels: [{ length: parcel.length, width: parcel.width, height: parcel.height, distance_unit: parcel.unit || "cm", weight: parcel.weight, mass_unit: parcel.massUnit || "kg" }], async: false }) }).then((x) => x.json())
    return (r.rates || []).map((rt: any) => ({ carrier: rt.provider, service: rt.servicelevel?.name, amount: rt.amount, currency: rt.currency, days: rt.estimated_days, rateId: rt.object_id }))
  } catch (e) { console.error("[shipping] rates", (e as Error).message); return [] }
}
/** Buy a label for a chosen rate → returns the label URL + tracking number. */
export async function createLabel(rateId: string) {
  try {
    const r = await fetch("https://api.goshippo.com/transactions", { method: "POST", headers: shippo(), body: JSON.stringify({ rate: rateId, label_file_type: "PDF", async: false }) }).then((x) => x.json())
    return { labelUrl: r.label_url, tracking: r.tracking_number, carrier: r.tracking_url_provider }
  } catch (e) { console.error("[shipping] label", (e as Error).message); return null }
}
`

export function deterministicShipping(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /ship|env[ií]o|envio|logistic|log[ií]stica|track.*(order|pedido|package|paquete)|fedex|ups|usps|dhl|shippo|carrier|courier|delivery|reparto|fulfill|paquete|order tracking|seguimiento.*(pedido|env)/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/shipping.ts", content: SHIP }] }
}
