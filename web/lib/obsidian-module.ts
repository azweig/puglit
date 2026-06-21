/**
 * obsidian-module.ts — use an Obsidian vault (markdown + [[wikilinks]] + backlinks) as a second
 * brain / PKM store for the generated app. Filesystem-based: it just reads/writes .md files in the
 * vault folder, so it works whether or not Obsidian is open. writeNote/readNote/search/backlinks/
 * graph. env: OBSIDIAN_VAULT (path). The same vault format the Puglit swarm uses for its own diary.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const OBS = `import fs from "node:fs"
import path from "node:path"
const vault = () => process.env.OBSIDIAN_VAULT || "./vault"
const safe = (t: string) => t.replace(/[^a-z0-9 _\\-áéíóúñ]/gi, "").trim()
const file = (t: string) => path.join(vault(), safe(t) + ".md")

/** Create/overwrite a note. links → appended as [[wikilinks]]; frontmatter optional. */
export function writeNote(title: string, content: string, opts?: { links?: string[]; tags?: string[]; frontmatter?: Record<string, unknown> }) {
  fs.mkdirSync(vault(), { recursive: true })
  const fm = opts?.frontmatter || opts?.tags ? \`---\\n\${opts?.tags?.length ? "tags: [" + opts.tags.join(", ") + "]\\n" : ""}\${Object.entries(opts?.frontmatter || {}).map(([k, v]) => k + ": " + JSON.stringify(v)).join("\\n")}\\n---\\n\\n\` : ""
  const links = opts?.links?.length ? "\\n\\n" + opts.links.map((l) => "[[" + safe(l) + "]]").join(" ") : ""
  fs.writeFileSync(file(title), fm + content + links)
}
export function readNote(title: string): string | null { try { return fs.readFileSync(file(title), "utf8") } catch { return null } }
export function listNotes(): string[] { try { return fs.readdirSync(vault()).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\\.md$/, "")) } catch { return [] } }
/** Full-text search across the vault. */
export function search(query: string): string[] {
  const q = query.toLowerCase()
  return listNotes().filter((n) => (readNote(n) || "").toLowerCase().includes(q))
}
/** Notes that link TO this note ([[title]]) — the backlinks. */
export function backlinks(title: string): string[] {
  const needle = "[[" + safe(title)
  return listNotes().filter((n) => (readNote(n) || "").includes(needle))
}
/** The link graph: { note: [linkedNotes] }. */
export function linkGraph(): Record<string, string[]> {
  const g: Record<string, string[]> = {}
  for (const n of listNotes()) g[n] = [...(readNote(n) || "").matchAll(/\\[\\[([^\\]]+)\\]\\]/g)].map((m) => m[1])
  return g
}
`
export function deterministicObsidian(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/obsidian|second brain|segundo cerebro|pkm|note.?taking|notas|markdown.*note|wiki.*personal|zettelkasten|knowledge.*personal|vault|backlink/.test(hay)) return null
  return { files: [{ path: "lib/obsidian.ts", content: OBS }] }
}
