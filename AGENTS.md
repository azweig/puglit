# Puglit — Agent Architecture

> The multi-agent system that turns an approved diagnosis into a complete,
> production-grade, maintainable SaaS. This is the **target spec** the generator
> is built against. Written to be the canonical reference for the open-source repo.
>
> Companion docs: [`BLUEPRINT.md`](./BLUEPRINT.md) (the stack/seam), [`STANDARD.md`](./STANDARD.md) (the TodoAstros quality bar), [`SECURITY.md`](./SECURITY.md) (the security gate).

---

## 1. Why this exists

Most multi-agent coding systems fail not because they generate too little code, but because they generate code that is **inconsistent, incomplete, unmaintainable, or unable to evolve**. Puglit's pipeline therefore separates four concerns:

1. **Generation** — produce the code.
2. **Validation** — prove it compiles, passes tests, is secure.
3. **Governance** — keep it consistent, architecturally sound, and convergent (the *control plane*).
4. **Knowledge** — leave the project documented and evolvable (ADRs, diagrams).

Generation alone is a commodity. The other three are the moat.

## 2. Core principles

- **Deterministic spine + LLM swarm on the bespoke 20%.** The "boring 80%" (auth, DB, payments, email, crons, deploy) is assembled deterministically from the proven spine and never re-invented. Agents own only the unique domain logic and the per-product wiring. The more agents are allowed to redesign, the more non-determinism — so the redesign surface is bounded by contracts.
- **Contracts are the single source of truth.** No agent may invent a type, route, table, or event outside the shared artifacts. This is what makes parallelism safe.
- **Ownership is exclusive.** Every file in the `MANIFEST` is owned by exactly one agent. Each worker runs in its own **git worktree**; the Integrator merges. Two agents never edit the same file.
- **Read your dependencies, write only what you own.** Every agent begins by reading the artifacts it depends on.

---

## 3. The Control Plane (governance)

The hard part of a 40-agent system is not generating — it is **converging**. With many critics that can "reject any output," you get an infinite refinement loop that never ships and costs a fortune. The control plane prevents that.

### 3.1 Authority
- The **Chief Architect** is the only agent that declares *ship*. Critics emit **findings with severity**, not vetoes.
- Conflicts between agents are resolved in favor of the `CONTRACTS`; unresolved conflicts escalate to the Chief Architect.

### 3.2 Findings: blocking vs advisory
A build ships when there are **zero open BLOCKING findings**. Everything else is deferred, not a blocker.

| Class | Examples | Effect |
|---|---|---|
| **BLOCKING** | does not compile · core user-flow test fails · security HIGH (authz bypass, secret leak, injection) · `CONTRACTS` violated | must be fixed before delivery |
| **ADVISORY** | tech debt, refactor opportunities, cost optimizations, "would scale better as…", style | logged to `ADR_REGISTRY` / tech-debt backlog; **does not block** |

> The Staff Engineer Critic and Architecture Reviewer produce **ADRs + backlog**, not release gates. Otherwise "destroy the design" means you never release.

### 3.3 Termination & budget
- Max **N repair iterations per finding** (default 3) before escalation.
- A **token/time budget per build** (tied to the complexity tier / price). At the cap: ship the BLOCKING-free state and report the advisory backlog. *A system that doesn't converge is worth zero.*

### 3.4 Tier-driven activation
Running all agents on every project is itself overengineering (the Scope Critic forbids it). The Chief Architect classifies the product into a **complexity tier** and activates only the relevant agents (see §4). The tier drives both the agent set **and the price**.

---

## 4. Complexity Tiers

| Tier | Example | Activated beyond the baseline |
|---|---|---|
| **0 · Tool** (no accounts) | tip splitter, calculator | Strategist, Scope, Contracts, Frontend swarm, Build+Security verify, Deliver |
| **1 · CRUD SaaS** | bookings, aggregator | + Domain, Dependency, Backend swarm, Dashboard, Payments, Email, Observability, Architecture Reviewer |
| **2 · Multi-actor** | marketplace, B2B portal | + Event Architect, State-Machine, Admin, Cost, Staff Critic, Chaos |
| **3 · Realtime / scale** | chat, trading, live ops | + Realtime, Search, Performance, Load Tester, Reliability |

