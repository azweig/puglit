# Hallazgos de GitHub Trending — infra del swarm (no son módulos de app)

De la revisión de trending (2026-06-21). Los 5 módulos de app ya entraron al catálogo
(docparse, memorygraph, socialsearch, forecast, compress). Estos 4 son **infra/swarm** —
mejoras para Puglit mismo, no para inyectar en apps generadas. Pendientes de adoptar:

## LMCache/LMCache (~9K ⭐) — acelerar el Ollama de la GPU box
KV-cache layer para LLM serving → respuestas más rápidas / más throughput en el A40.
**Adoptar en:** `infra/setup-gpu-box.sh`, delante de Ollama/vLLM. Acelera TODO el swarm.

## tashfeenahmed/freellmapi (~11K ⭐) — fallback gratis de LLM
Proxy OpenAI-compatible que apila 16 tiers gratis detrás de un endpoint.
**Adoptar:** ya funciona con el módulo `llm` y con el provider abstraction del swarm —
basta apuntar `LLM_BASE_URL` / `MODELS.*` a una instancia de freellmapi cuando el local sature.
Cero código nuevo, solo config.

## colbymchenry/codegraph (~53K) + DeusData/codebase-memory-mcp (~10K) — code intelligence
Knowledge-graph del código (auto-sync). Que el swarm "entienda" el código generado →
mejor critic/repair/hardening (menos errores tipo el FK a `users` de la calculadora).
**Adoptar:** como MCP server que el critic/backstop consulten. Proyecto interno mediano.

## NVIDIA/SkillSpector (~9K ⭐) — escaneo de seguridad de código de agentes
Detecta vulnerabilidades/patrones maliciosos en skills/código de agentes.
**Adoptar:** como paso de **hardening** en el pipeline de build (escanear los files generados
por secrets hardcodeados, eval, SQLi, etc.) antes de entregar. Sube la calidad/seguridad del output.

---
**Resumen:** módulos de app = hechos. Infra = roadmap (acelerar LLM, fallback gratis, code-graph
para el critic, security-scan en el harden). Ver [[project_puglit_connectors]] y [[project_puglit_genetic]].
