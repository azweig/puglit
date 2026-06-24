/**
 * Puglit web — openai.ts (multi-provider LLM client)
 * ONE chokepoint for every agent's "brain". Provider-agnostic by design: the open-source
 * default runs 100% LOCAL on Ollama + Gemma (no key, no cost), and you can BYOK to OpenAI,
 * Gemini, Anthropic/Claude, or ANY OpenAI-compatible endpoint (OpenRouter, Together, vLLM,
 * DeepSeek…) — exactly like this CLI. Open-weight models (Gemma, Hermes, DeepSeek, Qwen,
 * Llama…) are just MODEL NAMES under the `ollama`/`custom` providers, not separate providers.
 *
 * Two protocols cover everything: `openai` (OpenAI/Gemini/Ollama/custom — same shape) and
 * `anthropic` (Claude's Messages API — the only different one, handled by an adapter).
 *
 * MODEL TIERS — not every agent needs the same brain. You can even MIX providers per tier
 * (e.g. premium→Claude for the blueprint, cheap→local Gemma for extraction) via env.
 */

import { traceCall, traceTokens } from "@/lib/run-trace"

// #14 prompt cache: dedup IDENTICAL low-temperature calls within a process (same model+messages+schema)
// — never cache high-temp calls, which must stay diverse (the tournament's 3 teams). Bounded LRU.
const _cache = new Map<string, string>()
function cacheKey(model: string, messages: ChatMessage[], opts: { json?: boolean; schema?: object }): string {
  return `${model}|${opts.json ? 1 : 0}|${opts.schema ? JSON.stringify(opts.schema).length : 0}|${JSON.stringify(messages)}`
}

// ── Providers ────────────────────────────────────────────────────────────────
type Protocol = "openai" | "anthropic"
interface ProviderDef { protocol: Protocol; baseURL: string; supportsJsonMode: boolean; supportsVision: boolean; needsKey: boolean }

