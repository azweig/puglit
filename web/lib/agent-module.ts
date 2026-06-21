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

const TOOLS = `import { pool } from "@/lib/db"
// Tools the agent can CALL (not just talk). Built-ins are SAFE: scoped to the contact's own
// data, no shell, no external creds → a prompt-injection can't do damage. Extend via MCP below.
export interface Tool { name: string; description: string; parameters: object; execute: (args: any, ctx: { contactId: number }) => Promise<string> }

export const builtinTools: Tool[] = [
  { name: "create_task", description: "Create a task / reminder for the user", parameters: { type: "object", properties: { title: { type: "string" }, due: { type: "string", description: "optional ISO date" } }, required: ["title"] },
    execute: async (a, ctx) => { await pool().query("INSERT INTO agent_tasks (contact_id, title, due) VALUES ($1,$2,$3)", [ctx.contactId, a.title, a.due || null]); return "✓ task: " + a.title } },
  { name: "list_tasks", description: "List the user's open tasks", parameters: { type: "object", properties: {} },
    execute: async (_a, ctx) => { const r = await pool().query("SELECT title, due FROM agent_tasks WHERE contact_id=$1 AND done=false ORDER BY created_at", [ctx.contactId]); return r.rows.map((t: any) => "- " + t.title + (t.due ? " (" + t.due + ")" : "")).join("\\n") || "No open tasks." } },
  { name: "complete_task", description: "Mark a task done by its title", parameters: { type: "object", properties: { title: { type: "string" } }, required: ["title"] },
    execute: async (a, ctx) => { await pool().query("UPDATE agent_tasks SET done=true WHERE contact_id=$1 AND title ILIKE $2", [ctx.contactId, "%" + a.title + "%"]); return "✓ done: " + a.title } },
  { name: "save_note", description: "Save a note to the user's second brain", parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
    execute: async (a, ctx) => { await pool().query("INSERT INTO agent_memory (contact_id, role, content) VALUES ($1,'note',$2)", [ctx.contactId, a.text]); return "✓ noted" } },
]

// MCP bridge — pull EXTRA tools (Calendar, Gmail, GitHub, LinkedIn…) from a self-hosted MCP
// server (Composio, Linked-API, etc.). ⚠️ These touch external systems: run the MCP server
// isolated, give it scoped creds, and don't expose dangerous tools to public-facing agents.
// env: MCP_URL (the server's HTTP endpoint), MCP_KEY
export async function mcpTools(): Promise<Tool[]> {
  const url = process.env.MCP_URL
  if (!url) return []
  try {
    const r = await fetch(url.replace(/\\/$/, "") + "/tools", { headers: process.env.MCP_KEY ? { Authorization: "Bearer " + process.env.MCP_KEY } : {} }).then((x) => x.json())
    return (r.tools || []).map((t: any) => ({ name: t.name, description: t.description, parameters: t.parameters || { type: "object", properties: {} },
      execute: async (args: any) => { const res = await fetch(url.replace(/\\/$/, "") + "/call", { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.MCP_KEY ? { Authorization: "Bearer " + process.env.MCP_KEY } : {}) }, body: JSON.stringify({ name: t.name, arguments: args }) }).then((x) => x.json()); return typeof res === "string" ? res : JSON.stringify(res) } }))
  } catch (e) { console.error("[mcp]", (e as Error).message); return [] }
}
export async function allTools(): Promise<Tool[]> { return [...builtinTools, ...(await mcpTools().catch(() => []))] }
`

const BRAIN = `import { pool } from "@/lib/db"
import { channels, startAll } from "@/lib/connectors"
import { resolveContact } from "./identity"
import { remember, recall } from "./memory"
import { allTools } from "./tools"
// LLM via any OpenAI-compatible endpoint (Ollama local by default).
// env: AGENT_MODEL, AGENT_BASE_URL, AGENT_API_KEY, AGENT_SYSTEM
const SYSTEM = process.env.AGENT_SYSTEM || "You are a proactive personal Chief of Staff. Be concise. When the user implies an action (a task, reminder, note), USE the matching tool — don't just acknowledge. Tell them what you did + what's next."
async function llm(messages: any[], toolDefs: any[]) {
  const base = (process.env.AGENT_BASE_URL || "http://localhost:11434/v1").replace(/\\/$/, "")
  return fetch(\`\${base}/chat/completions\`, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.AGENT_API_KEY ? { Authorization: "Bearer " + process.env.AGENT_API_KEY } : {}) }, body: JSON.stringify({ model: process.env.AGENT_MODEL || "qwen2.5-coder:32b", messages, tools: toolDefs.length ? toolDefs : undefined, temperature: 0.4 }) }).then((x) => x.json())
}
/** Think WITH tools: the LLM can call create_task/list_tasks/save_note/… (and MCP tools). */
async function think(history: { role: string; content: string }[], contactId: number): Promise<string> {
  const tools = await allTools()
  const toolDefs = tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parameters } }))
  const messages: any[] = [{ role: "system", content: SYSTEM }, ...history]
  for (let i = 0; i < 4; i++) {
    let r
    try { r = await llm(messages, toolDefs) } catch (e) { console.error("[agent] llm", (e as Error).message); return "" }
    const msg = r?.choices?.[0]?.message
    if (!msg) return ""
    if (msg.tool_calls?.length) {
      messages.push(msg)
      for (const tc of msg.tool_calls) {
        const tool = tools.find((t) => t.name === tc.function?.name)
        let result = "unknown tool"
        try { const args = JSON.parse(tc.function?.arguments || "{}"); result = tool ? await tool.execute(args, { contactId }) : result } catch (e) { result = "error: " + (e as Error).message }
        messages.push({ role: "tool", tool_call_id: tc.id, content: String(result) })
      }
      continue // feed tool results back to the LLM
    }
    return msg.content || ""
  }
  return "(too many steps)"
}
/** Start the JARVIS brain: persist all inbound, then process unhandled → think (w/ tools) → reply. */
export async function startAgent() {
  await startAll(async (m) => { await pool().query("INSERT INTO channel_messages (channel, sender, body) VALUES ($1,$2,$3)", [m.channel, m.from, m.text]).catch(() => {}) })
  const tick = async () => {
    try {
      const { rows } = await pool().query("SELECT id, channel, sender, body FROM channel_messages WHERE direction='in' AND handled=false ORDER BY created_at LIMIT 5")
      for (const r of rows) {
        const contactId = await resolveContact(r.channel, r.sender)
        await remember(contactId, "user", r.body)
        const reply = await think(await recall(contactId), contactId)
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
CREATE INDEX IF NOT EXISTS idx_agent_memory ON agent_memory(contact_id, created_at DESC);
CREATE TABLE IF NOT EXISTS agent_tasks (
  id BIGSERIAL PRIMARY KEY,
  contact_id BIGINT NOT NULL REFERENCES agent_contacts(id),
  title TEXT NOT NULL,
  due    TEXT,
  done   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`

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
      { path: "lib/agent/tools.ts", content: TOOLS },
      { path: "lib/agent/brain.ts", content: BRAIN },
    ],
    extraSql: AGENT_SQL,
  }
}
