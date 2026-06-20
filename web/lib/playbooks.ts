/**
 * playbooks.ts — per-discipline "skills" distilled into compact prompt knowledge.
 *
 * The Claude-ecosystem skills (Superpowers, Anthropic frontend-design, code-review) are
 * markdown methodologies written for a frontier model + Claude Code runtime. We can't run
 * them as-is on local Ollama models (slash commands / hooks don't apply, and long docs blow
 * the context). So we EXTRACT the methodology each skill encodes and bake it into the
 * relevant agent's system prompt — keyed by the agent's area/role. Kept short on purpose so
 * a local 7-32B model actually follows it. (This is the same "structured gene" idea as the
 * learning diary: compact, role-scoped knowledge injected per agent.)
 */
import { ROLE_AREA, type Area } from "@/lib/progression"

// distilled from Superpowers (spec-driven design, brainstorming, execution planning)
const ARCHITECT = `SKILL — Spec-driven architecture: design spec-FIRST, not table-first.
1) Identify the REAL domain entities + relations. Separate CATALOG/reference data (the app seeds/ingests, users only read) from USER-GENERATED content.
2) Think in complete USER JOURNEYS: everything listable must be creatable; no dead-ends.
3) Make each operation's CONTRACT explicit (inputs, outputs, scoping).
4) YAGNI: no speculative abstractions, no entities the product doesn't need.
5) Location features → lat/lng DOUBLE PRECISION + Haversine ordered by distance.
Self-check: can a real user use the product end-to-end with this model?`

// distilled from systematic-debugging + TDD (Superpowers) + ponytail (code minimalism)
const DEV = `SKILL — Correctness over cleverness.
1) Define the operation's CONTRACT before coding (inputs, outputs, error cases).
2) One route = one clear responsibility.
3) Parameterized SQL ALWAYS; never string-concat user input.
4) Handle errors + edge cases explicitly; never assume the happy path.
5) On failure, find ROOT CAUSE, not random patches.
6) MINIMAL CODE (decision ladder, before writing): does it need to exist (YAGNI)? → does stdlib / a native platform feature / an already-installed dep do it? → can it be ONE line? → only then write the minimum viable solution. NEVER add an npm dependency or an abstraction when a few lines of plain code work. This never lowers validation/security/error-handling.`

// distilled from Anthropic frontend-design
const DESIGN = `SKILL — Frontend design.
1) Clear visual hierarchy: one focal point per screen.
2) Consistent spacing rhythm (a spacing scale), generous whitespace.
3) REAL content, never lorem ipsum.
4) Accessibility: contrast, visible focus, touch targets ≥44px, semantic HTML.
5) The homepage IS the product, never a generic marketing landing.
6) Design the loading / empty / error states, not just the happy path.`

// distilled from code-review-and-quality (addyosmani)
const REVIEW = `SKILL — Critical code/blueprint review. Judge on:
1) Correctness — does it do what it claims? edge cases handled?
2) Journey completeness — everything listable is creatable; no dead routes.
3) Coherence — only this product's domain entities; zero contamination.
4) Security — input validation, no secrets, auth where it belongs.
5) Feasibility — buildable and right-sized (not bloated, not a toy).
6) Over-engineering — flag needless dependencies, abstractions and boilerplate; the LEANEST correct solution wins (a native input over a library, a few lines over a framework).`

// distilled from execution-planning (Superpowers) — for the Queen / orchestrator
const QUEEN = `SKILL — Orchestration: plan the whole roadmap as verifiable steps, each with a
clear "done" criterion. Prefer the simplest path that fully meets the goal. Keep the team
focused on the real product, not gold-plating.`

const BY_AREA: Record<Area, string> = { data: ARCHITECT, dev: DEV, design: DESIGN, business: REVIEW }

/** The discipline playbook for a given agent role (or queen). */
export function playbookFor(role: string, queen = false): string {
  if (queen) return QUEEN
  return BY_AREA[ROLE_AREA[role] || "business"] || ""
}
export const PLAYBOOK = { architect: ARCHITECT, dev: DEV, design: DESIGN, review: REVIEW, queen: QUEEN }