const PROVIDERS: Record<string, ProviderDef> = {
  ollama:    { protocol: "openai",    baseURL: "http://localhost:11434/v1",                          supportsJsonMode: true,  supportsVision: false, needsKey: false },
  openai:    { protocol: "openai",    baseURL: "https://api.openai.com/v1",                          supportsJsonMode: true,  supportsVision: true,  needsKey: true },
  gemini:    { protocol: "openai",    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai", supportsJsonMode: true, supportsVision: true, needsKey: true },
  anthropic: { protocol: "anthropic", baseURL: "https://api.anthropic.com/v1",                       supportsJsonMode: false, supportsVision: true,  needsKey: true },
  custom:    { protocol: "openai",    baseURL: "http://localhost:11434/v1",                          supportsJsonMode: true,  supportsVision: true,  needsKey: false },
}

/** Default provider resolution. Open-source clones with NOTHING configured run 100% local
 *  (Ollama + Gemma). An explicit PUGLIT_PROVIDER always wins. If a key/base-URL is present
 *  (e.g. a hosted deploy), honor it instead of forcing local — so existing deploys keep working. */
const DEFAULT_PROVIDER = (
  process.env.PUGLIT_PROVIDER ||
  (process.env.OPENAI_BASE_URL ? "custom"
    : process.env.OPENAI_API_KEY ? "openai"
    : process.env.ANTHROPIC_API_KEY ? "anthropic"
    : process.env.GEMINI_API_KEY ? "gemini"
    : "ollama")
).toLowerCase()

/** Sensible per-provider model defaults (all overridable per tier via PUGLIT_MODEL_*).
 *  `code` is a dedicated lane for code generation/repair — a coder model when local. */
function providerModels(p: string): { premium: string; balanced: string; cheap: string; code: string } {
  switch (p) {
    case "openai":    return { premium: "gpt-5.5", balanced: "gpt-5.4", cheap: "gpt-5.4-mini", code: "gpt-5.5" }
    case "gemini":    return { premium: "gemini-2.5-pro", balanced: "gemini-2.5-flash", cheap: "gemini-2.5-flash-lite", code: "gemini-2.5-pro" }
    case "anthropic": return { premium: "claude-opus-4-8", balanced: "claude-sonnet-4-6", cheap: "claude-haiku-4-5", code: "claude-sonnet-4-6" }
    default:          return { premium: "gemma2:27b", balanced: "gemma2", cheap: "gemma2:2b", code: "qwen2.5-coder:7b" } // ollama / custom
  }
}
const DEFAULTS = providerModels(DEFAULT_PROVIDER)
// A hung model call (ollama loading a model that never returns) would freeze the whole pipeline
// because a never-resolving fetch is not an "error". Abort after this long → the retry catch treats it
// as transient and retries. Generous (a cold 32B + long generation is fine); only catches true hangs.
const LLM_TIMEOUT_MS = Number(process.env.PUGLIT_LLM_TIMEOUT || 240000)

export const MODELS = {
  /** Architecture, blueprint, discovery, review — reasoning quality is decisive. */
  premium: process.env.PUGLIT_MODEL_PREMIUM || DEFAULTS.premium,
  /** Standard structured generation (specs, critics, seeds). */
  balanced: process.env.PUGLIT_MODEL_BALANCED || DEFAULTS.balanced,
  /** Mechanical / high-volume / low-stakes (extraction, normalization). */
  cheap: process.env.PUGLIT_MODEL_CHEAP || DEFAULTS.cheap,
  /** CODE generation + repair (routes, pages, shell, SQL, fixers) — a coder model when local. */
  code: process.env.PUGLIT_MODEL_CODE || DEFAULTS.code,
  /** VISION: reads reference images/screenshots/mockups (e.g. nvidia Nemotron-Nano-Omni). Empty = none. */
  vision: process.env.PUGLIT_MODEL_VISION || "",
} as const

export interface ChatMessage { role: "system" | "user" | "assistant"; content: unknown }

// ── Resolution (provider + base URL + key per call, with per-tier overrides) ──
function tierOf(model: string): "PREMIUM" | "BALANCED" | "CHEAP" | "CODE" | null {
  if (model === MODELS.code) return "CODE"
  if (model === MODELS.premium) return "PREMIUM"
  if (model === MODELS.balanced) return "BALANCED"
  if (model === MODELS.cheap) return "CHEAP"
  return null
}
interface Resolved { name: string; def: ProviderDef; baseURL: string; key: string }
function resolve(model: string): Resolved {
  const tier = tierOf(model)
  const name = ((tier && process.env[`PUGLIT_${tier}_PROVIDER`]) || DEFAULT_PROVIDER).toLowerCase()
  const def = PROVIDERS[name] || PROVIDERS.custom
  const baseURL = (
    (tier && process.env[`PUGLIT_${tier}_BASE_URL`]) ||
    process.env.PUGLIT_BASE_URL || process.env.OPENAI_BASE_URL || def.baseURL
  ).replace(/\/$/, "")
  const key =
    (tier && process.env[`PUGLIT_${tier}_API_KEY`]) ||
    (name === "anthropic" ? process.env.ANTHROPIC_API_KEY : name === "gemini" ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY) ||
    process.env.PUGLIT_API_KEY || ""
  return { name, def, baseURL, key }
}

export function aiConfigured(): boolean {
  // Local providers (Ollama / custom local) need no key; everything else needs one.
  const def = PROVIDERS[DEFAULT_PROVIDER] || PROVIDERS.custom
  if (!def.needsKey) return true
  return !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY || process.env.PUGLIT_API_KEY)
}

/** Whether the active premium provider can read images (gates the references/vision path).
 *  Override with PUGLIT_VISION=always|never (some Ollama models like llava/gemma3 do see). */
export function supportsVision(): boolean {
  const flag = process.env.PUGLIT_VISION
  if (flag === "always") return true
  if (flag === "never") return false
  if (MODELS.vision) return true // a dedicated vision model (Nemotron Omni / llava / gemma3) is configured
  return resolve(MODELS.premium).def.supportsVision
}

/** The model to use for image analysis — the dedicated vision model if set, else the premium model. */
export function visionModel(): string { return MODELS.vision || MODELS.premium }

/** Reasoning models reject a custom `temperature`; omit it for those. Anthropic clamps to 0-1. */
function wantsTemperature(model: string): boolean {
  const flag = process.env.PUGLIT_SEND_TEMPERATURE
  if (flag === "always") return true
  if (flag === "never") return false
  return !/^(gpt-5|o\d)/i.test(model)
}

