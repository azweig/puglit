/**
 * agent-module.ts — the JARVIS BRAIN (NanoClaw/OpenClaw pattern), injected as a reusable
 * "agent" module. It turns the omnichannel connectors into ONE AI assistant:
 *   - identity mapping: the same person is recognized across WhatsApp/Telegram/Slack/...
 *   - persistent memory: it recalls past interactions (long-term context)
 *   - a process loop: all inbound lands in channel_messages → think → reply → mark handled
 *
 * SECURITY (per the research, mandatory): the default brain is CONVERSATIONAL ONLY — it has no
 * tools that touch the DB/shell, so a malicious "ignore your instructions" message can't do
 * damage. When you give it real tools, run them in a per-session Docker sandbox (NanoClaw-style)
 * and NEVER expose central API credentials to the agent runtime.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const IDENTITY = `import { pool } from "@/lib/db"
// Map (channel, sender) → a unified contact, so WhatsApp + Telegram + Slack = the same person.
export async function resolveContact(channel: string, sender: string): Promise<number> {
  const e = await pool().query("SELECT contact_id FROM agent_identities WHERE channel=$1 AND sender=$2", [channel, sender])
  if (e.rows[0]) return e.rows[0].contact_id
  const c = await pool().query("INSERT INTO agent_contacts (display) VALUES ($1) RETURNING id", [sender])
  await pool().query("INSERT INTO agent_identities (channel, sender, contact_id) VALUES ($1,$2,$3)", [channel, sender, c.rows[0].id])
  return c.rows[0].id
}
/** Link another channel to a known contact (so the agent keeps the thread across channels). */
export async function linkIdentity(contactId: number, channel: string, sender: string) {
  await pool().query("INSERT INTO agent_identities (channel, sender, contact_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [channel, sender, contactId])
}
`

const MEMORY = `import { pool } from "@/lib/db"
// Persistent per-contact memory — the agent's long-term context (gets more valuable over time).
export async function remember(contactId: number, role: string, content: string) {
  await pool().query("INSERT INTO agent_memory (contact_id, role, content) VALUES ($1,$2,$3)", [contactId, role, content])
}
export async function recall(contactId: number, n = 12): Promise<{ role: string; content: string }[]> {
  const r = await pool().query("SELECT role, content FROM agent_memory WHERE contact_id=$1 ORDER BY created_at DESC LIMIT $2", [contactId, n])
  return r.rows.reverse()
}
`

const BRAIN = `import { pool } from "@/lib/db"
import { channels, startAll } from "@/lib/connectors"
import { resolveContact } from "./identity"
import { remember, recall } from "./memory"
// LLM via any OpenAI-compatible endpoint (Ollama local by default).
// env: AGENT_MODEL, AGENT_BASE_URL, AGENT_API_KEY, AGENT_SYSTEM
const SYSTEM = process.env.AGENT_SYSTEM || "You are a proactive personal assistant. Be concise, helpful, and tell the user what to do next."
async function think(history: { role: string; content: string }[]): Promise<string> {
  const base = (process.env.AGENT_BASE_URL || "http://localhost:11434/v1").replace(/\\/$/, "")
  try {
    const r = await fetch(\`\${base}/chat/completions\`, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.AGENT_API_KEY ? { Authorization: "Bearer " + process.env.AGENT_API_KEY } : {}) }, body: JSON.stringify({ model: process.env.AGENT_MODEL || "qwen2.5-coder:32b", messages: [{ role: "system", content: SYSTEM }, ...history], temperature: 0.5 }) }).then((x) => x.json())
    return r?.choices?.[0]?.message?.content || "(sin respuesta)"
  } catch (e) { console.error("[agent] think", (e as Error).message); return "" }
}
/** Start the JARVIS brain: persist all inbound, then process unhandled → think → reply. */
export async function startAgent() {
  await startAll(async (m) => { await pool().query("INSERT INTO channel_messages (channel, sender, body) VALUES ($1,$2,$3)", [m.channel, m.from, m.text]).catch(() => {}) })
  const tick = async () => {
    try {
      const { rows } = await pool().query("SELECT id, channel, sender, body FROM channel_messages WHERE direction='in' AND handled=false ORDER BY created_at LIMIT 5")
      for (const r of rows) {
        const contactId = await resolveContact(r.channel, r.sender)
        await remember(contactId, "user", r.body)
        const reply = await think(await recall(contactId))
        if (reply) { await remember(contactId, "assistant", reply); const ch = channels.find((c) => c.name === r.channel); if (ch) await ch.send(r.sender, reply) }
        await pool().query("UPDATE channel_messages SET handled=true WHERE id=$1", [r.id])
      }
    } catch (e) { console.error("[agent] loop", (e as Error).message) }
    setTimeout(tick, 3000)
  }
  tick()
}
`

const AGENT_SQL = `CREATE TABLE IF NOT EXISTS agent_contacts (
  id BIGSERIAL PRIMARY KEY,
  display TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS agent_identities (
  channel    VARCHAR(16) NOT NULL,
  sender     TEXT NOT NULL,
  contact_id BIGINT NOT NULL REFERENCES agent_contacts(id),
  PRIMARY KEY (channel, sender)
);
CREATE TABLE IF NOT EXISTS agent_memory (
  id BIGSERIAL PRIMARY KEY,
  contact_id BIGINT NOT NULL REFERENCES agent_contacts(id),
  role    VARCHAR(12) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_memory ON agent_memory(contact_id, created_at DESC);`

/** Inject the agent brain when the product is an AI assistant / chief-of-staff / bot. */
export function deterministicAgent(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary}`.toLowerCase()
  const wants = /asistente|assistant|chief of staff|jarvis|copilot|agente de ia|ai agent|chatbot|\bbot\b|second brain/.test(hay)
  if (!wants) return null
  return {
    files: [
      { path: "lib/agent/identity.ts", content: IDENTITY },
      { path: "lib/agent/memory.ts", content: MEMORY },
      { path: "lib/agent/brain.ts", content: BRAIN },
    ],
    extraSql: AGENT_SQL,
  }
}
