/**
 * push-module.ts — push notifications, zero-dep. Expo Push by default (dead-simple HTTP, perfect
 * for React Native/Expo apps — no keys needed), plus raw FCM (Android) by server key. sendPush()
 * fans out to a list of tokens. (Web Push needs VAPID + payload encryption — use the web-push lib
 * for that; noted.) env: FCM_SERVER_KEY (optional, for raw FCM).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const PUSH = `type PushMsg = { title: string; body: string; data?: Record<string, unknown> }
/** Send to Expo push tokens (ExponentPushToken[...]) — batched, no credentials needed. */
export async function sendExpoPush(tokens: string[], msg: PushMsg) {
  const messages = tokens.map((to) => ({ to, sound: "default", title: msg.title, body: msg.body, data: msg.data || {} }))
  try {
    return await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(messages) }).then((r) => r.json())
  } catch (e) { console.error("[push] expo", (e as Error).message); return null }
}
/** Send to raw FCM device tokens (Android) via the legacy server key. */
export async function sendFcm(tokens: string[], msg: PushMsg) {
  const key = process.env.FCM_SERVER_KEY
  if (!key) { console.warn("[push] set FCM_SERVER_KEY for FCM"); return null }
  try {
    return await fetch("https://fcm.googleapis.com/fcm/send", { method: "POST", headers: { Authorization: "key=" + key, "Content-Type": "application/json" }, body: JSON.stringify({ registration_ids: tokens, notification: { title: msg.title, body: msg.body }, data: msg.data || {} }) }).then((r) => r.json())
  } catch (e) { console.error("[push] fcm", (e as Error).message); return null }
}
/** Auto-route: Expo tokens → Expo, the rest → FCM. */
export async function sendPush(tokens: string[], msg: PushMsg) {
  const expo = tokens.filter((t) => t.startsWith("ExponentPushToken"))
  const fcm = tokens.filter((t) => !t.startsWith("ExponentPushToken"))
  const out: any[] = []
  if (expo.length) out.push(await sendExpoPush(expo, msg))
  if (fcm.length) out.push(await sendFcm(fcm, msg))
  return out
}
`

export function deterministicPush(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /push|notif|notificaci|alert|aviso|reminder|recordatorio|expo|react native|mobile app|app m[oó]vil|fcm|engagement|re-engage/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/push.ts", content: PUSH }] }
}
