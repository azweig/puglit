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

/** Generate + inject CREATE TABLE for tables referenced-but-never-declared. Returns # tables fixed. */
export async function repairPhantomTables(files: AppFile[], issues: CodeIssue[], declaredTables: string[]): Promise<number> {
  const phantoms = [...new Set(issues.filter((i) => i.kind === "phantom-table").map((i) => i.detail.match(/table "([^"]+)"/)?.[1]).filter(Boolean) as string[])]
  if (!phantoms.length) return 0
  const appSql = files.find((f) => f.path === "sql/app.sql")
  if (!appSql) return 0

  // gather how each phantom table is used (columns, joins) so the LLM can infer a faithful schema
  const usage = phantoms.map((t) => {
    const snippets = new Set<string>()
    const re = new RegExp(`[^\\n]*\\b(?:from|into|update|join)\\s+${t}\\b[^\\n]*`, "gi")
    for (const f of files) if (/\.(ts|tsx)$/.test(f.path)) for (const m of f.content.matchAll(re)) snippets.add(m[0].trim().slice(0, 220))
    return `Table "${t}" referenced in:\n${[...snippets].slice(0, 8).join("\n")}`
  }).join("\n\n")

  try {
    const out = (await chatJSON([
      { role: "system", content: "You are a Postgres schema repair tool. You are given SQL queries that reference tables which were never CREATEd. Infer each missing table's columns, types, primary keys and foreign keys FROM HOW IT IS USED (columns selected/inserted/filtered, join keys). Output ONLY `CREATE TABLE IF NOT EXISTS` statements — faithful to the usage, no extra tables, sensible types (TEXT, BIGINT, BOOLEAN, TIMESTAMPTZ, DOUBLE PRECISION)." },
      { role: "user", content: `Already-declared tables (do NOT recreate): ${declaredTables.join(", ") || "(none)"}.\n\nGenerate the missing tables from this usage:\n\n${usage}` },
    ], { model: MODELS.premium, temperature: 0.1, schema: SCHEMA })) as { sql?: string }
    if (out?.sql && /create\s+table/i.test(out.sql)) {
      appSql.content += `\n\n-- auto-repair (swarm): tables inferred from usage that were never declared\n${out.sql.trim()}\n`
      return phantoms.length
    }
  } catch (e) { console.error("[swarm-repair]", (e as Error).message) }
  return 0
}
