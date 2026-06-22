/**
 * iterate.ts — #4 ITERATE / DIFF mode. Apply a founder's change request to an EXISTING generated app
 * by regenerating ONLY the affected files (surgical), instead of rebuilding from scratch. The model
 * sees the file tree + the relevant files and returns the full new content of just what changes.
 */
import { chatJSON, MODELS } from "@/lib/openai"
type AppFile = { path: string; content: string }

const ITER_SCHEMA = {
  type: "object",
  properties: { files: { type: "array", items: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } }, note: { type: "string" } },
  required: ["files"],
} as const

export async function iterateApp(appFiles: AppFile[], request: string): Promise<{ files: AppFile[]; changed: string[]; note: string }> {
  const tree = appFiles.map((f) => f.path).join("\n")
  const relevant = appFiles.filter((f) => /\.(ts|tsx|sql)$/.test(f.path)).slice(0, 18).map((f) => `// ===== ${f.path} =====\n${f.content.slice(0, 1800)}`).join("\n\n")
  const out = (await chatJSON([
    { role: "system", content: `You modify an EXISTING Next.js 16 App Router + raw-pg/Postgres app to satisfy ONE change request. Change the MINIMUM set of files (edit existing and/or add new). Return the FULL new content of EACH changed/added file — never a diff, never a partial snippet. Keep everything else intact. Build on the spine: \`import { pool } from "@/lib/db"\` (parameterized SQL), \`import { getAuthUser } from "@/lib/auth"\`. NO new npm deps. If a new table is needed, also return the updated sql/app.sql. Return ONLY JSON {"files":[{"path","content"}],"note":"<one line of what you changed>"}.` },
    { role: "user", content: `CHANGE REQUEST: ${request}\n\nFILE TREE:\n${tree}\n\nRELEVANT FILES:\n${relevant}` },
  ], { model: MODELS.code, temperature: 0.2, schema: ITER_SCHEMA }).catch(() => null)) as { files?: AppFile[]; note?: string } | null
  const changes = (out?.files || []).filter((f) => f?.path && f?.content).slice(0, 12)
  const byPath = new Map(appFiles.map((f) => [f.path, f]))
  const changed: string[] = []
  for (const c of changes) { byPath.set(c.path, { path: c.path, content: String(c.content).slice(0, 30000) }); changed.push(c.path) }
  return { files: [...byPath.values()], changed, note: String(out?.note || "").slice(0, 200) }
}
