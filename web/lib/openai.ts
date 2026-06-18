/**
 * Puglit web — openai.ts
 * Thin OpenAI chat client. JSON mode so structured steps always parse.
 *
 * MODEL TIERS — not every agent needs the same model. Deep reasoning / architecture /
 * visual design / code generation use the strongest model; mechanical extraction and
 * targeted fixes use a cheaper/faster one. All tiers below are chat-completions
 * compatible (support temperature + response_format json_object). Override per-env.
 */
export const MODELS = {
  /** Architecture, visual design, page/route code, discovery — quality is decisive. */
  premium: process.env.PUGLIT_MODEL_PREMIUM || "gpt-4.1",
  /** Standard structured generation (specs, critics, seeds, fixers). */
  balanced: process.env.PUGLIT_MODEL_BALANCED || "gpt-4o",
  /** Mechanical / high-volume / low-stakes (extraction, normalization). */
  cheap: process.env.PUGLIT_MODEL_CHEAP || "gpt-4.1-mini",
} as const

export interface ChatMessage { role: "system" | "user" | "assistant"; content: unknown }

export function aiConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}

export async function chatText(messages: ChatMessage[], opts?: { model?: string; temperature?: number }): Promise<string> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("ai_not_configured")
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: opts?.model || "gpt-4o", temperature: opts?.temperature ?? 0.7, messages }),
  })
  if (!res.ok) throw new Error(`openai_${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`)
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error("openai_empty")
  return String(content)
}

export async function chatJSON(messages: ChatMessage[], opts?: { model?: string; temperature?: number }): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("ai_not_configured")
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts?.model || MODELS.balanced,
      temperature: opts?.temperature ?? 0.5,
      response_format: { type: "json_object" },
      messages,
    }),
  })
  if (!res.ok) {
    throw new Error(`openai_${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error("openai_empty")
  return JSON.parse(content)
}
