/**
 * swarm-repair.ts — SWARM INFRA: close the loop. swarm-checks DETECTS quality issues; this REPAIRS
 * the highest-impact class — phantom tables (SQL that references a table the schema never declares,
 * the recurring "hallucinated schema" / FK-to-users bug). It infers the missing table's columns
 * from how the queries USE it (an LLM call) and appends the CREATE TABLE to app.sql, so the build
 * stops shipping code that crashes on a missing relation.
 */
import { chatJSON, MODELS } from "@/lib/openai"
import { type CodeIssue } from "@/lib/swarm-checks"
import { frontierEscalate } from "@/lib/swarm-fitness"

type AppFile = { path: string; content: string }

/** FRONTIER ESCALATION (crítica: techo del modelo + auto-repair solo flaggea security) — for the
 *  high-severity security issues the local model/heuristics can't safely fix, spend a bounded
 *  budget of a STRONGER model to rewrite the offending file. No-op unless PUGLIT_FRONTIER_BUDGET set. */
export async function repairSecurityWithFrontier(files: AppFile[], issues: CodeIssue[]): Promise<number> {
  const sec = issues.filter((i) => i.severity === "high" && ["sql-injection", "hardcoded-secret", "dangerous-exec"].includes(i.kind))
  if (!sec.length) return 0
  const byFile = new Map<string, CodeIssue[]>()
  for (const i of sec) { if (!byFile.has(i.file)) byFile.set(i.file, []); byFile.get(i.file)!.push(i) }
  let fixed = 0
  for (const [path, fileIssues] of byFile) {
    const f = files.find((x) => x.path === path)
    if (!f) continue
    const out = await frontierEscalate([
      { role: "system", content: "You fix SECURITY issues in one Next.js 16 + TypeScript file. Return ONLY the full corrected file (no prose, no fences). Parameterize ALL SQL ($1,$2,…), move any secret to process.env, remove eval/exec/child_process. Keep behavior identical otherwise; it must still compile under tsc." },
      { role: "user", content: `Issues to fix: ${fileIssues.map((i) => i.kind + " — " + i.detail).join("; ")}\n\nFile ${path}:\n${f.content.slice(0, 12000)}` },
    ]).catch(() => null)
    if (out && out.length > 60) { f.content = out.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "").trim(); fixed++ }
  }
  return fixed
}

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
