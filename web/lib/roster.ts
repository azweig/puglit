/**
 * roster.ts — the 75-agent genetic roster: 3 competing teams (islands) × 25 roles.
 *
 * Each team runs a distinct DEVELOPMENT PHILOSOPHY (a system-prompt "lens"), and every
 * agent is a real, persistent identity with RPG stats that DRIVE its Ollama params
 * (creativity → higher temperature, rigor → determinism). Stats + level + the Queen's
 * quality reputation accrue across projects (the agent's "diary of life").
 *
 * On 1 GPU the 75 execute on the shared Ollama queue (they are 75 real definitions, not
 * 75 simultaneous processes — that's a hardware limit, not a design one). The same roster
 * scales to parallel workers + a graph DB when hardware allows.
 */
export type Philosophy = "lean" | "ddd" | "hacker"
export type TeamId = "A" | "B" | "C"
export interface Stats { creativity: number; rigor: number; security: number; speed: number; depth: number }
export interface RosterAgent {
  id: string; team: TeamId; role: string; name: string; room: string
  persona: string; queen: boolean; stakeholder: boolean
  stats: Stats; temperature: number; philosophy: Philosophy
}

export const TEAMS: { id: TeamId; philosophy: Philosophy; label: string; description: string; lens: string }[] = [
  { id: "A", philosophy: "lean", label: "Equipo Lean", description: "Pragmático / MVP-first — el camino más simple que funciona.",
    lens: "PHILOSOPHY: Lean/Pragmatic. Ship the SIMPLEST thing that fully works. YAGNI: fewer tables, fewer files, no speculative abstraction. Prefer obvious, boring, correct code over clever code." },
  { id: "B", philosophy: "ddd", label: "Equipo Enterprise", description: "Domain-Driven — modelo de dominio rico, por capas, contratos explícitos, defensivo.",
    lens: "PHILOSOPHY: Enterprise/Domain-Driven. Model the domain richly and explicitly; clear layering and contracts; validate inputs defensively; correctness and maintainability over raw speed." },
  { id: "C", philosophy: "hacker", label: "Equipo Hacker", description: "Performance / ingenio — terso, veloz, no convencional, con ojo de seguridad ofensiva.",
    lens: "PHILOSOPHY: Hacker/Performance. Be clever and terse; optimize the hot path; question assumptions; probe security/edge-cases aggressively. Unconventional but it must still compile and run." },
]
const PHIL_MOD: Record<Philosophy, Partial<Stats>> = {
  lean:   { speed: +2, creativity: +1, rigor: -1, depth: -1 },
  ddd:    { depth: +2, rigor: +2, speed: -2, creativity: -1 },
  hacker: { creativity: +2, speed: +1, security: +1, rigor: -2 },
}

// 25 base roles (mirrors registry/agents.json) with base RPG stats + room + persona seed.
type Base = { role: string; name: string; room: string; queen?: boolean; stakeholder?: boolean; s: Stats; persona: string }
const clamp = (n: number) => Math.max(1, Math.min(10, n))
const ST = (creativity: number, rigor: number, security: number, speed: number, depth: number): Stats => ({ creativity, rigor, security, speed, depth })

