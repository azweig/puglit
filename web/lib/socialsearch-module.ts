/**
 * socialsearch-module.ts — "agent eyes" (inspired by Panniantong/Agent-Reach): read & search the
 * public web/social — Reddit, GitHub, Hacker News (all free, zero-dep) + YouTube (with a key).
 * For Twitter/Instagram/LinkedIn (auth-walled) use the scraper module with your cookie. searchAll(q)
 * fans out across platforms. Great for research, monitoring, trend-spotting, lead-gen.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const SOCIAL = `type Hit = { source: string; title: string; url: string; score?: number; meta?: string }
const UA = { "User-Agent": "puglit-social/1.0" }

export async function searchReddit(q: string, limit = 10): Promise<Hit[]> {
  try {
    const r = await fetch(\`https://www.reddit.com/search.json?q=\${encodeURIComponent(q)}&limit=\${limit}&sort=relevance\`, { headers: UA }).then((x) => x.json())
    return (r.data?.children || []).map((c: any) => ({ source: "reddit", title: c.data.title, url: "https://reddit.com" + c.data.permalink, score: c.data.score, meta: "r/" + c.data.subreddit }))
  } catch { return [] }
}
export async function searchGitHub(q: string, limit = 10): Promise<Hit[]> {
  try {
    const h: any = { ...UA, Accept: "application/vnd.github+json" }
    if (process.env.GITHUB_TOKEN) h.Authorization = "Bearer " + process.env.GITHUB_TOKEN
    const r = await fetch(\`https://api.github.com/search/repositories?q=\${encodeURIComponent(q)}&per_page=\${limit}\`, { headers: h }).then((x) => x.json())
    return (r.items || []).map((i: any) => ({ source: "github", title: i.full_name, url: i.html_url, score: i.stargazers_count, meta: i.description?.slice(0, 80) }))
  } catch { return [] }
}
export async function searchHN(q: string, limit = 10): Promise<Hit[]> {
  try {
    const r = await fetch(\`https://hn.algolia.com/api/v1/search?query=\${encodeURIComponent(q)}&hitsPerPage=\${limit}\`).then((x) => x.json())
    return (r.hits || []).map((i: any) => ({ source: "hn", title: i.title || i.story_title || "", url: i.url || \`https://news.ycombinator.com/item?id=\${i.objectID}\`, score: i.points, meta: i.num_comments + " comments" }))
  } catch { return [] }
}
export async function searchYouTube(q: string, limit = 10): Promise<Hit[]> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return []
  try {
    const r = await fetch(\`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=\${limit}&q=\${encodeURIComponent(q)}&key=\${key}\`).then((x) => x.json())
    return (r.items || []).map((i: any) => ({ source: "youtube", title: i.snippet.title, url: "https://youtube.com/watch?v=" + i.id.videoId, meta: i.snippet.channelTitle }))
  } catch { return [] }
}
/** Fan out across every platform, ranked by score. */
export async function searchAll(q: string, limit = 10): Promise<Hit[]> {
  const all = (await Promise.all([searchReddit(q, limit), searchGitHub(q, limit), searchHN(q, limit), searchYouTube(q, limit)])).flat()
  return all.sort((a, b) => (b.score || 0) - (a.score || 0))
}
`

export function deterministicSocialSearch(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /social.*(search|listen|monitor)|reddit|hacker news|trend|tendenc|research|investig|monitor|menci[oó]n|mention|lead|prospect|competidor|competitor|osint|sentiment|buzz|viral/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/socialsearch.ts", content: SOCIAL }] }
}