// ── Anthropic adapter: convert OpenAI-style messages → Messages API ───────────
function toAnthropicContent(content: unknown): unknown {
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content.map((part: any) => {
      if (part?.type === "text") return { type: "text", text: part.text }
      if (part?.type === "image_url") {
        const url = String(part.image_url?.url || "")
        const m = url.match(/^data:([^;]+);base64,(.*)$/)
        if (m) return { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } }
        return { type: "image", source: { type: "url", url } }
      }
      return { type: "text", text: typeof part === "string" ? part : JSON.stringify(part) }
    })
  }
  return JSON.stringify(content)
}
async function callAnthropic(messages: ChatMessage[], opts: { model: string; temperature?: number }, r: Resolved): Promise<string> {
  const system = messages.filter((m) => m.role === "system").map((m) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content))).join("\n\n")
  const msgs = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: toAnthropicContent(m.content) }))
  const body: Record<string, unknown> = {
    model: opts.model,
    max_tokens: Number(process.env.PUGLIT_MAX_TOKENS) || 8192,
    messages: msgs.length ? msgs : [{ role: "user", content: "Continue." }],
    temperature: Math.max(0, Math.min(1, opts.temperature ?? 0.5)),
  }
  if (system) body.system = system
  const res = await fetch(`${r.baseURL}/messages`, {
    method: "POST",
    headers: { "x-api-key": r.key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`anthropic_${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`)
  const data = await res.json()
  const text = Array.isArray(data?.content) ? data.content.filter((b: any) => b?.type === "text").map((b: any) => b.text).join("") : ""
  if (!text) throw new Error("anthropic_empty")
  return String(text)
}

// ── Constrained decoding: is this an Ollama server? (native /api/chat + `format`) ──
function isOllama(r: Resolved): boolean {
  return r.name === "ollama" || /:11434(\b|\/)/.test(r.baseURL)
}
const allStrings = (messages: ChatMessage[]) => messages.every((m) => typeof m.content === "string")

/** Ollama NATIVE structured output: pass a JSON Schema in `format` so generation is
 *  grammar-constrained to valid JSON matching the schema — the reliable way to stop small
 *  local models emitting malformed/markdown-wrapped JSON. Uses /api/chat (not the /v1 shim). */
async function callOllamaSchema(messages: ChatMessage[], opts: { model: string; temperature?: number; schema: object }, r: Resolved): Promise<string> {
  const host = r.baseURL.replace(/\/v1\/?$/, "")
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: messages.map((m) => ({ role: m.role, content: String(m.content) })),
    stream: false,
    format: opts.schema,
    options: wantsTemperature(opts.model) ? { temperature: opts.temperature ?? 0.2 } : {},
  }
  const res = await fetch(`${host}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(LLM_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`ollama_${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`)
  const data = await res.json()
  const content = data?.message?.content
  if (!content) throw new Error("ollama_empty")
  return String(content)
}

// ── OpenAI-compatible (OpenAI / Gemini / Ollama / custom) ─────────────────────
async function callOpenAICompat(messages: ChatMessage[], opts: { model: string; temperature?: number; json?: boolean; schema?: object }, r: Resolved): Promise<string> {
  const body: Record<string, unknown> = { model: opts.model, messages }
  if (wantsTemperature(opts.model)) body.temperature = opts.temperature ?? 0.5
  // Real structured output when a schema is given (OpenAI/Gemini); else plain JSON mode.
  if (opts.schema && r.def.supportsJsonMode) body.response_format = { type: "json_schema", json_schema: { name: "out", schema: opts.schema, strict: true } }
  else if (opts.json && r.def.supportsJsonMode) body.response_format = { type: "json_object" }
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (r.key) headers.Authorization = `Bearer ${r.key}`
  const res = await fetch(`${r.baseURL}/chat/completions`, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(LLM_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`llm_${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`)
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error("llm_empty")
  return String(content)
}

async function call(messages: ChatMessage[], opts: { model: string; temperature?: number; json?: boolean; schema?: object }): Promise<string> {
  const r = resolve(opts.model)
  if (r.def.needsKey && !r.key) throw new Error("ai_not_configured")
  // #15 TOKEN BUDGET: a per-build hard cap (PUGLIT_BUILD_TOKEN_CAP) aborts a runaway build instead of
  // burning the whole budget. 0/unset = no cap.
  const CAP = Number(process.env.PUGLIT_BUILD_TOKEN_CAP || 0)
  if (CAP > 0 && traceTokens() > CAP) throw new Error("token_budget_exceeded")
  // #14 PROMPT CACHE: identical low-temperature calls return the cached result (never high-temp —
  // those must stay diverse for the 3-team tournament).
  const cacheable = (opts.temperature ?? 0) <= 0.2
  const key = cacheable ? cacheKey(opts.model, messages, opts) : ""
  if (key && _cache.has(key)) return _cache.get(key)!
  // PROFILE the run (agent-house idea): record one span per call — tier, prompt size, latency, ok.
  const started = Date.now()
  const promptChars = messages.reduce((n, m) => n + (typeof m.content === "string" ? m.content.length : JSON.stringify(m.content).length), 0)
  let out = "", ok = true
  // RESILIENCE: a transient Ollama hiccup (a fetch that fails mid model-swap / under load) must NOT
  // kill a whole build. Retry transient network errors with backoff before giving up.
  const RETRIES = Number(process.env.PUGLIT_LLM_RETRIES || 2)
  const transient = (e: unknown) => /fetch failed|ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up|network|timeout|EOF|aborted|50[234]|overloaded/i.test(String((e as Error)?.message || e))
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        if (r.def.protocol === "anthropic") out = await callAnthropic(messages, opts, r)
        else if (opts.schema && isOllama(r) && allStrings(messages)) out = await callOllamaSchema(messages, { ...opts, schema: opts.schema }, r)
        else out = await callOpenAICompat(messages, opts, r)
        if (key && out) { if (_cache.size > 500) _cache.clear(); _cache.set(key, out) }
        return out
      } catch (e) {
        if (attempt >= RETRIES || !transient(e)) throw e
        await new Promise((res) => setTimeout(res, 1500 * (attempt + 1))) // 1.5s, 3s backoff
      }
    }
  } catch (e) { ok = false; throw e }
  finally { try { traceCall({ tier: (tierOf(opts.model) || "other").toLowerCase(), model: opts.model, promptChars, outChars: out.length, ms: Date.now() - started, ok, json: !!opts.schema || !!opts.json }) } catch { /* never break a call to trace it */ } }
}

// ── Robust JSON (local/open models love to wrap JSON in prose or ```fences) ───
function parseLoose(s: string): unknown {
  let t = s.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
  try { return JSON.parse(t) } catch { /* fall through */ }
  const start = t.search(/[{[]/)
  const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"))
  if (start >= 0 && end > start) {
    try { return JSON.parse(t.slice(start, end + 1)) } catch { /* fall through */ }
  }
  throw new Error("json_parse_failed")
}

// ── Introspection (for the setup "doctor" — never leaks keys) ─────────────────
export function providerInfo() {
  const tier = (t: "PREMIUM" | "BALANCED" | "CHEAP" | "CODE", model: string) => {
    const r = resolve(model)
    return { tier: t.toLowerCase(), provider: r.name, model, baseURL: r.baseURL, protocol: r.def.protocol, hasKey: r.def.needsKey ? !!r.key : true, needsKey: r.def.needsKey }
  }
  return {
    defaultProvider: DEFAULT_PROVIDER,
    vision: supportsVision(),
    visionModel: MODELS.vision || null,
    configured: aiConfigured(),
    tiers: [tier("PREMIUM", MODELS.premium), tier("BALANCED", MODELS.balanced), tier("CHEAP", MODELS.cheap), tier("CODE", MODELS.code)],
  }
}

/** Tiny live check: can we actually reach the configured premium provider? */
export async function pingProvider(): Promise<{ ok: boolean; provider: string; model: string; error?: string }> {
  const model = MODELS.premium
  const r = resolve(model)
  try {
    const out = await call([{ role: "user", content: 'Reply with the single word: ok' }], { model, temperature: 0 })
    return { ok: /ok/i.test(out), provider: r.name, model }
  } catch (e) {
    return { ok: false, provider: r.name, model, error: (e as Error).message.slice(0, 160) }
  }
}

export async function chatText(messages: ChatMessage[], opts?: { model?: string; temperature?: number }): Promise<string> {
  return call(messages, { model: opts?.model || MODELS.balanced, temperature: opts?.temperature ?? 0.7 })
}

export async function chatJSON(messages: ChatMessage[], opts?: { model?: string; temperature?: number; schema?: object }): Promise<unknown> {
  const model = opts?.model || MODELS.balanced
  // When a JSON Schema is given, generation is grammar-constrained (Ollama native /
  // OpenAI json_schema) so the output is valid JSON by construction.
  const out = await call(messages, { model, temperature: opts?.temperature, json: true, schema: opts?.schema })
  try {
    return parseLoose(out)
  } catch {
    // One stricter retry — essential for weaker open models that ignored "JSON only".
    const retry = await call(
      [...messages, { role: "user", content: "Return ONLY valid minified JSON — no prose, no markdown, no code fences." }],
      { model, temperature: 0, json: true, schema: opts?.schema },
    )
    return parseLoose(retry)
  }
}
