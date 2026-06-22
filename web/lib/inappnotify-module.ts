/**
 * inappnotify-module.ts — in-app notification center (the bell icon), Postgres-native + realtime.
 * notify(userId, type, text, link?) creates a notification + publishes it live (if the realtime
 * module is present); unread(userId) / markRead(). Pairs with realtime + push.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const NOTIFY = `import { pool } from "@/lib/db"
/** Create an in-app notification (and push it live if realtime is wired). */
export async function notify(userId: string, type: string, text: string, link = "") {
  const { rows } = await pool.query("INSERT INTO notifications (user_id, type, text, link) VALUES ($1,$2,$3,$4) RETURNING id, created_at", [userId, type, text, link])
  try { const { publish } = await import("@/lib/realtime"); publish("user:" + userId, { id: rows[0].id, type, text, link, created_at: rows[0].created_at }) } catch {}
  return rows[0].id
}
export async function unread(userId: string) {
  return (await pool.query("SELECT id, type, text, link, created_at FROM notifications WHERE user_id=$1 AND read=false ORDER BY created_at DESC LIMIT 50", [userId])).rows
}
export async function markRead(userId: string, id?: number) {
  if (id) await pool.query("UPDATE notifications SET read=true WHERE user_id=$1 AND id=$2", [userId, id])
  else await pool.query("UPDATE notifications SET read=true WHERE user_id=$1", [userId])
}
`
const SQL = `CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY, user_id TEXT NOT NULL, type VARCHAR(32),
  text TEXT NOT NULL, link TEXT, read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read, created_at DESC);`

export function deterministicInAppNotify(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /notif|aviso|alert|bell|campana|inbox|activity|feed|mention|menci|social|dashboard|update/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/inappnotify.ts", content: NOTIFY }], extraSql: SQL }
}
