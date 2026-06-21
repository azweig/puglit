/**
 * cache-module.ts — caching, zero-dep. In-memory (default, per-instance) + Upstash Redis REST
 * (distributed, HTTP — no redis client dep). cached(key, ttl, fn) is cache-aside: serve hot data
 * from cache, compute on miss. Cuts DB load (and helps absorb traffic spikes). env: CACHE_REDIS_URL,
 * CACHE_REDIS_TOKEN (Upstash REST). Without them it uses the in-memory map.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const CACHE = `// In-memory + optional Upstash Redis (REST). env: CACHE_REDIS_URL, CACHE_REDIS_TOKEN
const mem = new Map<string, { v: string; exp: number }>()
const up = () => ({ url: (process.env.CACHE_REDIS_URL || "").replace(/\\/$/, ""), token: process.env.CACHE_REDIS_TOKEN || "" })

export async function cacheGet(key: string): Promise<string | null> {
  const { url, token } = up()
  if (url) { try { const r = await fetch(\`\${url}/get/\${encodeURIComponent(key)}\`, { headers: { Authorization: "Bearer " + token } }).then((x) => x.json()); return r.result ?? null } catch { return null } }
  const e = mem.get(key); if (!e) return null; if (e.exp && e.exp < Date.now()) { mem.delete(key); return null } return e.v
}
export async function cacheSet(key: string, value: string, ttlSec = 60): Promise<void> {
  const { url, token } = up()
  if (url) { try { await fetch(\`\${url}/set/\${encodeURIComponent(key)}/\${encodeURIComponent(value)}?EX=\${ttlSec}\`, { headers: { Authorization: "Bearer " + token } }) } catch {} return }
  mem.set(key, { v: value, exp: ttlSec ? Date.now() + ttlSec * 1000 : 0 })
}
export async function cacheDel(key: string): Promise<void> {
  const { url, token } = up()
  if (url) { try { await fetch(\`\${url}/del/\${encodeURIComponent(key)}\`, { headers: { Authorization: "Bearer " + token } }) } catch {} return }
  mem.delete(key)
}

/** Cache-aside: return the cached value, or compute it with fn() and cache it. */
export async function cached<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
  const hit = await cacheGet(key)
  if (hit != null) { try { return JSON.parse(hit) as T } catch { return hit as unknown as T } }
  const v = await fn()
  await cacheSet(key, JSON.stringify(v), ttlSec)
  return v
}
`

export function deterministicCache(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /cache|cach[eé]|redis|performance|rendimiento|escala|scale|high traffic|tr[aá]fico|rate|leaderboard|ranking|feed|dashboard|tiempo real|popular|trending/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/cache.ts", content: CACHE }] }
}