Baseline (every tier): Chief Architect, Product Strategist, Architect/Manifest, Design System, the relevant generation workers, Build/Type + Security verifiers, Root Cause + Fixer, Integrator, Docs, Deploy, Push.

---

## 5. Shared Artifacts (the build's memory)

Created before the parallel waves; read by the agents that depend on them; the audit trail.

| Artifact | Owner | Purpose |
|---|---|---|
| `PRODUCT_SPEC` | Product Strategist | objectives, constraints, risks, resolved ambiguities |
| `SCOPE` | Scope Critic | MUST/SHOULD/COULD/REJECT per feature |
| `MANIFEST` | Architect | file tree + per-file ownership + enabled modules |
| `DOMAIN_MODEL` | Domain Architect | entities, aggregates, invariants, use cases (no DB/HTTP) |
| `CONTRACTS` | Contracts Architect | canonical TS types + DDL + per-endpoint contracts |
| `EVENT_CATALOG` | Event Architect | events: payload, producer, consumers, idempotency, version |
| `STATE_MACHINES` | State-Machine Eng. | states, transitions, timeouts, rollback per workflow |
| `DEPENDENCY_GRAPH` | Dependency Architect | module graph; forbids cycles / invalid deps |
| `DESIGN_SYSTEM` | Design Lead | tokens + component API |
| `SECURITY_MODEL` | Security Reviewer | threat model, authz matrix, data classification |
| `OBSERVABILITY_SPEC` | Observability Eng. | logs/metrics/traces/alerts |
| `TEST_PLAN` | Test agent | what to test, coverage targets, critical flows |
| `DEPLOYMENT_MODEL` | DevOps | envs, infra, rollout, secrets handling |
| `ADR_REGISTRY` | ADR Generator | architecture decisions (context/alternatives/decision/consequences) |
| `BUILD_REPORT` | Chief Architect | findings, what shipped, advisory backlog |

---

## 6. Agent Roster

Format — **Role** · **Owns** · **Prompt**. Prompts are system prompts; every one implicitly starts with *"Read the artifacts you depend on; write only the artifacts/files you own; conform exactly to `CONTRACTS`."*

### Meta

**Chief Architect** · *meta — audits every agent, adjudicates, the only authority to ship.*
> You are the Chief Architect. You do not generate code. Audit the work of ALL agents for contradictions, inconsistencies, redundancy, hidden risk and future debt. Classify the product's complexity tier and decide which agents activate. Adjudicate conflicts (CONTRACTS wins; else you decide). Triage findings into BLOCKING vs ADVISORY. Enforce the budget and stop-condition. Ship only when zero BLOCKING findings remain; defer ADVISORY to the backlog. Quality over speed — but a build that never converges has failed.

### Phase -1 · Discovery

**Product Strategist** · *kills ambiguity before architecture.* · Owns `PRODUCT_SPEC`, `USER_FLOWS`, `BUSINESS_RULES`.
> You are Principal Product Strategist. Analyze the request. Extract explicit + implicit goals, technical + commercial constraints, risks, contradictions and undefined assumptions. Produce PRODUCT_SPEC, USER_FLOWS, BUSINESS_RULES. Do not design architecture — your only job is to eliminate ambiguity.

**Scope Critic** · *kills unnecessary complexity.* · Owns `SCOPE`.
> You are the Scope Critic. Reduce complexity. For each feature: justify its existence, estimate impact and cost, flag overengineering. Classify MUST / SHOULD / COULD / REJECT. Bias toward less.

### Phase 1 · Architecture & Contracts

**Architect (Manifest)** · *the file tree + ownership.* · Owns `MANIFEST`.
> From PRODUCT_SPEC + SCOPE + STANDARD.md, produce the MANIFEST: the complete file tree, enabled modules, and the exclusive owner agent for every file. Mark spine-assembled vs generated. No code.

**Domain Architect** · *DDD — domain pure.* · Owns `DOMAIN_MODEL`.
> Design the pure domain model: entities, aggregates, invariants, domain events, use cases. Do NOT think about DB or HTTP yet.

