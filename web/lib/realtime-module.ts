/**
 * realtime-module.ts — live updates via Server-Sent Events, zero-dep. publish(channel, data)
 * from anywhere; clients subscribe at /api/realtime/[channel] (an EventSource in the browser).
 * In-memory fan-out (single instance); for multi-instance, swap the bus for Postgres
 * LISTEN/NOTIFY or Redis pub/sub (noted inline). Good for notifications, live feeds, presence.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const BUS = `// tiny in-process pub/sub. For multi-instance, back this with Postgres LISTEN/NOTIFY or Redis.
type Sub = (data: string) => void
const channels = new Map<string, Set<Sub>>()
export function subscribe(channel: string, fn: Sub): () => void {
  if (!channels.has(channel)) channels.set(channel, new Set())
  channels.get(channel)!.add(fn)
  return () => channels.get(channel)?.delete(fn)
}
export function publish(channel: string, data: unknown) {
  const payload = typeof data === "string" ? data : JSON.stringify(data)
  channels.get(channel)?.forEach((fn) => { try { fn(payload) } catch {} })
}
`

const SSE_ROUTE = `import { NextRequest } from "next/server"
import { subscribe } from "@/lib/realtime"
export const dynamic = "force-dynamic"
export async function GET(_req: NextRequest, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder()
      const send = (d: string) => controller.enqueue(enc.encode("data: " + d + "\\n\\n"))
      send(JSON.stringify({ type: "connected", channel }))
      const off = subscribe(channel, send)
      const ping = setInterval(() => controller.enqueue(enc.encode(": ping\\n\\n")), 25000)
      ;(controller as any)._cleanup = () => { clearInterval(ping); off() }
    },
    cancel() { (this as any)._cleanup?.() },
  })
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } })
}
`

export function deterministicRealtime(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /realtime|real-time|tiempo real|live|en vivo|chat|mensaje|message|presence|presencia|notif|feed|stream|colabor|multiplayer|websocket|sse/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/realtime.ts", content: BUS }, { path: "app/api/realtime/[channel]/route.ts", content: SSE_ROUTE }] }
}
