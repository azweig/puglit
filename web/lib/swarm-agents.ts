/**
 * swarm-agents.ts — the office roster for the visual build views (flow + office).
 * Each agent has a home room, a pixel-art persona (used to generate its sprite), and the
 * job step keys it owns (so its state = those steps' status). Adding a future agent here
 * (astrology, math, …) auto-creates its sprite via scripts/gen-sprites.mjs and a desk.
 */
export type RoomId = "ti" | "design" | "business" | "management"

export interface SwarmAgent {
  id: string
  name: string
  room: RoomId
  steps: string[]      // job step keys this character represents
  persona: string      // pixel-art prompt (style prefix is added by the generator)
  stakeholder?: boolean
  queen?: boolean
}

export const ROOMS: { id: RoomId; label: string; tint: string }[] = [
  { id: "ti", label: "TI Office", tint: "#1b2740" },
  { id: "design", label: "Estudio de Diseño", tint: "#2a1b40" },
  { id: "business", label: "Business Office", tint: "#16302a" },
  { id: "management", label: "Management Lounge", tint: "#3a1726" },
]

export const SWARM_AGENTS: SwarmAgent[] = [
  // — TI Office —
  { id: "data-architect", name: "Arquitecto de Datos", room: "ti", steps: ["data-model"], persona: "a data architect with round glasses and a teal hoodie, holding a glowing blue database crystal, confident idle pose" },
  { id: "researcher", name: "Researcher", room: "ti", steps: ["research"], persona: "an explorer researcher with a khaki field vest and a satchel, holding a magnifying glass over a paper map" },
  { id: "contracts-architect", name: "Arquitecto de Contratos", room: "ti", steps: ["contracts"], persona: "a systems architect wearing an orange safety vest and a hard hat, holding a blue blueprint scroll and a ruler" },
  { id: "dba", name: "DBA / Ingesta", room: "ti", steps: ["schema", "seed", "erd"], persona: "a database administrator in a dark shirt standing next to a glowing server tower, holding a golden key and a small green data sprout" },
  { id: "backend-engineer", name: "Backend Engineer", room: "ti", steps: ["auth", "payments", "email", "crons", "admin"], persona: "a backend engineer in a dark hoodie typing on a floating green terminal screen, focused" },
  { id: "security-engineer", name: "Ing. de Seguridad", room: "ti", steps: ["security"], persona: "a cybersecurity engineer in a hooded cloak with a glowing shield emblem on the chest, holding a padlock" },
  { id: "engine-lead", name: "Engine — Producto", room: "ti", steps: ["engine"], persona: "a star product engineer in a bright jacket holding a large glowing mechanical gear core, heroic confident pose" },
  { id: "reliability-engineer", name: "QA / Confiabilidad", room: "ti", steps: ["ci-verify"], persona: "a reliability QA engineer in a navy jumpsuit holding a wrench and a clipboard with a green check, inspecting a gear" },
  { id: "devops", name: "DevOps", room: "ti", steps: ["env", "deliver"], persona: "a devops engineer with a small rocket backpack and a toolbelt, launching a tiny rocket from one hand" },
  // — Estudio de Diseño —
  { id: "art-director", name: "Director de Marca", room: "design", steps: ["brand"], persona: "an art director wearing a beret and a paint-splattered apron, holding a colorful paint palette and brush" },
  { id: "frontend-designer", name: "Frontend / UI", room: "design", steps: ["design", "dashboard"], persona: "a frontend designer in a trendy outfit holding a glowing tablet showing colorful UI mockups and a stylus" },
  // — Business Office —
  { id: "analyst", name: "Analytics", room: "business", steps: ["analytics"], persona: "a business analyst in glasses and a blazer presenting a floating glowing bar chart" },
  { id: "seo-specialist", name: "SEO", room: "business", steps: ["seo"], persona: "an SEO specialist in a casual shirt holding a magnifying glass over a floating webpage with a small upward rocket" },
  { id: "tech-writer", name: "Technical Writer", room: "business", steps: ["docs-tech"], persona: "a technical writer in a cardigan holding a glowing quill and a neat stack of documents" },
  { id: "business-strategist", name: "Business Strategist", room: "business", steps: ["docs-biz"], persona: "a business strategist in a sharp suit holding a pitch deck and a shiny gold dollar coin" },
  // — Management Lounge (queen + stakeholders) —
  { id: "queen-bee", name: "Abeja Reina", room: "management", steps: ["stakeholder"], queen: true, persona: "a majestic QUEEN BEE woman in purple and gold royal armor with translucent insect wings and a small crown, holding a glowing roadmap scroll, regal confident leader pose" },
  { id: "sh-growth", name: "Growth · SEO", room: "management", steps: ["stakeholder"], stakeholder: true, persona: "a growth marketing stakeholder in a smart-casual blazer holding a golden megaphone and a small upward graph" },
  { id: "sh-architecture", name: "Arquitectura · Seguridad", room: "management", steps: ["stakeholder"], stakeholder: true, persona: "a senior architecture stakeholder in a grey suit holding a small construction crane model and a shield" },
  { id: "sh-design", name: "Diseño · UX", room: "management", steps: ["stakeholder"], stakeholder: true, persona: "a design and UX stakeholder in a stylish outfit holding a fan of color swatches with sparkles around" },
  { id: "sh-business", name: "Negocio · Pricing", room: "management", steps: ["stakeholder"], stakeholder: true, persona: "a business and pricing stakeholder in a navy suit holding a leather briefcase with a glowing dollar sign" },
  { id: "sh-fidelity", name: "Fidelidad · Liveness", room: "management", steps: ["stakeholder"], stakeholder: true, persona: "a meticulous QA fidelity stakeholder in glasses holding a target dartboard with a green checkmark dart in the bullseye" },
]

/** step key → the agent that owns it (for status mapping in the UI). */
export const STEP_TO_AGENT: Record<string, string> = Object.fromEntries(
  SWARM_AGENTS.flatMap((a) => a.steps.map((s) => [s, a.id])),
)
