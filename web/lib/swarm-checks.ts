/**
 * swarm-checks.ts — SWARM INFRA (not an app module): quality gates over the generated code,
 * run in finalize. Two scans, inspired by GitHub-trending tools:
 *   - securityScan (NVIDIA/SkillSpector): flag hardcoded secrets, eval/exec, SQL built by string
 *     interpolation, unsanitized dangerouslySetInnerHTML.
 *   - consistencyScan (colbymchenry/codegraph): flag SQL that references TABLES the app never
 *     declares (the "5 invented tables" / FK-to-users class of bug) and imports of missing files.
 * Findings surface to the build log + the critic so the swarm can self-correct.
 */
type AppFile = { path: string; content: string }
export interface CodeIssue { severity: "high" | "med" | "low"; kind: string; file: string; detail: string }

// tables the spine always provides (so referencing them is NOT a hallucination)
const SPINE_TABLES = new Set(["users", "sessions", "accounts", "analytics_events", "password_resets", "magic_links", "records"])
const PG_OK = /^(information_schema|pg_|public\.)/i

export function securityScan(files: AppFile[]): CodeIssue[] {
  const out: CodeIssue[] = []
  for (const f of files) {
    if (!/\.(ts|tsx|js|mjs)$/.test(f.path)) continue
    const c = f.content
    if (/\b(sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,})\b/.test(c)) out.push({ severity: "high", kind: "hardcoded-secret", file: f.path, detail: "looks like a real API key/token committed in code" })
    if (/(password|secret|api[_-]?key|token)\s*[:=]\s*["'][^"'$]{8,}["']/i.test(c) && !/process\.env/.test(c.match(/.*(password|secret|api[_-]?key|token)\s*[:=].*/i)?.[0] || "")) out.push({ severity: "med", kind: "hardcoded-credential", file: f.path, detail: "credential assigned a string literal (use process.env)" })
    if (/\beval\s*\(|new Function\s*\(|child_process|exec\s*\(/.test(c)) out.push({ severity: "high", kind: "dangerous-exec", file: f.path, detail: "eval/Function/exec — RCE risk" })
    if (/\.query\s*\(\s*[`"][^`"]*\$\{/.test(c)) out.push({ severity: "high", kind: "sql-injection", file: f.path, detail: "SQL built by string interpolation — use parameterized $1,$2" })
    if (/dangerouslySetInnerHTML/.test(c) && !/sanitize|DOMPurify|escapeHtml/.test(c)) out.push({ severity: "med", kind: "xss", file: f.path, detail: "dangerouslySetInnerHTML without sanitization" })
  }
  return out
}

export function consistencyScan(files: AppFile[], declaredTables: string[]): CodeIssue[] {
  const out: CodeIssue[] = []
  const declared = new Set<string>(declaredTables.map((t) => t.toLowerCase()))
  // collect tables CREATEd anywhere in the generated SQL
  for (const f of files) if (/\.sql$/.test(f.path) || f.path.endsWith("app.sql")) {
    for (const m of f.content.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?["']?([a-z_][a-z0-9_]*)/gi)) declared.add(m[1].toLowerCase())
  }
  const known = (t: string) => declared.has(t) || SPINE_TABLES.has(t) || PG_OK.test(t)
  // flag SQL that reads/writes tables nobody declared (hallucinated schema)
  for (const f of files) {
    if (!/\.(ts|tsx)$/.test(f.path)) continue
    for (const m of f.content.matchAll(/\b(from|join|into|update)\s+([a-z_][a-z0-9_]*)/gi)) {
      const t = m[2].toLowerCase()
      if (t.length < 3 || ["set", "values", "select", "where"].includes(t)) continue
      if (!known(t)) out.push({ severity: "high", kind: "phantom-table", file: f.path, detail: `query references table "${t}" that is never CREATEd (hallucinated schema?)` })
    }
    // imports of local files that don't exist (and aren't spine libs)
    for (const m of f.content.matchAll(/from\s+["']@\/lib\/([a-z0-9-]+)["']/gi)) {
      const lib = m[1]
      const exists = files.some((x) => x.path === `lib/${lib}.ts` || x.path === `lib/${lib}.tsx` || x.path.startsWith(`lib/${lib}/`))
      const spineLib = ["db", "auth", "auth-guards", "mailer", "rate-limit", "analytics", "users", "records", "i18n", "auth-emails"].includes(lib)
      if (!exists && !spineLib) out.push({ severity: "med", kind: "missing-import", file: f.path, detail: `imports @/lib/${lib} which doesn't exist` })
    }
  }
  // de-dup
  const seen = new Set<string>()
  return out.filter((i) => { const k = i.kind + i.file + i.detail; if (seen.has(k)) return false; seen.add(k); return true })
}

/** Run both scans; returns a compact report (and the raw issues). */
export function runSwarmChecks(files: AppFile[], declaredTables: string[]): { issues: CodeIssue[]; summary: string } {
  const issues = [...securityScan(files), ...consistencyScan(files, declaredTables)]
  const high = issues.filter((i) => i.severity === "high").length
  const summary = issues.length ? `⚠ ${issues.length} quality issues (${high} high): ` + issues.slice(0, 6).map((i) => `${i.kind}@${i.file.split("/").pop()}`).join(", ") : "✓ clean"
  return { issues, summary }
}