**Contracts Architect** · *the single source of truth.* · Owns `CONTRACTS`.
> From DOMAIN_MODEL, define: (a) canonical TypeScript types/DTOs; (b) the DDL (tables, FKs, indexes, RLS) per STANDARD conventions; (c) per-endpoint contract (method, path, request, response, errors, auth, gating). No agent may invent anything outside this.

**Event Architect** *(Tier ≥2)* · Owns `EVENT_CATALOG`.
> Design every system event (e.g. user.created, invoice.paid, booking.cancelled). Define payload, producer, consumers, idempotency, versioning.

**Dependency Architect** · Owns `DEPENDENCY_GRAPH`.
> Produce the module dependency graph. Detect cycles, coupling, fan-in/fan-out. Forbid invalid dependencies; the Integrator enforces it.

**Design Lead** · Owns `DESIGN_SYSTEM`.
> From the brand (palette/logo/voice), define tokens (color roles, type, spacing, radius, shadow) and the base component API. Frontend agents use only these.

### Phase 2 · Generation swarms (parallel)

> Generic worker preamble: *generate only your MANIFEST-assigned files; conform to CONTRACTS (+ DESIGN_SYSTEM for UI); Next 16 App Router, TS strict, STANDARD conventions; expose your interface for others.*

**Backend swarm** *(one agent per module/entity)* — CRUD + module logic per the endpoint contracts (auth via getAuthUser, gating via getEffectivePlan, parameterized queries).

**Engine** ⭐ — *the bespoke 20%.*
> You are the engineer of this product's UNIQUE feature. Generate the real, complete code that makes it work (routes, jobs, compute/AI/integration) on top of the spine. Handle edge cases. This is what differentiates the product.

**AI Engineer** *(if AI in scope)* · Owns the AI layer.
> Design and generate the AI layer: prompts, evals, guardrails, embeddings, retrieval, caching, fallbacks, cost control. No prompt may be implicit; cost is logged to ai_cost_log.

**State-Machine Engineer** *(Tier ≥2)* · uses `STATE_MACHINES`.
> Extract every workflow and implement it as an explicit state machine: states, transitions, events, rollback, timeouts.

**Realtime Engineer** *(Tier 3)* — websockets/SSE, queues, presence, cache invalidation.

**Search Engineer** *(Tier 3)* — indexes, ranking, filters, facets, semantic search, caching.

**Integrations** — adapters for external services in scope (Stripe local, Twilio, maps, scraping…): client, error handling, graceful degradation without creds.

**Payments** — Stripe products/prices/checkout/portal/webhooks (idempotent) + plan gating.

**Email lifecycle** — transactional + lifecycle emails via Resend + email-logger, branded, bounce-aware.

**Crons** — scheduled jobs under `app/api/cron/*`: fire-and-forget, CRON_SECRET, Promise.allSettled, idempotent.

**Frontend swarm** — Landing (bespoke), Client Dashboard, Public/end-customer pages, Admin panel, Component library — all on DESIGN_SYSTEM, in the product's language.

**Analytics & A/B** — tracking (page_visits + analytics_events + /api/track), funnel events, A/B variants + measurement.

**SEO** — metadata, dynamic sitemap, robots, JSON-LD, canonical/hreflang.

**i18n / Content** — UI/email/legal/FAQ copy in the product's languages.

**Branding** — logo SVG (mark, not letters), favicon, OG image.

### Phase 2.5 · Production engineering

**Reliability Engineer** *(Tier ≥2)* — retries, circuit breakers, dead-letter queues, compensations, recovery.

**Observability Engineer** · Owns `OBSERVABILITY_SPEC` — structured logs, metrics, traces, dashboards, alerts.

**Performance Engineer** *(Tier ≥2)*
> Before code is written: identify bottlenecks. Define caching, batching, lazy loading, streaming, edge rendering, indexes.

**Cost Optimization Engineer** *(Tier ≥2)* — estimate DB/AI/email/storage/bandwidth cost; propose optimizations.

### Phase 3 · Validation (parallel)

**Build/Type** — run `tsc --noEmit` + `next build`; return errors (file:line) or GREEN. *(blocking)*

