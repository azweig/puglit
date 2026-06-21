/**
 * connectors.ts — reusable messaging/email CHANNEL components the swarm injects into a
 * generated app. WhatsApp talks to a self-hosted OpenWA gateway over HTTP (no heavy deps in
 * the app); email is universal IMAP+SMTP; Telegram is zero-dep. One Channel interface for all.
 * generated app (the same pattern as deterministicGeo): when a product needs WhatsApp, email
 * or Telegram, we drop in a pre-built, battle-tested connector instead of letting the agents
 * reinvent it. All share ONE interface (Channel) so a JARVIS-class app just iterates over
 * `channels`. Credentials are BYO via env (never generated).
 *
 * The connector code is stored as strings (like the other deterministic components) so it
 * ships verbatim into the generated project's lib/connectors/ — no main-app deps needed.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const TYPES = `// Uniform channel interface — every connector implements this, so an app can treat
// WhatsApp / email / Telegram identically (a JARVIS-style "omnichannel inbox").
export interface IncomingMessage {
  channel: "whatsapp" | "email" | "telegram"
  from: string
  text: string
  subject?: string
  ts: number
  raw?: unknown
}
export interface Channel {
  name: string
  /** Start listening; calls onMessage for every inbound message. */
  start(onMessage: (m: IncomingMessage) => void | Promise<void>): Promise<void>
  /** Send a message to a recipient (chat id / phone / email). */
  send(to: string, text: string, opts?: { subject?: string }): Promise<void>
  stop?(): Promise<void>
}
`

// Telegram — zero deps (raw Bot API over fetch + long polling). env: TELEGRAM_BOT_TOKEN
const TELEGRAM = `import type { Channel } from "./types"
const API = "https://api.telegram.org/bot"
export const telegramChannel: Channel = {
  name: "telegram",
  async start(onMessage) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) { console.warn("[telegram] set TELEGRAM_BOT_TOKEN"); return }
    let offset = 0
    const poll = async () => {
      try {
        const r = await fetch(\`\${API}\${token}/getUpdates?timeout=30&offset=\${offset}\`).then((x) => x.json())
        for (const u of r.result || []) {
          offset = u.update_id + 1
          const m = u.message
          if (m?.text) await onMessage({ channel: "telegram", from: String(m.chat.id), text: m.text, ts: m.date * 1000, raw: u })
        }
      } catch (e) { console.error("[telegram]", (e as Error).message) }
      setTimeout(poll, 1000)
    }
    poll()
  },
  async send(to, text) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    await fetch(\`\${API}\${token}/sendMessage\`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: to, text }) })
  },
}
`

// Email — UNIVERSAL (Gmail / Outlook / Fastmail / any IMAP+SMTP). deps: imapflow, nodemailer
// env: EMAIL_USER, EMAIL_PASS, IMAP_HOST, IMAP_PORT(993), SMTP_HOST, SMTP_PORT(465)
const EMAIL = `import { ImapFlow } from "imapflow"
import nodemailer from "nodemailer"
import type { Channel } from "./types"
// Provider-agnostic: Gmail needs an App Password; Outlook/Fastmail/custom just need host+port.
export const emailChannel: Channel = {
  name: "email",
  async start(onMessage) {
    const { EMAIL_USER, EMAIL_PASS, IMAP_HOST, IMAP_PORT } = process.env
    if (!EMAIL_USER || !EMAIL_PASS || !IMAP_HOST) { console.warn("[email] set EMAIL_USER/EMAIL_PASS/IMAP_HOST"); return }
    const poll = async () => {
      const client = new ImapFlow({ host: IMAP_HOST, port: Number(IMAP_PORT || 993), secure: true, auth: { user: EMAIL_USER, pass: EMAIL_PASS }, logger: false })
      try {
        await client.connect()
        const lock = await client.getMailboxLock("INBOX")
        try {
          for await (const msg of client.fetch({ seen: false }, { envelope: true, source: true })) {
            const text = (msg.source?.toString() || "").slice(0, 8000)
            await onMessage({ channel: "email", from: msg.envelope?.from?.[0]?.address || "", subject: msg.envelope?.subject || "", text, ts: (msg.envelope?.date || new Date()).getTime(), raw: msg })
            await client.messageFlagsAdd(msg.uid, ["\\\\Seen"], { uid: true })
          }
        } finally { lock.release() }
      } catch (e) { console.error("[email]", (e as Error).message) } finally { try { await client.logout() } catch {} }
      setTimeout(poll, 15000)
    }
    poll()
  },
  async send(to, text, opts) {
    const { EMAIL_USER, EMAIL_PASS, SMTP_HOST, SMTP_PORT } = process.env
    const t = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT || 465), secure: true, auth: { user: EMAIL_USER, pass: EMAIL_PASS } })
    await t.sendMail({ from: EMAIL_USER, to, subject: opts?.subject || "(sin asunto)", text })
  },
}
`

// WhatsApp — via the self-hosted OpenWA gateway (github.com/rmyndharis/OpenWA), a separate
// Docker service exposing a REST API + webhooks. Our app is a thin HTTP client → ZERO heavy
// deps (the puppeteer/chromium engine runs in OpenWA's container, not here). Incoming messages
// arrive via the webhook route below. env: OPENWA_URL, OPENWA_KEY, OPENWA_SESSION, PUBLIC_URL
const WHATSAPP = `import type { Channel } from "./types"
const base = () => (process.env.OPENWA_URL || "http://localhost:3001").replace(/\\/$/, "")
const headers = () => ({ "X-API-Key": process.env.OPENWA_KEY || "", "Content-Type": "application/json" })
const session = () => process.env.OPENWA_SESSION || "default"
export const whatsappChannel: Channel = {
  name: "whatsapp",
  async start() {
    // tell OpenWA to push incoming messages to our webhook route. (Scan the QR once via OpenWA.)
    const pub = process.env.PUBLIC_URL
    if (!pub) { console.warn("[whatsapp] set PUBLIC_URL so OpenWA can push to /api/connectors/whatsapp/webhook"); return }
    await fetch(\`\${base()}/api/sessions/\${session()}/webhooks\`, { method: "POST", headers: headers(), body: JSON.stringify({ url: pub.replace(/\\/$/, "") + "/api/connectors/whatsapp/webhook", events: ["message.received"] }) }).catch((e) => console.error("[whatsapp]", e))
  },
  async send(to, text) {
    const chatId = to.includes("@") ? to : to + "@c.us"
    await fetch(\`\${base()}/api/sessions/\${session()}/messages/send-text\`, { method: "POST", headers: headers(), body: JSON.stringify({ chatId, text }) })
  },
}
`

// Webhook receiver for OpenWA → persists inbound WhatsApp messages to the omnichannel inbox.
const WA_WEBHOOK = `import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
// OpenWA posts here on message.received (configure PUBLIC_URL). Shape: { data: { from, body } }.
export async function POST(req: NextRequest) {
  try {
    const e = await req.json()
    const m = e?.data || e?.payload || e?.message || e
    const from = m?.from || m?.chatId || ""
    const body = m?.body || m?.text || ""
    if (from && body) await pool().query("INSERT INTO channel_messages (channel, sender, body) VALUES ('whatsapp', $1, $2)", [from, body])
  } catch (err) { console.error("[whatsapp webhook]", err) }
  return NextResponse.json({ ok: true })
}
`

/** Unified inbox table — every channel's messages land here (omnichannel). */
const MESSAGES_SQL = `CREATE TABLE IF NOT EXISTS channel_messages (
  id BIGSERIAL PRIMARY KEY,
  channel    VARCHAR(16) NOT NULL,        -- whatsapp | email | telegram
  sender     TEXT NOT NULL,
  subject    TEXT,
  body       TEXT,
  direction  VARCHAR(4) NOT NULL DEFAULT 'in', -- in | out
  handled    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_channel_messages_recent ON channel_messages(created_at DESC);`

/**
 * Detect whether the product needs messaging/email channels and, if so, inject the matching
 * pre-built connectors + a unified inbox table + the npm deps. Reused by the swarm so it never
 * regenerates an IMAP/WhatsApp/Telegram client by hand.
 */
export function deterministicConnectors(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string; deps: Record<string, string> } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wantsWA = /whatsapp|wpp|wa[\s_-]?bot|openwa/.test(hay)
  const wantsEmail = /email|e-mail|correo|mail|imap|smtp|gmail|outlook|bandeja|inbox/.test(hay)
  const wantsTg = /telegram/.test(hay)
  // a generic "messaging / assistant / notifications / chief of staff" product → give all 3
  const wantsAll = /mensajer|messaging|asistente|assistant|chief of staff|jarvis|omnichannel|notif/.test(hay)
  const wa = wantsWA || wantsAll, em = wantsEmail || wantsAll, tg = wantsTg || wantsAll
  if (!wa && !em && !tg) return null

  const files: AppFile[] = [{ path: "lib/connectors/types.ts", content: TYPES }]
  const deps: Record<string, string> = {}
  const imports: string[] = []
  const list: string[] = []
  if (wa) {
    // WhatsApp = thin HTTP client to the OpenWA gateway (separate Docker service) → no heavy
    // deps in the app. Plus the webhook route that receives inbound messages.
    files.push({ path: "lib/connectors/whatsapp.ts", content: WHATSAPP })
    files.push({ path: "app/api/connectors/whatsapp/webhook/route.ts", content: WA_WEBHOOK })
    imports.push(`import { whatsappChannel } from "./whatsapp"`); list.push("whatsappChannel")
  }
  if (em) { files.push({ path: "lib/connectors/email.ts", content: EMAIL }); deps["imapflow"] = "^1.0.171"; deps["nodemailer"] = "^6.9.14"; imports.push(`import { emailChannel } from "./email"`); list.push("emailChannel") }
  if (tg) { files.push({ path: "lib/connectors/telegram.ts", content: TELEGRAM }); imports.push(`import { telegramChannel } from "./telegram"`); list.push("telegramChannel") }

  // index that wires the included channels into one array + a startAll() helper
  files.push({
    path: "lib/connectors/index.ts",
    content: `import type { Channel, IncomingMessage } from "./types"\n${imports.join("\n")}\nexport type { Channel, IncomingMessage }\nexport const channels: Channel[] = [${list.join(", ")}]\n/** Start every channel; each inbound message is persisted to channel_messages + handed to onMessage. */\nexport async function startAll(onMessage: (m: IncomingMessage) => void | Promise<void>) {\n  await Promise.all(channels.map((c) => c.start(onMessage).catch((e) => console.error("[" + c.name + "]", e))))\n}\n`,
  })
  return { files, extraSql: MESSAGES_SQL, deps }
}
