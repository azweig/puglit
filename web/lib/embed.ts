/**
 * embed.ts — text embeddings + cosine, to retrieve the RIGHT diary lessons for the current
 * task (semantic relevance) instead of just the most RECENT ones. This is the lightweight
 * "structured genes" retrieval we chose over a heavy vector index (TurboVec) — at our scale
 * (hundreds of lessons) an in-memory cosine is simpler, zero-dep and plenty fast.
 *
 * Uses an OpenAI-compatible /v1/embeddings endpoint: locally Ollama's `nomic-embed-text`
 * (free — `ollama pull nomic-embed-text`), or OpenAI text-embedding-3-small (BYOK). ALWAYS
 * graceful: null on any failure → callers fall back to recency.
 *
 * Env: PUGLIT_EMBED_MODEL (default nomic-embed-text), PUGLIT_EMBED_URL, PUGLIT_EMBED_KEY.
 */
export async function embed(text: string): Promise<number[] | null> {
  const base = (process.env.PUGLIT_EMBED_URL || process.env.PUGLIT_BASE_URL || process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1").replace(/\/$/, "")
  const model = process.env.PUGLIT_EMBED_MODEL || "nomic-embed-text"
  const key = process.env.PUGLIT_EMBED_KEY || process.env.OPENAI_API_KEY || ""
  try {
    const res = await fetch(`${base}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify({ model, input: text.slice(0, 2000) }),
    })
    if (!res.ok) return null
    const d = await res.json()
    const v = d?.data?.[0]?.embedding
    return Array.isArray(v) && v.length ? (v as number[]) : null
  } catch { return null }
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0
}
