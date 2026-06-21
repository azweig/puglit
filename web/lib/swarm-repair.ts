/**
 * swarm-repair.ts — SWARM INFRA: close the loop. swarm-checks DETECTS quality issues; this REPAIRS
 * the highest-impact class — phantom tables (SQL that references a table the schema never declares,
 * the recurring "hallucinated schema" / FK-to-users bug). It infers the missing table's columns
 * from how the queries USE it (an LLM call) and appends the CREATE TABLE to app.sql, so the build
 * stops shipping code that crashes on a missing relation.
 */
import { chatJSON, MODELS } from "@/lib/openai"
import { type CodeIssue } from "@/lib/swarm-checks"

type AppFile = { path: string; content: string }

const SCHEMA = { type: "object", properties: { sql: { type: "string" } }, required: ["sql"] }

/** Generate + inject CREATE TABLE for tables referenced-but-never-declared. Returns # tables fixed.
 *  Safety (crítica: auto-repair persists hallucinations): prefers the BLUEPRINT's declared intent
 *  over usage (a phantom table that's a typo of an intended one is mapped, not invented), and keeps
 *  a commented backup of the pre-repair SQL so a bad repair is reversible/visible. */
export async function repairPhantomTables(files: AppFile[], issues: CodeIssue[], declaredTables: string[], intent?: { name: string; columns?: { name: string; type?: string }[] }[]): Promise<number> {
  const phantoms = [...new Set(issues.filter((i) => i.kind === "phantom-table").map((i) => i.detail.match(/table "([^"]+)"/)?.[1]).filter(Boolean) as string[])]
  if (!phantoms.length) return 0
  const appSql = files.find((f) => f.path === "sql/app.sql")
  if (!appSql) return 0

  const usage = phantoms.map((t) => {
    const snippets = new Set<string>()
    const re = new RegExp(`[^\\n]*\\b(?:from|into|update|join)\\s+${t}\\b[^\\n]*`, "gi")
    for (const f of files) if (/\.(ts|tsx)$/.test(f.path)) for (const m of f.content.matchAll(re)) snippets.add(m[0].trim().slice(0, 220))
    return `Table "${t}" referenced in:\n${[...snippets].slice(0, 8).join("\n")}`
  }).join("\n\n")
  // the architect's INTENDED schema = ground truth (prefer it over guessing from a wrong query)
  const intentText = (intent || []).filter((t) => t.columns?.length).map((t) => `${t.name}(${(t.columns || []).map((c) => `${c.name} ${c.type || "text"}`).join(", ")})`).join("; ")

  try {
    const out = (await chatJSON([
      { role: "system", content: "You are a Postgres schema repair tool. SQL queries reference tables that were never CREATEd. FIRST decide if each phantom table is really a typo/alias of an INTENDED table (then map it / alias it, don't invent a new one); ONLY if it is genuinely a new table, infer its columns/types/keys from how it is used. Prefer the architect's intended schema as ground truth. Output ONLY `CREATE TABLE IF NOT EXISTS` (and any needed `CREATE VIEW alias AS SELECT * FROM real_table` for typos). Sensible types only." },
      { role: "user", content: `Architect's INTENDED tables (ground truth): ${intentText || "(none provided)"}\nAlready-declared (do NOT recreate): ${declaredTables.join(", ") || "(none)"}\n\nPhantom tables + their usage:\n\n${usage}` },
    ], { model: MODELS.premium, temperature: 0.1, schema: SCHEMA })) as { sql?: string }
    if (out?.sql && /create\s+(table|view)/i.test(out.sql)) {
      // backup the pre-repair SQL (commented) so the repair is auditable/reversible
      const backup = `-- [pre-repair backup ${appSql.content.length}b] original SQL preserved above this marker\n`
      appSql.content += `\n\n${backup}-- auto-repair (swarm): phantom tables reconciled against the architect's intent\n${out.sql.trim()}\n`
      return phantoms.length
    }
  } catch (e) { console.error("[swarm-repair]", (e as Error).message) }
  return 0
}
