/**
 * swarm-planner.ts — SWARM INFRA addressing two critiques:
 *  1) Capability planner (crítica: keyword injection is fragile). An LLM reads the product + the
 *     catalog and names the capabilities it needs — catching cases the regex misses ("ERP para
 *     hospitales" has none of the keywords). Its output augments the detection text so the
 *     deterministic injectors fire for planned capabilities too.
 *  2) Dependency resolver (crítica: no dependency graph). After injection, force-inject any
 *     hard requirement a module declares (e.g. social-auth → crypto) so a build never ships
 *     missing its base module.
 */
import { dependencyClosure, MODULE_REQUIRES } from "@/lib/module-registry"
import { chatJSON, MODELS } from "@/lib/openai"
import { cryptoFiles } from "@/lib/crypto-module"
import { storageFiles } from "@/lib/storage-module"
import { realtimeFiles } from "@/lib/realtime-module"
import { llmFiles } from "@/lib/llm-module"
import { queueFiles } from "@/lib/queue-module"
import { statsFiles } from "@/lib/stats-module"
import { validationFiles } from "@/lib/validation-module"

type AppFile = { path: string; content: string }

// dependency targets the resolver can force-inject (ungated), keyed by module name
const DEP_INJECTORS: Record<string, () => { files: AppFile[]; extraSql?: string }> = {
  crypto: cryptoFiles, storage: storageFiles, realtime: realtimeFiles,
  llm: llmFiles, queue: queueFiles, stats: statsFiles, validation: validationFiles,
}
// how to detect that a dependent module was injected (its primary file)
const PRIMARY: Record<string, string> = {
  "social-auth": "lib/social/providers.ts", billing: "lib/billing.ts", payments: "lib/payments.ts",
  inappnotify: "lib/inappnotify.ts", moderation: "lib/moderation.ts", rag: "lib/rag.ts",
  agent: "lib/agent/brain.ts", charts: "lib/charts.ts", forms: "lib/forms.ts",
  webhooksout: "lib/webhooksout.ts", imagegen: "lib/imagegen.ts", media: "lib/media.ts",
}
const depFile: Record<string, string> = { crypto: "lib/crypto.ts", storage: "lib/storage.ts", realtime: "lib/realtime.ts", llm: "lib/llm.ts", queue: "lib/queue.ts", stats: "lib/stats.ts", validation: "lib/validation.ts" }

/** Force-inject hard dependencies of whatever modules got injected. Returns names added. */
export function resolveDeps(files: AppFile[]): string[] {
  const has = (p: string) => files.some((f) => f.path === p)
  const present: string[] = []
  for (const name of Object.keys(MODULE_REQUIRES)) if (has(PRIMARY[name] || `lib/${name}.ts`)) present.push(name)
  const needed = dependencyClosure(present)
  const added: string[] = []
  for (const dep of needed) {
    const inj = DEP_INJECTORS[dep]
    if (!inj || has(depFile[dep] || `lib/${dep}.ts`)) continue
    const r = inj()
    for (const f of r.files) if (!has(f.path)) files.push(f)
    if (r.extraSql) { const sql = files.find((f) => f.path === "sql/app.sql"); if (sql && !sql.content.includes(r.extraSql.slice(0, 40))) sql.content += `\n\n-- auto-dependency: ${dep}\n${r.extraSql}\n` }
    added.push(dep)
  }
  return added
}

/** Capability planner: LLM names the modules the product needs, from the catalog. */
export async function planCapabilities(productText: string, catalog: string): Promise<string[]> {
  if (!catalog) return []
  try {
    const out = (await chatJSON([
      { role: "system", content: "You are a capability planner for an app generator. Given a product description and a catalog of available modules, return ONLY the module names whose capability the product genuinely needs (think about implicit needs: an ERP needs auth+multitenancy+audit even if unsaid). Be precise, do not over-select. JSON { modules: string[] }." },
      { role: "user", content: `Catalog:\n${catalog}\n\nProduct: ${productText}\n\nWhich module names does it need?` },
    ], { model: MODELS.premium, temperature: 0.1, schema: { type: "object", properties: { modules: { type: "array", items: { type: "string" } } }, required: ["modules"] } })) as { modules?: string[] }
    return (out?.modules || []).map((m) => String(m).toLowerCase().trim()).filter(Boolean)
  } catch (e) { console.error("[planner]", (e as Error).message); return [] }
}
