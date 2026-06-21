/**
 * compress-module.ts — trim text / logs / RAG chunks BEFORE they hit the LLM (inspired by
 * chopratejas/headroom): fewer tokens = lower cost + latency + more room for what matters. Zero-dep
 * heuristics (dedupe, strip noise, middle-truncate, rank chunks). For aggressive semantic
 * compression, summarize with the llm module. Useful in-app AND for the swarm's own LLM calls.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const COMPRESS = `const TOK = (s: string) => Math.ceil(s.length / 4) // rough token estimate

/** Strip noise + dedupe lines + collapse whitespace. Lossless-ish. */
export function compressText(text: string): string {
  const seen = new Set<string>()
  const lines = text.split("\\n").map((l) => l.replace(/\\s+/g, " ").trim()).filter((l) => {
    if (!l) return false
    const k = l.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true
  })
  return lines.join("\\n")
}

/** Keep the head + tail, drop the middle when over maxTokens (preserves context + recency). */
export function clampTokens(text: string, maxTokens: number): string {
  const t = compressText(text)
  if (TOK(t) <= maxTokens) return t
  const maxChars = maxTokens * 4
  const head = Math.floor(maxChars * 0.6), tail = maxChars - head
  return t.slice(0, head) + "\\n…[" + (TOK(t) - maxTokens) + " tokens trimmed]…\\n" + t.slice(-tail)
}

/** Rank + cap RAG chunks to a token budget (keeps the most relevant by a score fn or order). */
export function packChunks(chunks: string[], maxTokens: number): string {
  const out: string[] = []
  let used = 0
  for (const c of chunks) { const c2 = compressText(c); const t = TOK(c2); if (used + t > maxTokens) break; out.push(c2); used += t }
  return out.join("\\n\\n---\\n\\n")
}
`

export function deterministicCompress(config: DomainConfig, bp: Blueprint): { files: AppFile[] } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary}`.toLowerCase()
  const wants = /\bllm\b|\bai\b|\bia\b|token|context|rag|prompt|chatbot|asistente|assistant|summar|resum|gpt|inteligencia artificial/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/compress.ts", content: COMPRESS }] }
}
