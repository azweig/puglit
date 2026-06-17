/**
 * Puglit Spine — rate-limit.ts
 * In-memory rate limiter (no deps, edge-compatible). Per-process; for multi-region
 * exactness swap the store for Redis, but per-process is fine for abuse control.
 */
interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>()

setInterval(() => {
  const now = Date.now()
  for (const key of Array.from(store.keys())) {
    const e = store.get(key)
    if (e && now > e.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const e = store.get(key)
  if (!e || now > e.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }
  e.count++
  if (e.count > limit) return { allowed: false, remaining: 0 }
  return { allowed: true, remaining: limit - e.count }
}
