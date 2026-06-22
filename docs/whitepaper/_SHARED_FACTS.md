# Puglit — Shared Facts (ground truth for every whitepaper doc)

> Every doc MUST use these real names/numbers and VERIFY them against the codebase at
> `/Users/alvaroz/projects/2026/puglit`. No placeholders, no invented features. Cite real files.

## What Puglit is
Open-source, **self-hosted, agent-first** genetic multi-agent system that generates complete
full-stack **Next.js 16 (App Router, Turbopack) + raw `pg`/Postgres** SaaS apps from a one-line idea.
Runs **100% local on Ollama** (no API key, no cost); BYO any OpenAI-compatible or Anthropic provider.

## Model tiers — `web/lib/openai.ts` (`MODELS`, env `PUGLIT_MODEL_*`)
- `premium` (architecture, judging, review, SkillOpt) · `balanced` · `cheap` (extraction) · `code` (routes/pages/repair).
- ONE chokepoint: `call()`. Two protocols: `openai` (OpenAI/Gemini/Ollama/custom) + `anthropic`.

## Genetic teams — `web/lib/roster.ts` (`TEAMS`)
3 teams: **Lean** (qwen2.5-coder), **Enterprise** (deepseek-coder), **Hacker** (devstral).
Roster = **25 roles × 3 teams = 75 agents** (sprites for the 2.5D office). RPG stats
{creativity, rigor, security, speed, depth} → drive Ollama params (temperature/determinism).
Roles incl. master-spec/contracts/domain architect, backend/frontend engineer, QA/reliability,
security, completeness-critic, researcher, reference-studier, queen-bee.

## Pipeline — `web/lib/app-builder.ts` (`buildAdvance`)
plan(blueprint) → critique → brief → routes → pages → **finalize**. Genetic tournament
(`web/lib/tournament.ts` `judgeBlueprints`): 3 teams diverge → multi-judge panel → blends LLM
verdict **60%** + objective `objectiveScore` **40%**, inter-judge agreement metric, circuit breaker
(jury-down → draft), explicit rubric, **adversarial** posture. Winner builds (iteration 3).

## Modules — `web/lib/module-registry.ts` (`BUILTIN_MODULES`, ~85)
Deterministic injection: `deterministicX(config, bp) → {files, extraSql}` injected in finalize when
keywords match. Living registry: catalog (agents SEE it) → harvest (agents EXTEND it) → promote
(experimental → stable → core). Verticals e.g. `rentals-module.ts` (anti-double-booking + pricing +
refund + reviews, PARAMETERIZED to the detected table name — zero hardcoding). `scraper-smart-module.ts`
(ScrapeGraphAI), `rag-module.ts` (pgvector), `wallet-module.ts` (append-only ledger), etc.

## Evolution — `web/lib/progression.ts` + `web/lib/skill-evolution.ts`
Diary (lessons/wins/critiques, quality 0-10, nomic-embed embeddings) in `puglit_agent_diary`.
`relevantLessons`: relevance floor 0.35 + recency decay + quality≥45 + outcome≠failure (anti-poisoning).
XP = area × victory × participation → levels. **SkillOpt** (microsoft/SkillOpt): each role's skill DOC
is trainable state; an optimizer proposes BOUNDED add/delete/replace edits; accepted ONLY if it beats
the current on a HELD-OUT validation set (5 frozen tasks → blueprint rollout → `objectiveScore`);
rejected-edit buffer; active skill overlays the static playbook via `skillFor()`.

## Quality & self-healing
- `web/lib/swarm-checks.ts` — security + consistency static scan (secrets/SQLi/phantom-table).
- `web/lib/swarm-repair.ts` — phantom-table repair (infer schema from intent), frontier escalation.
- `web/lib/adversarial-review.ts` — addyosmani/**adverse** pattern: 3 orthogonal lenses
  (Auditor=logic, Adversary=abuse/security/reject-bias, Pragmatist=design) → deterministic
  cross-examination (≥2 lenses = confirmed) → **SHIP / SHIP-WITH-CAVEATS / BLOCK** + bounded repair.
- `web/scripts/build-local.mjs` — RUNTIME GATE (boots the app, smoke-tests pages, 0 5xx) + QA:
  vitest + coverage + a **Queen evidence review** (measures real coverage, bounces back below the bar).
- `web/lib/swarm-profile.ts` + `run-trace.ts` — addyosmani/**agent-house**: scores each build's
  LLM-call trace (Cost/Latency/Reliability/Context) + ranked fixes.

## Playbooks — `web/lib/playbooks.ts`
ARCHITECT, DEV (NO HARDCODING + patterns), DESIGN, REVIEW, QUEEN, TEST (Arrange-Act-Assert +
anti-patterns), ADVERSARIAL — distilled from addyosmani/agent-skills.

## The Spine — `spine/` (assembled into every generated app)
Deterministic base: auth, rate-limit, analytics, i18n, mailer, **db** (`export const pool = new Pool()`).

## Infrastructure
RunPod **A40 48GB** GPU, Postgres 14 + **pgvector**, Ollama (~77GB of models). Sidecars:
ScrapeGraphAI (`infra/scrapegraph-sidecar.py`, local Ollama). Brain persistence
(`web/lib/brain-sync.ts`): append-only tables UNION (CRDT grow-set), mutable skills arbitrated by
val_score — cloud Postgres authoritative + git/bucket snapshots (`infra/brain-snapshot.sh`/`brain-restore.sh`).

## Proof points
- **Stayforge** litmus test (Airbnb clone): 80 files, 8 tables, Postgres `EXCLUDE USING gist`
  anti-double-booking, deterministic integer-cents pricing, refund-by-policy-snapshot, double-blind
  reviews. The runtime gate exposed **7 real bugs** invisible to a green compile.
- **100-build brain-training batch** in progress (`infra/train-brain.sh` + `brain-training-ideas.tsv`):
  diverse apps (retro/Atari games, calculators, trackers, business verticals, money, catalog, quiz)
  to pre-load the brain (diary/exemplars/metrics/skills), snapshotted to git.

## SQL — `web/sql/genetic.sql`
Brain tables: puglit_agents, puglit_agent_diary, puglit_metrics, verified_exemplars, puglit_modules,
puglit_skills, puglit_skill_rejects, puglit_jobs, puglit_projects.
