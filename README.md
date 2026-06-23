<div align="center">

# 🐶 Puglit

### A self-hosted, genetic multi-agent system that builds complete SaaS apps.

**Describe an idea → a swarm of competing AI teams designs, builds, tests and reviews a full
Next.js + Postgres app — and gets better at it with every build.**

`Open-source` · `100% local on Ollama` · `BYO any provider` · `Self-evolving`

</div>

---

## What is this?

Most AI app-builders are one model, one shot — they hallucinate schemas and reinvent the 80% of
"boring" production plumbing (auth, rate-limiting, payments, analytics) badly. **Puglit takes a
hybrid approach:** the deterministic 80% is injected from a stable **Spine** + a library of vetted
**modules**, and the LLM compute is spent only on the 20% that's actually bespoke — the domain logic
and the UI. Then it runs the result like real software: **it boots the app and tests it.**

The generation itself is a **genetic tournament**: three teams (Lean, Enterprise, Hacker) each design
a blueprint with a different model + philosophy → a judge panel picks a winner → the winner is built →
the swarm earns XP, writes lessons, and **evolves its own skills** so the next build is better.

> 📖 Full technical deep-dive: **[`docs/whitepaper/`](docs/whitepaper/)** (17 documents — architecture,
> agent system, evolution engine, judge, module genome, quality/self-healing, economics, failure modes…).

---

## ⚡ Quick start — one command

```bash
git clone https://github.com/azweig/puglit.git
cd puglit
./setup.sh
```

The **Intelligent Setup Wizard** detects your hardware (CPU/RAM/GPU/VRAM/Docker/Ollama), recommends an
AI profile, installs Ollama + the right models, writes `.env`, prepares Postgres, and health-checks
everything. Then:

```bash
cd web && npm run dev      # → http://localhost:3000/generate
```

### AI profiles (the wizard picks one for you)

| Profile | For | What it installs |
|---|---|---|
| **Full Local** | 64GB+ / strong GPU | the best Ollama-runnable models (qwen2.5-coder:32b, qwen2.5:32b, deepseek-coder, gemma2) — **$0 inference** |
| **Balanced** | mid GPU / standard dev box | the best quality/perf local models (qwen-coder:7b, qwen2.5:14b, gemma2) |
| **API-Only** | no GPU / small VPS | nothing — BYO OpenAI / Anthropic / Gemini / OpenRouter keys (stored only in your local `.env`) |
| **Hybrid** | cost/perf optimized | local for frequent tasks + API for the hard ones |

> The giant MoE leaders (GLM-5.2, DeepSeek-V4, Nex-N2-Pro) don't fit a single GPU — use them via a
> provider API in the **premium** tier. Puglit is provider-agnostic (OpenAI-compatible + Anthropic).

---

## How it works

```
idea → INTERVIEW (founder Q&A, evolvable style, resumable draft)
     → CONTRACTS  (types + API contract)            ← spec-first
     → BLUEPRINT  (3 teams diverge: tables/routes/pages, each model+philosophy)
     → JUDGE      (adversarial panel, blended 60% verdict / 40% objective fitness)
     → BUILD      (winner): contracts declared first → routes → pages (dep-ordered)
     → FINALIZE   (inject modules · QA tests+coverage · adversarial review · self-heal)
     → RUNTIME GATE (boots the app, smoke-tests every page, asserts no 5xx)
     → EVOLVE     (XP/levels · diary lessons · SkillOpt validation-gated skill training)
```

**The quality philosophy:** measure by *execution*, not compilation. A green `tsc` lies — the runtime
gate boots the real app and hits it. On the **Stayforge** litmus test (an Airbnb clone with atomic
anti-double-booking, deterministic pricing, refund-by-policy, double-blind reviews) the gate caught
**7 real bugs** invisible to the compiler.

---

## Features

- **🧬 Genetic evolution** — 3 teams (75 agent personas) compete; winners earn XP; a per-area **diary**
  of lessons is retrieved by relevance; **SkillOpt** trains each role's skill doc with a held-out
  validation gate (no weight changes, zero inference-time cost).
- **🧩 Living module genome** — 85+ built-in modules (auth, payments, rag, rentals, wallet, scrape…)
  injected deterministically; the swarm **harvests** new ones + a **curator** vets them; gaps it
  *wished* existed get **built** automatically.
- **🛡️ Multi-layer quality** — security + consistency scans, phantom-table auto-repair, a **runtime
  gate**, **vitest + coverage** with a Queen evidence-review loop, and an **adversarial review**
  (Auditor / Adversary / Pragmatist lenses, cross-examined → SHIP / CAVEATS / BLOCK).
- **📈 Self-profiling** — every build's LLM-call trace is scored (cost / latency / reliability /
  context) with ranked fixes.
- **🧠 Durable brain** — the learning (diary, exemplars, metrics, skills, modules) persists with a
  merge-aware sync (CRDT-union + objective-score arbitration). Dashboard at `/brain`.
- **✏️ Iterate / diff** — change a built app surgically ("add a city filter") without rebuilding.
- **📄 Outputs** — preview, GitHub/Vercel export (BYO token), a PDF project report.

---

## Configuration

Everything lives in `web/.env.local` (the wizard generates it). Key knobs:

| Var | What |
|---|---|
| `PUGLIT_PROVIDER` | `ollama` (default, local) · `openai` · `gemini` · `anthropic` · `custom` |
| `PUGLIT_MODEL_{PREMIUM,BALANCED,CHEAP,CODE}` | per-tier model override |
| `OPENAI_BASE_URL` / `OPENAI_API_KEY` | point any OpenAI-compatible endpoint (e.g. SiliconFlow) |
| `POSTGRES_*` | the brain DB (local, or a managed Postgres for durability) |
| `PUGLIT_GEN_BATCH` · `PUGLIT_BUILD_TOKEN_CAP` · `PUGLIT_COVERAGE_BAR` | perf / budget / QA gates |

---

## Requirements

- **Node 18+**, **Postgres 14+** (with `pgvector` for semantic retrieval).
- For local inference: **Ollama** + a GPU (an RTX 4090 / A40 48GB runs the Full Local profile; smaller
  GPUs → Balanced; no GPU → API-Only).
- Optional gateways (Docker): MinIO, Meilisearch, scraper/OCR/PDF sidecars, n8n, Nango.

---

## Operations

```bash
bash infra/rebuild.sh           # build + serve + watchdog + seed (GPU box)
bash infra/train-brain.sh       # batch-train the brain over a list of ideas
bash infra/brain-snapshot.sh    # back up the brain to git/bucket
curl -X POST .../api/admin/evolve-skills   # offline skill + interview-style evolution
```

---

## License

MIT (core). Self-hosted, your keys never leave your machine, your generated apps are yours.

<div align="center"><sub>Built by a solo dev with a swarm of pugs. 🐶</sub></div>
