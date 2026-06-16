/**
 * Puglit web — github.ts
 * Assembles a COMPLETE, runnable project and commits it to azweig/puglit under
 * projects/<slug>/. The project = the production spine (Next 16 app: auth, db,
 * analytics, middleware, branded landing) + infra (Docker/Fly) + SQL, with the
 * user's generated domain.config.ts. Uses the Git Data API and REUSES the
 * spine's existing blob SHAs (no re-upload) — one commit, fast.
 *
 * Needs GITHUB_TOKEN (a token with `repo`/contents:write on azweig/puglit).
 */
const GH = "https://api.github.com"
const OWNER = "azweig"
const REPO = "puglit"
const BRANCH = "main"

export function githubConfigured(): boolean {
  return !!process.env.GITHUB_TOKEN
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "puglit-generator",
  }
}

async function gh(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${GH}${path}`, { ...init, headers: { ...headers(), ...(init?.headers || {}) } })
  if (!res.ok) throw new Error(`github ${res.status} ${path}: ${(await res.text().catch(() => "")).slice(0, 300)}`)
  return res.json()
}

interface TreeEntry { path: string; mode: string; type: string; sha: string }

/** Maps a repo path to its location inside the generated project (or null to skip). */
function remap(path: string): string | null {
  if (path === "spine/domain.config.ts") return null // replaced with the user's config
  if (path.startsWith("spine/")) return path.slice("spine/".length)
  if (path.startsWith("infra/")) return path // keep infra/
  if (path.startsWith("scripts/sql/")) return "sql/" + path.slice("scripts/sql/".length)
  return null
}

export async function assembleProject(opts: {
  slug: string
  name: string
  configTs: string
  readme: string
}): Promise<{ url: string; commit: string }> {
  const { slug } = opts
  // 1. base ref + commit + root tree
  const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`)
  const baseCommitSha = ref.object.sha
  const baseCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits/${baseCommitSha}`)
  const rootTreeSha = baseCommit.tree.sha

  // 2. recursive tree → reuse spine/infra/sql blobs under projects/<slug>/
  const full = await gh(`/repos/${OWNER}/${REPO}/git/trees/${rootTreeSha}?recursive=1`)
  const base = `projects/${slug}/`
  const entries: TreeEntry[] = []
  for (const e of full.tree as TreeEntry[]) {
    if (e.type !== "blob") continue
    const mapped = remap(e.path)
    if (!mapped) continue
    entries.push({ path: base + mapped, mode: e.mode, type: "blob", sha: e.sha })
  }
  if (entries.length === 0) throw new Error("spine tree empty — nothing to assemble")

  // 3. new blobs: the user's domain.config.ts + README
  const configBlob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
    method: "POST", body: JSON.stringify({ content: opts.configTs, encoding: "utf-8" }),
  })
  entries.push({ path: `${base}domain.config.ts`, mode: "100644", type: "blob", sha: configBlob.sha })
  const readmeBlob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
    method: "POST", body: JSON.stringify({ content: opts.readme, encoding: "utf-8" }),
  })
  entries.push({ path: `${base}README.md`, mode: "100644", type: "blob", sha: readmeBlob.sha })

  // 4. tree (merged onto the existing root) → commit → move the branch
  const newTree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: "POST", body: JSON.stringify({ base_tree: rootTreeSha, tree: entries }),
  })
  const commit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: `generate: ${opts.name} → projects/${slug}`,
      tree: newTree.sha,
      parents: [baseCommitSha],
    }),
  })
  await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }),
  })

  return { url: `https://github.com/${OWNER}/${REPO}/tree/${BRANCH}/projects/${slug}`, commit: commit.sha }
}
