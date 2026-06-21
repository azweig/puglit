/**
 * entitlements-module.ts — plan-based feature gating (billing × featureflags). Define what each
 * plan unlocks; can(userId, feature) checks the user's active plan. requireFeature() guards a
 * route. The piece every SaaS needs and few build cleanly. Postgres-native, zero-dep.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const ENT = `import { pool } from "@/lib/db"
// plan → features (override via the plan_features table; this is the default map)
const PLANS: Record<string, string[]> = JSON.parse(process.env.PLANS_JSON || '{"free":["basic"],"pro":["basic","advanced","export"],"business":["basic","advanced","export","api","sso"]}')

/** The user's current plan (from subscriptions if present, else 'free'). */
export async function planOf(userId: string): Promise<string> {
  try { const { rows } = await pool().query("SELECT plan FROM subscriptions WHERE user_id=$1 AND status='active' ORDER BY created_at DESC LIMIT 1", [userId]); return rows[0]?.plan || "free" } catch { return "free" }
}
/** Can this user use a feature? Checks plan_features overrides then the default map. */
export async function can(userId: string, feature: string): Promise<boolean> {
  const plan = await planOf(userId)
  try { const { rows } = await pool().query("SELECT 1 FROM plan_features WHERE plan=$1 AND feature=$2", [plan, feature]); if (rows[0]) return true } catch {}
  return (PLANS[plan] || []).includes(feature)
}
/** Guard for a route: returns null if allowed, or a 402 reason if not. */
export async function requireFeature(userId: string, feature: string): Promise<string | null> {
  return (await can(userId, feature)) ? null : "upgrade required for: " + feature
}
`
const SQL = `CREATE TABLE IF NOT EXISTS plan_features (
  plan VARCHAR(32) NOT NULL, feature VARCHAR(48) NOT NULL, PRIMARY KEY (plan, feature)
);`

export function deterministicEntitlements(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${config.monetization || ""}`.toLowerCase()
  const wants = /plan|tier|entitle|gating|premium|pro\b|upgrade|suscrip|subscription|feature.*plan|saas|paywall|free.*paid/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/entitlements.ts", content: ENT }], extraSql: SQL }
}
