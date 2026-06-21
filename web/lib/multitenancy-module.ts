/**
 * multitenancy-module.ts — orgs / teams / workspaces with roles (the backbone of B2B SaaS),
 * Postgres-native. createOrg, addMember(role), membersOf, roleOf — scope all your data by org_id.
 * Invite flow + owner/admin/member roles.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const MT = `import { pool } from "@/lib/db"
export async function createOrg(name: string, ownerId: string): Promise<number> {
  const { rows } = await pool().query("INSERT INTO orgs (name) VALUES ($1) RETURNING id", [name])
  await pool().query("INSERT INTO org_members (org_id, user_id, role) VALUES ($1,$2,'owner')", [rows[0].id, ownerId])
  return rows[0].id
}
export async function addMember(orgId: number, userId: string, role: "admin" | "member" = "member") {
  await pool().query("INSERT INTO org_members (org_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT (org_id, user_id) DO UPDATE SET role=$3", [orgId, userId, role])
}
export async function roleOf(orgId: number, userId: string): Promise<string | null> {
  const { rows } = await pool().query("SELECT role FROM org_members WHERE org_id=$1 AND user_id=$2", [orgId, userId])
  return rows[0]?.role || null
}
export async function membersOf(orgId: number) {
  return (await pool().query("SELECT user_id, role FROM org_members WHERE org_id=$1", [orgId])).rows
}
export async function orgsOf(userId: string) {
  return (await pool().query("SELECT o.id, o.name, m.role FROM orgs o JOIN org_members m ON m.org_id=o.id WHERE m.user_id=$1", [userId])).rows
}
`
const SQL = `CREATE TABLE IF NOT EXISTS orgs (
  id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS org_members (
  org_id BIGINT NOT NULL REFERENCES orgs(id), user_id TEXT NOT NULL,
  role VARCHAR(12) NOT NULL DEFAULT 'member', created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);`

export function deterministicMultitenancy(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /\borg\b|organi|team|equipo|workspace|espacio|tenant|b2b|company|empresa|multi.?tenant|seats|miembros|members|roles|saas/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/multitenancy.ts", content: MT }], extraSql: SQL }
}
