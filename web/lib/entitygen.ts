/**
 * Puglit web — entitygen.ts
 * Uses the LLM to design the REAL data model for a product (instead of a generic
 * "Item"). From the name + what-it-does + benefits it returns 2–4 entities with
 * typed fields — which then drive a functional CRUD dashboard (demo + generated
 * code). Falls back to a single generic entity if the LLM is unavailable.
 */
import { chatJSON, aiConfigured } from "@/lib/openai"
import type { Entity, FieldType } from "@/lib/domain-types"

const FIELD_TYPES: FieldType[] = ["text", "longtext", "int", "float", "bool", "date", "datetime", "json", "enum", "url", "email"]

const SYSTEM = `You are a senior product engineer designing the DATA MODEL for a SaaS.
Given the product, return 2–4 core entities the user will actually create and manage.
Rules:
- "name": singular PascalCase (e.g. "Message", "Recipient").
- "plural": the plural label.
- "ownedByUser": true if rows belong to the logged-in user (almost always true).
- "fields": 2–5 each. field "name" snake_case; "type" ∈ [${FIELD_TYPES.join(", ")}]; "required" boolean; for type "enum" include "enumValues":[].
- Use "longtext" for message/notes bodies, "date"/"datetime" for times, "email" for emails, "bool" for flags.
- Model the product's ACTUAL nouns (e.g. a "final messages" app → Message, Recipient, CheckIn). No generic "Item".
Return ONLY JSON: {"entities":[{"name","plural","ownedByUser","fields":[{"name","type","required","enumValues"?}]}]}`

export async function designEntities(input: { name: string; what: string; benefits: string[] }): Promise<Entity[] | null> {
  if (!aiConfigured()) return null
  try {
    const out = (await chatJSON([
      { role: "system", content: SYSTEM },
      { role: "user", content: `Product: "${input.name}". What it does: ${input.what}. Key benefits: ${input.benefits.join("; ")}.` },
    ], { temperature: 0.3 })) as { entities?: unknown }

    const raw = Array.isArray(out.entities) ? out.entities : []
    const entities: Entity[] = []
    for (const e of raw.slice(0, 4)) {
      const ent = e as Record<string, unknown>
      if (!ent.name || !Array.isArray(ent.fields)) continue
      const fields = (ent.fields as Record<string, unknown>[]).slice(0, 6).map((f) => ({
        name: String(f.name || "").replace(/[^a-z0-9_]/gi, "_").toLowerCase() || "field",
        type: (FIELD_TYPES.includes(f.type as FieldType) ? f.type : "text") as FieldType,
        required: !!f.required,
        ...(Array.isArray(f.enumValues) ? { enumValues: (f.enumValues as unknown[]).map(String) } : {}),
      })).filter((f) => f.name)
      if (!fields.length) continue
      entities.push({
        name: String(ent.name).replace(/[^a-z0-9]/gi, "") || "Record",
        plural: ent.plural ? String(ent.plural) : undefined,
        ownedByUser: ent.ownedByUser !== false,
        fields,
      })
    }
    return entities.length ? entities : null
  } catch {
    return null
  }
}
