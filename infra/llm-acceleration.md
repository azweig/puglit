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

## 2. freellmapi — fallback gratis cuando el local satura
Proxy OpenAI-compatible que apila 16 tiers gratis detrás de un endpoint. Útil para los TIERS
no-críticos (brief, QC, page-gen) cuando el A40 está ocupado con codegen pesado.

```bash
# levantar freellmapi (ver su README) → expone http://localhost:8787/v1
```
En `web/.env.local`, ruteo por tier (la abstracción ya lo soporta):
```
PUGLIT_PREMIUM_BASE_URL=http://localhost:8787/v1   # judge/brief/QC al fallback gratis
PUGLIT_PREMIUM_API_KEY=...                          # la key de freellmapi
# MODELS.code se queda LOCAL en el A40 (codegen pesado, calidad)
```
→ **Cero código**: la provider abstraction (`resolve(model)` por tier) ya lee estos env.

## Orden recomendado
1. Migrar codegen a **vLLM + LMCache** (la mayor ganancia de velocidad).
2. **freellmapi** para tiers livianos en picos.
3. Medir tokens/seg antes/después (el panel de jurados es el mejor benchmark — 3 prompts con
   prefijo común en paralelo).

Ver [[project_puglit_genetic]] (provider abstraction tier-aware) y [[infra_puglit_gpu_box]].
