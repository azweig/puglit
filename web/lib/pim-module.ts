/**
 * pim-module.ts — Product Information Management connector. Thin client to a self-hosted Akeneo
 * (REST). Read/write product attributes, families, variants at catalog scale. env: PIM_URL,
 * PIM_TOKEN. OSS: Akeneo PIM · Pimcore.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const PIM = `const base = () => (process.env.PIM_URL || "http://localhost:8088").replace(/\\/$/, "")
const h = () => ({ Authorization: "Bearer " + (process.env.PIM_TOKEN || ""), "Content-Type": "application/json" })
export async function getProduct(sku: string) {
  return fetch(\`\${base()}/api/rest/v1/products/\${sku}\`, { headers: h() }).then((r) => r.json()).catch((e) => { console.error("[pim]", e); return null })
}
export async function upsertProduct(sku: string, values: Record<string, unknown>, family?: string) {
  return fetch(\`\${base()}/api/rest/v1/products/\${sku}\`, { method: "PATCH", headers: h(), body: JSON.stringify({ identifier: sku, family, values }) }).then((r) => r.status < 300).catch(() => false)
}
export async function listProducts(params: Record<string, string> = {}) {
  return fetch(\`\${base()}/api/rest/v1/products?\${new URLSearchParams(params)}\`, { headers: h() }).then((r) => r.json()).catch(() => null)
}
`
export function deterministicPim(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/\bpim\b|product information|ficha.*producto|cat[aá]logo.*producto|attributes.*product|variant|akeneo|pimcore|product catalog|gesti[oó]n de producto/.test(hay)) return null
  return { files: [{ path: "lib/pim.ts", content: PIM }] }
}