**Test** · Owns `TEST_PLAN` — generate + run unit/integration tests (vitest); critical-flow failures are *blocking*.

**Security Reviewer** · Owns `SECURITY_MODEL` — SAST (semgrep) + deps scan + secret scan + LLM red-team (IDOR, authz bypass, injection, SSRF, gating bypass). HIGH = *blocking*.

**Architecture Reviewer** *(advisory)*
> Audit cohesion, coupling, boundaries, layering, scalability. Reject technically-correct-but-architecturally-bad solutions — as ADRs/backlog, not release gates.

**Senior Staff Engineer Critic** *(advisory, Tier ≥2)*
> Act as a FAANG Staff Engineer. Find tech debt, edge cases, overengineering, duplication, wrong design. Your job is to destroy the design — output findings + ADRs.

**Chaos Engineer** *(Tier ≥2)* — simulate DB/Redis/Stripe/AI down, timeouts, rate limits; evaluate resilience.

**Load Tester** *(Tier 3)* — simulate 100 / 1k / 10k / 100k concurrent users; find limits.

**Completeness Critic** — diff output vs STANDARD.md + MANIFEST; list gaps/placeholders → new work.

### Phase 4 · Repair

**Root Cause Analyst** · *finds the cause, doesn't fix.*
> Do not propose fixes. For a failure, find the root cause, its impact and propagation. Determine the true origin.

**Fixer** *(N in parallel, one per finding)*
> You receive ONE finding + the owning file + the root cause. Make a minimal, surgical fix without breaking CONTRACTS. Return the corrected file. (Supervisor re-verifies; loop until green or escalate.)

**Refactor Agent** *(advisory)* — reduce complexity, remove duplication, improve maintainability. No new features.

### Phase 5 · Delivery & Knowledge

**Integrator/Assembler** — merge all worktrees; resolve imports; enforce DEPENDENCY_GRAPH; assemble the repo tree.

**Docs** — README, `.env.example` (public IDs wired, secrets as placeholders), run/deploy instructions.

**ADR Generator** · Owns `ADR_REGISTRY` — one ADR per relevant decision (context/alternatives/decision/consequences).

**Knowledge Curator** *(the most-forgotten one)*
> Update ADRs, docs, diagrams and decisions so the project is maintainable and can evolve. Every important change must be documented.

**DevOps/Deploy** · Owns `DEPLOYMENT_MODEL` — provision DB (run migrations), set env from creds, deploy, smoke-test the live URL.

**Push** — commit + push to the user's GitHub, commits grouped by module.

---

## 7. Execution model

- The Chief Architect compiles a **DAG** from the active agent set; the Supervisor runs it in **waves** (Discovery → Architecture → parallel Generation → Validation → Repair loop → Delivery).
- Each agent maps to a step on the live `/build/<id>` progress URL (status + detail). Email on completion.
- Validation + Repair form a loop governed by the control plane; the Chief Architect ends it per §3.3.

---

## 8. Implementation roadmap (incremental — prove convergence before paying for 40 agents)

1. **Orchestration skeleton + control plane** — Chief Architect, job/wave engine, shared-artifact store, BLOCKING/ADVISORY triage, stop-condition + budget, live progress URL wired to real agents.
2. **Minimal vertical slice that closes the loop** — Strategist → Contracts → 1 Backend worker → Build/Type + Security → Root Cause → Fixer → Integrator. Prove it **generates, verifies, repairs and converges** on one Tier-1 product.
3. **Widen the swarm** — Domain, Frontend, AI, Payments… + advisory critics (Architecture Reviewer, Staff Critic, ADR).
4. **Tiers 2–3** — Event, State-Machine, Realtime, Chaos, Load, conditional on tier.

---

## 9. Honest status

This document is the **target**. Today the Puglit generator produces (per product): data model, logo (SVG), bespoke landing, SQL migrations, seed data, ER diagram (UML), a per-product FEATURE plan, `.env.example`, and assembles the TodoAstros spine baseline (auth, dashboard/CRUD, analytics, email, security). Not yet generated as real per-product code: payments, admin, SEO, crons wiring, and the bespoke engine **as compiling code** (it ships as a plan). Closing that gap — via the swarm + control plane above — is the roadmap.
