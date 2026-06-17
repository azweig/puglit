// Core duplicate-detection logic — PURE & unit-testable (no React Native imports).
// An asset is a photo or document on the device. Duplicates are grouped by a
// fingerprint: a real content hash when available, otherwise size+normalized-name.

export interface Asset {
  id: string
  uri: string
  filename: string
  size: number // bytes
  hash?: string // optional content hash (sha256 of the file bytes)
  kind?: "image" | "document"
}

export interface DupGroup {
  fingerprint: string
  assets: Asset[] // 2+ assets considered the same
  bytesEach: number
  reclaimableBytes: number // bytes freed if we keep 1 and delete the rest
}

const normName = (n: string) => n.toLowerCase().replace(/\s+/g, "").replace(/\(\d+\)(?=\.[a-z0-9]+$)/, "").trim()

export function fingerprint(a: Asset): string {
  if (a.hash) return "h:" + a.hash
  return "s:" + a.size + ":" + normName(a.filename)
}

/** Group assets into duplicate sets (2+ sharing a fingerprint), largest reclaim first. */
export function findDuplicates(assets: Asset[]): DupGroup[] {
  const map = new Map<string, Asset[]>()
  for (const a of assets) {
    const fp = fingerprint(a)
    const arr = map.get(fp)
    if (arr) arr.push(a)
    else map.set(fp, [a])
  }
  const groups: DupGroup[] = []
  for (const [fp, arr] of map) {
    if (arr.length < 2) continue
    const bytesEach = Math.max(...arr.map((x) => x.size || 0))
    groups.push({ fingerprint: fp, assets: arr, bytesEach, reclaimableBytes: bytesEach * (arr.length - 1) })
  }
  return groups.sort((a, b) => b.reclaimableBytes - a.reclaimableBytes)
}

export function totalReclaimable(groups: DupGroup[]): number {
  return groups.reduce((s, g) => s + g.reclaimableBytes, 0)
}

/** Default selection: keep the first (oldest/best) of each group, mark the rest to delete. */
export function defaultDeletion(groups: DupGroup[]): string[] {
  const ids: string[] = []
  for (const g of groups) for (let i = 1; i < g.assets.length; i++) ids.push(g.assets[i].id)
  return ids
}

export function formatBytes(n: number): string {
  if (n < 1024) return n + " B"
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB"
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB"
  return (n / (1024 * 1024 * 1024)).toFixed(2) + " GB"
}
