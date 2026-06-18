# LLM providers — run local, BYOK, or mix

Puglit's whole multi-agent pipeline (interview → spec → blueprint → routes/pages or game →
3 stakeholder supervisions → CI) talks to **one** client: `lib/openai.ts`. It's
provider-agnostic, so you choose the "brain" without touching any agent.

## TL;DR

- **Default = 100% local & free** on **Ollama + Gemma**. Clone, `ollama pull gemma2`, run. No key.
- **BYOK** to OpenAI, Gemini, Anthropic/Claude, or **any** OpenAI-compatible endpoint.
- **Mix per tier**: e.g. local Gemma for cheap work, Claude/GPT-5 for the heavy `premium` tier.

## Two protocols cover everything

| Provider    | Protocol            | Notes                                                        |
|-------------|---------------------|-------------------------------------------------------------|
| `ollama`    | OpenAI-compatible   | **Default.** Local, no key. `http://localhost:11434/v1`     |
| `openai`    | OpenAI              | `OPENAI_API_KEY`                                            |
| `gemini`    | OpenAI-compatible   | `GEMINI_API_KEY` (Google's OpenAI-compat endpoint)          |
| `anthropic` | Anthropic Messages  | `ANTHROPIC_API_KEY` — handled by a built-in adapter         |
| `custom`    | OpenAI-compatible   | Any base URL: OpenRouter, Together, vLLM, remote Ollama…    |

> **Provider ≠ model.** Open-weight models — **Gemma, Hermes, DeepSeek, Qwen, Llama, Mistral** —
> are just model *names* under `ollama` (or `custom`). You don't need a new provider for them;
> set `PUGLIT_MODEL_*` to the model you pulled.

## Quick start — local (default)

```bash
ollama serve
ollama pull gemma2          # balanced/cheap
ollama pull gemma2:27b      # premium (needs a beefy GPU; or reuse gemma2)
# nothing to configure — Puglit defaults to ollama + gemma2
```

Verify: `GET /api/doctor` (config) or `GET /api/doctor?ping=1` (live check).

## Model presets (Ollama)

| Tier     | Gemma        | Hermes        | DeepSeek            | Qwen          | Llama          |
|----------|--------------|---------------|---------------------|---------------|----------------|
| premium  | `gemma2:27b` | `hermes3:70b` | `deepseek-r1:32b`   | `qwen2.5:32b` | `llama3.3:70b` |
| balanced | `gemma2`     | `hermes3:8b`  | `deepseek-r1:14b`   | `qwen2.5:14b` | `llama3.1:8b`  |
| cheap    | `gemma2:2b`  | `hermes3:3b`  | `deepseek-r1:1.5b`  | `qwen2.5:3b`  | `llama3.2:3b`  |

Set them with `PUGLIT_MODEL_PREMIUM` / `PUGLIT_MODEL_BALANCED` / `PUGLIT_MODEL_CHEAP`.

## BYOK (paid, at any level)

```bash
# all cloud
PUGLIT_PROVIDER=openai      # + OPENAI_API_KEY
PUGLIT_PROVIDER=gemini      # + GEMINI_API_KEY
PUGLIT_PROVIDER=anthropic   # + ANTHROPIC_API_KEY
```

### Mix: local everywhere, Claude only for the heavy tier
```bash
PUGLIT_PROVIDER=ollama
PUGLIT_PREMIUM_PROVIDER=anthropic
PUGLIT_PREMIUM_API_KEY=sk-ant-...
# premium agents → Claude; balanced/cheap → local Gemma
```

### Any OpenAI-compatible gateway (OpenRouter, Together, LiteLLM…)
```bash
PUGLIT_PROVIDER=custom
PUGLIT_BASE_URL=https://openrouter.ai/api/v1
PUGLIT_API_KEY=...
PUGLIT_MODEL_PREMIUM=anthropic/claude-3.7-sonnet   # whatever the gateway exposes
```

## Capabilities & quality notes

- **JSON**: weaker/local models wrap JSON in prose — the client strips fences, extracts the
  outer object, and retries once with a stricter instruction. Anthropic has no JSON mode; it's
  prompted + parsed the same way.
- **Vision** (the references step reads images): needs a vision-capable model. Text-only Gemma
  skips images with a note. Use a vision model (llava, gemma3, GPT-4o, Gemini, Claude) or set
  `PUGLIT_VISION=always`.
- **Quality**: small local models are lower-fidelity and smaller-context for the heavy tasks
  (blueprint, full pages, supervision). For best results either run a big local model
  (`gemma2:27b`, `llama3.3:70b`) or point `PUGLIT_PREMIUM_PROVIDER` at a frontier cloud model.
- **Image generation** (the build-visualization office sprites in `scripts/gen-*.mjs`) uses
  OpenAI `gpt-image-1` and is **not** part of the product-generation runtime — the pipeline is
  text + vision only, so it runs fully on local models.
