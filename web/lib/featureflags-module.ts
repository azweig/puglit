/**
 * featureflags-module.ts — feature flags / gradual rollout / A-B tests, Postgres-native zero-dep.
 * isEnabled(flag, userId) supports on/off, % rollout, and per-user allowlists. Flip features
 * without a deploy; run experiments. variant(flag, userId) for A/B buckets.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const FLAGS = `import { pool } from "@/lib/db"
import { createHash } from "node:crypto"
const bucket = (s: string) => (parseInt(createHash("md5").update(s).digest("hex").slice(0, 8), 16) % 100)
/** Is a flag on for this user? Honours enabled, rollout_pct and an allowlist. */
export async function isEnabled(flag: string, userId = ""): Promise<boolean> {
  const { rows } = await pool().query("SELECT enabled, rollout_pct, allowlist FROM feature_flags WHERE key=$1", [flag])
  const f = rows[0]; if (!f) return false
  if (!f.enabled) return false
  if (Array.isArray(f.allowlist) && f.allowlist.includes(userId)) return true
  if (f.rollout_pct >= 100) return true
  if (f.rollout_pct <= 0) return false
  return bucket(flag + ":" + userId) < f.rollout_pct
}
/** Stable A/B variant (e.g. ["control","treatment"]). */
export function variant(flag: string, userId: string, variants = ["a", "b"]): string {
  return variants[bucket(flag + ":" + userId) % variants.length]
}
export async function setFlag(key: string, enabled: boolean, rolloutPct = 100) {
  await pool().query("INSERT INTO feature_flags (key, enabled, rollout_pct) VALUES ($1,$2,$3) ON CONFLICT (key) DO UPDATE SET enabled=$2, rollout_pct=$3", [key, enabled, rolloutPct])
}
`
const SQL = `CREATE TABLE IF NOT EXISTS feature_flags (
  key VARCHAR(64) PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  rollout_pct INT NOT NULL DEFAULT 100,
  allowlist JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);`

export function deterministicFeatureFlags(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary}`.toLowerCase()
  const wants = /feature flag|flag|rollout|a\/b|ab test|experiment|gradual|toggle|beta|canary/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/featureflags.ts", content: FLAGS }], extraSql: SQL }
}
