/**
 * llm-module.ts — a generic AI client so ANY generated app can add intelligence: chat, classify,
 * summarize, structured extraction. OpenAI-compatible → Ollama local (free) by default, or any
 * provider. Zero-dep (fetch). env: LLM_BASE_URL, LLM_MODEL, LLM_API_KEY.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const LLM = `const cfg = () => ({ base: (process.env.LLM_BASE_URL || "http://localhost:11434/v1").replace(/\\/$/, ""), model: process.env.LLM_MODEL || "qwen2.5-coder:32b", key: process.env.LLM_API_KEY || "" })
type Msg = { role: "system" | "user" | "assistant"; content: string }

/** Chat completion. Pass messages or a single prompt. */
export async function chat(input: string | Msg[], opts?: { system?: string; temperature?: number }): Promise<string> {
  const { base, model, key } = cfg()
  const messages: Msg[] = typeof input === "string" ? [...(opts?.system ? [{ role: "system" as const, content: opts.system }] : []), { role: "user", content: input }] : input
  try {
    const r = await fetch(\`\${base}/chat/completions\`, { method: "POST", headers: { "Content-Type": "application/json", ...(key ? { Authorization: "Bearer " + key } : {}) }, body: JSON.stringify({ model, messages, temperature: opts?.temperature ?? 0.4 }) }).then((x) => x.json())
    return r?.choices?.[0]?.message?.content || ""
  } catch (e) { console.error("[llm]", (e as Error).message); return "" }
}

/** Structured JSON extraction — describe the shape, get a parsed object. */
export async function extractJSON<T = any>(prompt: string, shapeHint?: string): Promise<T | null> {
  const out = await chat(prompt + (shapeHint ? "\\n\\nReturn ONLY JSON: " + shapeHint : "\\n\\nReturn ONLY valid JSON."), { temperature: 0 })
  try { return JSON.parse(out.replace(/\\\`\\\`\\\`json?|\\\`\\\`\\\`/g, "").trim()) } catch { return null }
}

/** Classify text into one of the labels. */
export async function classify(text: string, labels: string[]): Promise<string> {
  const out = await chat(\`Classify this text into exactly one label from [\${labels.join(", ")}]. Text: """\${text}""". Answer with ONLY the label.\`, { temperature: 0 })
  return labels.find((l) => out.toLowerCase().includes(l.toLowerCase())) || labels[0]
}

/** Summarize text to ~n sentences. */
export async function summarize(text: string, sentences = 3): Promise<string> {
  return chat(\`Summarize in \${sentences} sentences:\\n\\n\${text}\`, { temperature: 0.3 })
}
`

export function llmFiles(): { files: AppFile[] } { return { files: [{ path: "lib/llm.ts", content: LLM }] } }
export function deterministicLlm(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /\bai\b|\bia\b|gpt|llm|inteligencia artificial|chatbot|asistente|assistant|generat|resum|summar|clasific|classif|recomend|recommend|smart|inteligente|analiza|sentiment|moderat/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/llm.ts", content: LLM }] }
}
