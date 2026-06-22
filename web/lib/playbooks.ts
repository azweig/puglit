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
3) Emit an EXPLICIT CONTRACT every other agent must follow VERBATIM: the canonical table name + every column for each entity, and each operation's inputs/outputs/scoping. ONE name per concept (don't call it "reservations" in the schema and "bookings" in a route) — the dev and the lib helpers must reuse these EXACT names.
4) Single source of truth: the hard domain rules (pricing, availability, refunds, state machines) live in ONE lib/ module the routes import — never duplicate a rule across routes.
5) YAGNI: no speculative abstractions, no entities the product doesn't need. Money in integer cents.
6) Location features → lat/lng DOUBLE PRECISION + Haversine ordered by distance.
Self-check: can a real user use the product end-to-end with this model, and is every name consistent?`

// distilled from systematic-debugging + TDD (Superpowers) + ponytail (code minimalism)
const DEV = `SKILL — First-class code: correct, tested, ZERO hardcoding.
1) CONTRACT first: inputs, outputs, error cases before coding.
2) NEVER HARDCODE. No magic literals, no hardcoded table/column names, IDs, URLs, prices, limits.
   Use the EXACT table & column names from the schema VERBATIM (if the schema says "reservations",
   use "reservations" — never invent/rename a table). Derive every value from schema/request/env/config.
3) DESIGN PATTERNS: domain/business logic lives in lib/ helpers (single source of truth), NOT copy-
   pasted in routes. Routes are THIN: validate → call the lib function → respond. DRY — the same
   rule/calculation exists in ONE place, imported everywhere (search and checkout call the SAME
   pricing fn so totals can't diverge). Money in integer cents, never floats.
4) REUSE: if a lib helper already does this (pricing, availability, booking, refund, auth, the
   injected modules), IMPORT it — do NOT reimplement it inline.
5) Parameterized SQL ALWAYS ($1,$2…); never string-concat user input.
6) Handle errors + edge cases explicitly; correct status codes; never assume the happy path.
7) MINIMAL CODE: YAGNI → native/stdlib → one line. Never add a dep/abstraction when a few lines
   work. This NEVER lowers validation/security/error-handling/correctness.`

// the QA discipline — distilled from addyosmani test-driven-development + testing-patterns
const TEST = `SKILL — Tests are PROOF, not decoration. Arrange-Act-Assert.
1) STRUCTURE every test Arrange → Act → Assert. Name for BEHAVIOR: describe("<unit>"),
   it("<expected behavior> when <condition>"). ONE behavior per test.
2) UNIT TESTS (vitest) for the pure rules — pricing, availability/overlap, refund-by-policy, the
   state machine, validators. Assert EXACT values (integer cents), boundaries, AND the error cases.
3) BUSINESS-RULE TESTS: encode the product's invariants ("an overlapping confirmed booking is
   rejected", "search total === checkout total", "refund uses the policy SNAPSHOT, not the current").
4) INTEGRATION TESTS: drive the real API routes (register → act → assert status + DB effect),
   including adversarial cases (double-booking, invalid dates, over-capacity, wrong actor).
5) ANTI-PATTERNS — never: test implementation details (test inputs/outputs); snapshot-everything
   (assert specific values); shared mutable state (setup/teardown per test); overly-broad asserts
   (be specific to catch regressions); test.skip or deleting an assertion to pass (fix or delete);
   missing await on async (false passes); testing third-party code. Tests import the SAME lib helpers
   the app uses. Report the coverage number.`

// distilled from addyosmani/adverse (multi-agent adversarial review) + doubt-driven-development
const ADVERSARIAL = `SKILL — Adversarial review BEFORE delivery: a confident answer is not a correct one.
Review from THREE orthogonal lenses — each STAYS IN ITS LANE (do not duplicate the others):
• AUDITOR — logic/correctness bugs, wrong domain math, unhandled edge cases, naming/schema
  mismatches (one concept = one name), and ANY hardcoded value or duplicated rule.
• ADVERSARY — how it breaks under abuse: SQL injection, missing auth/scoping, race conditions,
  double-book/double-spend, integer/precision errors, unvalidated input. Bias to REJECT.
• PRAGMATIST — design health: business logic in routes instead of lib/, DRY violations, dead
  routes, missing tests/low coverage. Ship only if it's correct AND maintainable.
Then CROSS-EXAMINE: a finding backed by ≥2 lenses is REAL; one lens's hunch is a maybe. VERIFY by
reading the ACTUAL code + the test/coverage EVIDENCE — never trust the claim. Verdict per artifact:
SHIP / SHIP-WITH-CAVEATS / BLOCK, each finding with concrete file:line evidence.`

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
3) Coherence & NAMING — only this product's entities; ONE name per concept (no schema/route table-name mismatch). FLAG any hardcoded value, magic literal, or duplicated business rule.
4) Patterns — domain logic in lib/ (single source of truth), thin routes, DRY; reuses helpers instead of reimplementing.
5) TESTS — are there real unit + business + integration tests, and do they cover the domain rules? Untested domain logic is a fail.
6) Security — input validation, no secrets, parameterized SQL, auth where it belongs.
7) Over-engineering — flag needless deps/abstractions; leanest correct solution wins.`

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
export const PLAYBOOK = { architect: ARCHITECT, dev: DEV, design: DESIGN, review: REVIEW, queen: QUEEN, test: TEST, adversarial: ADVERSARIAL }
