/**
 * graphify-module.ts — turn ANY input into a knowledge graph (the "graphify" capability). The LLM
 * extracts entities + (subject, relation, object) triples from text/docs and stores them in the
 * knowledge graph (kg_nodes/kg_edges — the memorygraph schema). Pairs with docparse (file→text),
 * memorygraph (query the graph) and rag. env: LLM_BASE_URL/MODEL. The brain's ingestion layer.
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"
type AppFile = { path: string; content: string }

const GRAPHIFY = `import { pool } from "@/lib/db"
/** Extract a knowledge graph from text and persist it. Returns counts. */
export async function graphify(text: string, source = ""): Promise<{ entities: number; relations: number }> {
  let triples: { s: string; r: string; o: string }[] = []
  try {
    const { extractJSON } = await import("@/lib/llm")
    const out = await extractJSON<{ triples: { s: string; r: string; o: string }[] }>(
      \`Extract a knowledge graph from this text as (subject, relation, object) triples — concrete entities + how they relate. Text: """\${text.slice(0, 6000)}"""\`,
      '{ "triples": [{ "s": "entity", "r": "relation", "o": "entity" }] }')
    triples = (out?.triples || []).filter((t) => t && t.s && t.r && t.o)
  } catch (e) { console.error("[graphify]", (e as Error).message); return { entities: 0, relations: 0 } }
  const ent = new Set<string>()
  for (const t of triples) {
    ent.add(t.s); ent.add(t.o)
    const s = (await pool.query("INSERT INTO kg_nodes (name, type) VALUES ($1,'entity') ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id", [t.s])).rows[0].id
    const o = (await pool.query("INSERT INTO kg_nodes (name, type) VALUES ($1,'entity') ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id", [t.o])).rows[0].id
    await pool.query("INSERT INTO kg_edges (src, dst, relation, props) VALUES ($1,$2,$3,$4) ON CONFLICT (src,dst,relation) DO NOTHING", [s, o, t.r.slice(0, 48), JSON.stringify({ source })])
  }
  return { entities: ent.size, relations: triples.length }
}
`
// graphify carries the KG schema itself (idempotent) so it works standalone or with memorygraph.
const GRAPHIFY_SQL = `CREATE TABLE IF NOT EXISTS kg_nodes (id BIGSERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, type VARCHAR(32) DEFAULT 'entity', props JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS kg_edges (id BIGSERIAL PRIMARY KEY, src BIGINT NOT NULL REFERENCES kg_nodes(id), dst BIGINT NOT NULL REFERENCES kg_nodes(id), relation VARCHAR(48) NOT NULL, props JSONB DEFAULT '{}', UNIQUE (src, dst, relation));`

export function deterministicGraphify(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const hay = `${config.identity.name} ${bp.summary} ${bp.tables.map((t) => t.name).join(" ")}`.toLowerCase()
  if (!/graphify|knowledge graph|grafo.*conocimiento|extract.*entit|entidad.*relaci|triple|ontolog|graph.*from.*(text|doc)|connect.*ideas|second brain|segundo cerebro|jarvis|asistente/.test(hay)) return null
  return { files: [{ path: "lib/graphify.ts", content: GRAPHIFY }], extraSql: GRAPHIFY_SQL }
}
