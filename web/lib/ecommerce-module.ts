/**
 * ecommerce-module.ts — headless commerce connector. Thin client to a self-hosted Medusa (store
 * API): products, carts, line items, complete order. env: MEDUSA_URL, MEDUSA_KEY. OSS: Medusa ·
 * Saleor · Vendure. (Pairs with the payments + shipping modules.)
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const EC = `const base = () => (process.env.MEDUSA_URL || "http://localhost:9000").replace(/\\/$/, "")
const h = () => ({ "Content-Type": "application/json", ...(process.env.MEDUSA_KEY ? { "x-publishable-api-key": process.env.MEDUSA_KEY } : {}) })
export async function listProducts(params: Record<string, string> = {}) {
  return fetch(\`\${base()}/store/products?\${new URLSearchParams(params)}\`, { headers: h() }).then((r) => r.json()).catch((e) => { console.error("[ecommerce]", e); return null })
}
export async function createCart(regionId?: string) {
  return fetch(\`\${base()}/store/carts\`, { method: "POST", headers: h(), body: JSON.stringify(regionId ? { region_id: regionId } : {}) }).then((r) => r.json()).catch(() => null)
}
export async function addLineItem(cartId: string, variantId: string, quantity = 1) {
  return fetch(\`\${base()}/store/carts/\${cartId}/line-items\`, { method: "POST", headers: h(), body: JSON.stringify({ variant_id: variantId, quantity }) }).then((r) => r.json()).catch(() => null)
}
export async function completeCart(cartId: string) {
  return fetch(\`\${base()}/store/carts/\${cartId}/complete\`, { method: "POST", headers: h() }).then((r) => r.json()).catch(() => null)
}
`
export function deterministicEcommerce(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")} ${config.monetization || ""}`.toLowerCase()
  if (!/ecommerce|e-commerce|tienda|shop|store|carrito|cart|catalog|checkout|producto.*vent|marketplace|retail|comprar online|medusa|saleor/.test(hay)) return null
  return { files: [{ path: "lib/ecommerce.ts", content: EC }] }
}
