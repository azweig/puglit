# Acelerar el LLM del swarm (infra) — LMCache + freellmapi

Dos mejoras de los hallazgos de trending, para el A40 / la provider abstraction del swarm.
No tocan el código de generación; son config de infra.

## 1. LMCache — KV-cache para acelerar el serving
Cachea los KV de prompts repetidos (system prompts, playbooks, contexto) → menos recomputo,
más throughput. El swarm reusa los MISMOS system prompts (architect/dev/critic) en cada agente,
así que el hit-rate es altísimo.

**Mejor con vLLM** (LMCache se integra nativo):
```bash
pip install lmcache vllm
# vLLM con LMCache (ejemplo)
LMCACHE_CONFIG_FILE=lmcache.yaml \
  vllm serve qwen2.5-coder:32b --kv-transfer-config '{"kv_connector":"LMCacheConnector"}' \
  --port 11434 --api-key local
```
`lmcache.yaml`: backend `local_cpu: true` (RAM) o `local_disk` para más capacidad.
→ apuntá `MODELS.code` / `PUGLIT_CODE_BASE_URL` al puerto de vLLM. Mismo OpenAI-compat, sin cambios.

> Si seguís en Ollama (no vLLM), Ollama ya cachea el KV del último prompt; LMCache rinde
> cuando hay MUCHOS prompts con prefijo común en paralelo (nuestro caso con el panel de jurados).

## 2. freellmapi — ~1.7B tokens GRATIS/mes (review a fondo, MIT, 11.3K⭐, v0.4.1 jun-2026)
NO es solo un fallback: es un **proxy OpenAI-compat que agrega 16+ providers de tier gratis**
con **failover automático**, rate-tracking por key, sticky sessions y keys cifradas (AES-256-GCM).
Soporta `/v1/chat/completions` (stream), `/v1/embeddings`, **tool calling**, vision. Drop-in en
nuestra provider abstraction.

**Lo grande:** da acceso a modelos MÁS GRANDES de los que entran en el A40, gratis:
- **Cerebras Qwen3-235B**, **DeepSeek V4** (HF/OpenCode), **GLM-4.7**, Mistral **Codestral**,
  Groq **Llama 4** (rapidísimo), Gemini 2.5 Flash. Varios > qwen2.5-coder:32b local.

**Levantar (Docker):**
```bash
git clone https://github.com/tashfeenahmed/freellmapi && cd freellmapi
ENCRYPTION_KEY="$(openssl rand -hex 32)"; printf "ENCRYPTION_KEY=%s\nPORT=3001\nHOST_BIND=0.0.0.0\n" "$ENCRYPTION_KEY" > .env
docker compose up -d   # ~40MB RAM idle; cargás las free keys en el dashboard :5173
```

**Wiring en el swarm (cero código, solo env por tier):**
```
# codegen pesado → modelo GRANDE gratis (mejor que el 32B local) con A40 como fallback confiable
PUGLIT_CODE_BASE_URL=http://localhost:3001/v1
PUGLIT_CODE_API_KEY=freellmapi-...        # model: "qwen-3-235b" o "auto"
# tiers livianos (brief/QC/page) → Groq/Gemini Flash gratis y rápido
PUGLIT_PREMIUM_BASE_URL=http://localhost:3001/v1
PUGLIT_PREMIUM_API_KEY=freellmapi-...
```

**⚠️ Caveats honestos (de su propia doc):**
- **Sin frontier** (techo ~Qwen3/GLM-4.5, NO GPT-5/Opus) → para el **judge/critic** preferí el
  mejor disponible y **consistente** (mismo modelo) — no lo dejes rotar mid-scoring.
- **Degrada** cuando los top free pegan el cap diario → routea a modelos más débiles.
- **Sin SLA** → invertí la lógica: freellmapi para volumen, **A40 local como fallback CONFIABLE**.
- **ToS zona gris**: Cohere prohíbe uso personal; Gemini/GitHub/NVIDIA "caution". Elegí providers OK.
→ **Cero código**: `resolve(model)` por tier ya lee estos env.

## Orden recomendado
1. Migrar codegen a **vLLM + LMCache** (la mayor ganancia de velocidad).
2. **freellmapi** para tiers livianos en picos.
3. Medir tokens/seg antes/después (el panel de jurados es el mejor benchmark — 3 prompts con
   prefijo común en paralelo).

Ver [[project_puglit_genetic]] (provider abstraction tier-aware) y [[infra_puglit_gpu_box]].