const BASE: Base[] = [
  { role: "discovery-interviewer", name: "Entrevistador", room: "business", s: ST(7,6,3,7,6), persona: "a friendly product discovery lead with a headset and a clipboard, asking questions" },
  { role: "answer-extractor", name: "Extractor", room: "business", s: ST(4,7,3,8,5), persona: "a tidy analyst distilling sticky notes into a neat structured list" },
  { role: "master-spec-architect", name: "Arquitecto de Spec", room: "ti", s: ST(7,8,4,5,9), persona: "a principal architect with rolled blueprints and a master plan hologram" },
  { role: "contracts-architect", name: "Arq. de Contratos", room: "ti", s: ST(5,8,5,5,8), persona: "a systems architect in an orange vest and hard hat holding a blue blueprint scroll and ruler" },
  { role: "domain-architect", name: "Arq. de Dominio", room: "ti", s: ST(7,8,5,5,9), persona: "a domain architect arranging glowing entity cards into a schema graph" },
  { role: "completeness-critic", name: "Crítico de Completitud", room: "ti", s: ST(6,9,5,5,7), persona: "a sharp critic with a red pen circling gaps on a floating checklist" },
  { role: "backend-engineer", name: "Backend Engineer", room: "ti", s: ST(5,7,6,6,7), persona: "a backend engineer in a dark hoodie typing on a floating green terminal screen, focused" },
  { role: "reliability-engineer", name: "QA / Confiabilidad", room: "ti", s: ST(4,10,7,5,6), persona: "a reliability QA engineer in a navy jumpsuit holding a wrench and a clipboard with a green check" },
  { role: "art-director", name: "Director de Marca", room: "design", s: ST(10,3,2,5,5), persona: "an art director wearing a beret and a paint-splattered apron, holding a colorful paint palette and brush" },
  { role: "frontend-engineer", name: "Frontend Engineer", room: "design", s: ST(8,5,4,6,6), persona: "a frontend engineer in a trendy outfit holding a glowing tablet with colorful UI and a stylus" },
  { role: "design-qc", name: "Design QC", room: "design", s: ST(6,8,4,5,5), persona: "a meticulous design reviewer holding a magnifier over a pixel grid and a contrast swatch" },
  { role: "frontend-architect", name: "Arq. Frontend", room: "design", s: ST(6,7,4,5,8), persona: "a frontend architect sketching a component tree on a glass board" },
  { role: "data-architect", name: "Arq. de Datos", room: "ti", s: ST(6,8,5,5,9), persona: "a data architect with round glasses and a teal hoodie holding a glowing blue database crystal" },
  { role: "data-engineer", name: "Data Engineer", room: "ti", s: ST(5,8,5,6,7), persona: "a data engineer wiring glowing pipes between a cloud and a database barrel" },
  { role: "ci-fixer", name: "CI Fixer", room: "ti", s: ST(5,9,5,7,6), persona: "a calm engineer turning a failing red build into a green check with a screwdriver" },
  { role: "reliability-verifier", name: "Runtime Verifier", room: "ti", s: ST(4,9,6,6,6), persona: "an inspector running a small app on a handheld device, watching gauges" },
  { role: "security-engineer", name: "Ing. de Seguridad", room: "ti", s: ST(5,9,10,5,7), persona: "a cybersecurity engineer in a hooded cloak with a glowing shield emblem holding a padlock" },
  { role: "devops", name: "DevOps", room: "ti", s: ST(5,7,6,8,6), persona: "a devops engineer with a small rocket backpack and a toolbelt launching a tiny rocket" },
  { role: "researcher", name: "Researcher", room: "business", s: ST(8,6,4,6,7), persona: "an explorer researcher with a khaki field vest and satchel holding a magnifying glass over a map" },
  { role: "reference-studier", name: "Reference Studier", room: "business", s: ST(7,7,4,5,7), persona: "an analyst comparing two product screenshots side by side with calipers" },
  { role: "analyst", name: "Analytics", room: "business", s: ST(5,7,4,6,6), persona: "a business analyst in glasses and a blazer presenting a floating glowing bar chart" },
  { role: "seo-specialist", name: "SEO", room: "business", s: ST(7,6,4,6,5), persona: "an SEO specialist holding a magnifier over a webpage with a small upward rocket" },
  { role: "tech-writer", name: "Technical Writer", room: "business", s: ST(6,7,3,6,6), persona: "a technical writer in a cardigan holding a glowing quill and a neat stack of documents" },
  { role: "business-strategist", name: "Business Strategist", room: "business", s: ST(7,6,4,6,7), persona: "a business strategist in a sharp suit holding a pitch deck and a shiny gold dollar coin" },
  { role: "queen-bee", name: "Abeja Reina", room: "management", queen: true, s: ST(8,8,6,6,9), persona: "a majestic QUEEN BEE woman in purple and gold royal armor with translucent wings and a small crown, holding a glowing roadmap scroll" },
]

const SHORT: Record<Philosophy, string> = { lean: "Lean", ddd: "Enterprise", hacker: "Hacker" }
/** Map RPG stats → a per-call Ollama temperature (creative roles run hot, rigorous roles cold). */
export function tempFromStats(s: Stats): number {
  const t = 0.12 + s.creativity * 0.06 - s.rigor * 0.025 + s.speed * 0.005
  return Math.round(Math.max(0.1, Math.min(0.9, t)) * 100) / 100
}
function applyMod(base: Stats, mod: Partial<Stats>): Stats {
  return { creativity: clamp(base.creativity + (mod.creativity || 0)), rigor: clamp(base.rigor + (mod.rigor || 0)), security: clamp(base.security + (mod.security || 0)), speed: clamp(base.speed + (mod.speed || 0)), depth: clamp(base.depth + (mod.depth || 0)) }
}

/** The full 75-agent roster (3 teams × 25 roles), deterministically derived. */
export function buildRoster(): RosterAgent[] {
  const out: RosterAgent[] = []
  for (const team of TEAMS) {
    for (const b of BASE) {
      const stats = applyMod(b.s, PHIL_MOD[team.philosophy])
      out.push({
        id: `${team.id}:${b.role}`, team: team.id, role: b.role,
        name: `${b.name} · ${SHORT[team.philosophy]}`, room: b.room,
        persona: b.persona, queen: !!b.queen, stakeholder: !!b.stakeholder,
        stats, temperature: tempFromStats(stats), philosophy: team.philosophy,
      })
    }
  }
  return out
}

export const QUALITY = (a: { quality_sum: number; quality_n: number }) => a.quality_n ? Math.round((a.quality_sum / a.quality_n) * 10) / 10 : 0
