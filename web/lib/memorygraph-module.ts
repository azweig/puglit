/**
 * memorygraph-module.ts — knowledge-graph memory (inspired by topoteretes/cognee), Postgres-native
 * (zero-dep, no separate service). Upgrades flat agent memory to a GRAPH of entities + relations:
 * addFact("Alvaro","works_on","Puglit") → the agent recalls a connected subgraph, not just recent
 * lines. graphContext(entity) returns what's known about something for the LLM prompt. Pairs with
 * the agent + llm modules (use the llm to extract (subject, relation, object) triples from text).
 */
import type { DomainConfig } from "@/lib/domain-types"
import type { Blueprint } from "@/lib/app-builder"

type AppFile = { path: string; content: string }

const GRAPH = `import { pool } from "@/lib/db"
/** Upsert an entity node. */
export async function upsertNode(name: string, type = "entity", props: Record<string, unknown> = {}): Promise<number> {
  const { rows } = await pool.query("INSERT INTO kg_nodes (name, type, props) VALUES ($1,$2,$3) ON CONFLICT (name) DO UPDATE SET props = kg_nodes.props || $3 RETURNING id", [name, type, JSON.stringify(props)])
  return rows[0].id
}
/** Add a fact: subject —relation→ object (creates nodes + the edge). */
export async function addFact(subject: string, relation: string, object: string): Promise<void> {
  const s = await upsertNode(subject), o = await upsertNode(object)
  await pool.query("INSERT INTO kg_edges (src, dst, relation) VALUES ($1,$2,$3) ON CONFLICT (src, dst, relation) DO NOTHING", [s, o, relation])
}
/** Direct neighbours of an entity (both directions). */
export async function neighbors(entity: string): Promise<{ relation: string; other: string; dir: "out" | "in" }[]> {
  const { rows } = await pool.query(
    \`SELECT e.relation, n2.name AS other, 'out' AS dir FROM kg_nodes n1 JOIN kg_edges e ON e.src=n1.id JOIN kg_nodes n2 ON n2.id=e.dst WHERE n1.name=$1
     UNION ALL
     SELECT e.relation, n2.name AS other, 'in' AS dir FROM kg_nodes n1 JOIN kg_edges e ON e.dst=n1.id JOIN kg_nodes n2 ON n2.id=e.src WHERE n1.name=$1\`, [entity])
  return rows
}
/** A text summary of what the graph knows about an entity — drop into an LLM prompt. */
export async function graphContext(entity: string): Promise<string> {
  const n = await neighbors(entity)
  if (!n.length) return ""
  return entity + ":\\n" + n.map((r) => r.dir === "out" ? \`- \${entity} \${r.relation} \${r.other}\` : \`- \${r.other} \${r.relation} \${entity}\`).join("\\n")
}
`

const GRAPH_SQL = `CREATE TABLE IF NOT EXISTS kg_nodes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  type VARCHAR(32) DEFAULT 'entity',
  props JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS kg_edges (
  id BIGSERIAL PRIMARY KEY,
  src BIGINT NOT NULL REFERENCES kg_nodes(id),
  dst BIGINT NOT NULL REFERENCES kg_nodes(id),
  relation VARCHAR(48) NOT NULL,
  props JSONB DEFAULT '{}',
  UNIQUE (src, dst, relation)
);`

export function deterministicMemoryGraph(config: DomainConfig, bp: Blueprint): { files: AppFile[]; extraSql: string } | null {
  const tagline = typeof config.identity.tagline === "string" ? config.identity.tagline : ""
  const hay = `${config.identity.name} ${tagline} ${bp.summary}`.toLowerCase()
  const wants = /knowledge graph|grafo|memoria|memory|relations|relaciones|entidad|entit|second brain|segundo cerebro|asistente|assistant|jarvis|chief of staff|crm|conoc/.test(hay)
  if (!wants) return null
  return { files: [{ path: "lib/memorygraph.ts", content: GRAPH }], extraSql: GRAPH_SQL }
}
