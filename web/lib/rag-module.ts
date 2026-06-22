/**
 * rag-module.ts — semantic search & retrieval-augmented generation with pgvector (Postgres-native,
 * no extra infra). indexDoc(text) embeds + stores; search(query) returns the nearest chunks;
 * ask(question) does RAG (retrieve → answer with the llm module). Embeddings via an OpenAI-compatible
 * endpoint (Ollama nomic-embed-text by default, free). env: EMBED_BASE_URL, EMBED_MODEL.
 * Requires the pgvector extension (the SQL enables it).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const RAG = `import { pool } from "@/lib/db"
const cfg = () => ({ base: (process.env.EMBED_BASE_URL || process.env.LLM_BASE_URL || "http://localhost:11434/v1").replace(/\\/$/, ""), model: process.env.EMBED_MODEL || "nomic-embed-text", key: process.env.LLM_API_KEY || "" })

async function embed(text: string): Promise<number[] | null> {
  const { base, model, key } = cfg()
  try {
    const r = await fetch(\`\${base}/embeddings\`, { method: "POST", headers: { "Content-Type": "application/json", ...(key ? { Authorization: "Bearer " + key } : {}) }, body: JSON.stringify({ model, input: text }) }).then((x) => x.json())
    return r?.data?.[0]?.embedding || null
  } catch (e) { console.error("[rag] embed", (e as Error).message); return null }
}
const vec = (e: number[]) => "[" + e.join(",") + "]"

/** Store a document chunk + its embedding. Returns the row id (or null). */
export async function indexDoc(content: string, metadata: Record<string, unknown> = {}, source = ""): Promise<number | null> {
  const e = await embed(content)
  if (!e) return null
  const { rows } = await pool.query("INSERT INTO rag_documents (content, metadata, source, embedding) VALUES ($1,$2,$3,$4::vector) RETURNING id", [content, JSON.stringify(metadata), source, vec(e)])
  return rows[0]?.id ?? null
}

/** Nearest-neighbour search (cosine). Returns the top-k chunks. */
export async function search(query: string, k = 5): Promise<{ content: string; source: string; score: number }[]> {
  const e = await embed(query)
  if (!e) return []
  const { rows } = await pool.query("SELECT content, source, 1 - (embedding <=> $1::vector) AS score FROM rag_documents ORDER BY embedding <=> $1::vector LIMIT $2", [vec(e), k])
  return rows
}

/** RAG answer — retrieve context, then answer with the llm module (import it where used). */
export async function buildRagPrompt(question: string, k = 5): Promise<string> {
  const ctx = (await search(question, k)).map((r, i) => \`[\${i + 1}] \${r.content}\`).join("\\n\\n")
  return \`Answer using ONLY this context. If it's not there, say you don't know.\\n\\nCONTEXT:\\n\${ctx}\\n\\nQUESTION: \${question}\`
}
`

// GUARDED: if pgvector isn't installed, skip the RAG store instead of aborting the whole app.sql
// (CREATE EXTENSION + the vector(768) column both need pgvector). The rest of the schema loads fine.
const RAG_SQL = `DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE TABLE IF NOT EXISTS rag_documents (
    id BIGSERIAL PRIMARY KEY, content TEXT NOT NULL, metadata JSONB DEFAULT '{}', source TEXT,
    embedding vector(768), created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_rag_embedding ON rag_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pgvector unavailable — RAG store skipped (install postgresql-XX-pgvector to enable)'; END $$;`

export function deterministicRag(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  const wants = /rag|semantic|sem[aá]ntic|embedding|vector|knowledge|conocimiento|docs|documentos|preguntale|ask your|chat with|q&a|faq|search.*ai|busqueda inteligente|similar|recomend|recommend/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/rag.ts", content: RAG }], extraSql: RAG_SQL }
}
