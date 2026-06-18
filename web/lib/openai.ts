/**
 * Puglit web — openai.ts
 * Thin, PROVIDER-AGNOSTIC chat client (OpenAI-compatible). JSON mode so structured
 * steps always parse. Point it at any OpenAI-compatible endpoint via OPENAI_BASE_URL
 * (OpenAI, a self-hosted vLLM/Ollama, DeepSeek, etc.) so the engine is not married to
 * one vendor — the multi-agent CONCEPT is what matters, each agent picks its "brain".
 *
 * MODEL TIERS — not every agent needs the same brain. Deep reasoning / architecture /
 * visual design / code use the strongest model; mechanical extraction uses a cheaper one.
 * Defaults track OpenAI's current frontier (GPT-5.x; the GPT-4 family is legacy). Every
 * tier is overridable per-env, so swapping to Gemma/DeepSeek self-hosted is config-only.
 */
export const MODELS = {
  /** Architecture, visual design, page/route code, discovery, review — quality is decisive. */
  premium: process.env.PUGLIT_MODEL_PREMIUM || "gpt-5.5",
  /** Standard structured generation (specs, critics, seeds, fixers). */
  balanced: process.env.PUGLIT_MODEL_BALANCED || "gpt-5.4",
  /** Mechanical / high-volume / low-stakes (extraction, normalization). */
  cheap: process.env.PUGLIT_MODEL_CHEAP || "gpt-5.4-mini",
} as const

const BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")

export interface ChatMessage { role: "system" | "user" | "assistant"; content: unknown }

export function aiConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}

/** Reasoning models (GPT-5.x and most self-hosted reasoning checkpoints) reject a custom
 *  `temperature`; only the default is allowed. Omit it for those so the call doesn't 400.
 *  Override the heuristic with PUGLIT_SEND_TEMPERATURE=always|never. */
function wantsTemperature(model: string): boolean {
  const flag = process.env.PUGLIT_SEND_TEMPERATURE
  if (flag === "always") return true
  if (flag === "never") return false
  return !/^(gpt-5|o\d)/i.test(model) // gpt-5.x / o-series → omit; gpt-4o / self-hosted → send
}

async function call(messages: ChatMessage[], opts: { model: string; temperature?: number; json?: boolean }): Promise<string> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("ai_not_configured")
  const body: Record<string, unknown> = { model: opts.model, messages }
  if (wantsTemperature(opts.model)) body.temperature = opts.temperature ?? 0.5
  if (opts.json) body.response_format = { type: "json_object" }
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`openai_${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`)
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error("openai_empty")
  return String(content)
}

export async function chatText(messages: ChatMessage[], opts?: { model?: string; temperature?: number }): Promise<string> {
  return call(messages, { model: opts?.model || MODELS.balanced, temperature: opts?.temperature ?? 0.7 })
}

export async function chatJSON(messages: ChatMessage[], opts?: { model?: string; temperature?: number }): Promise<unknown> {
  const out = await call(messages, { model: opts?.model || MODELS.balanced, temperature: opts?.temperature, json: true })
  return JSON.parse(out)
}
