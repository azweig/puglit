# 10 — Knowledge Base

> **Objetivo.** La *Knowledge Base* es la **memoria colectiva** de Puglit: el conjunto de
> estructuras en Postgres (más sus espejos en Obsidian y git) donde el enjambre acumula lo que
> aprendió build tras build. No es documentación humana — es *estado entrenable* que se inyecta
> de vuelta en los prompts de la próxima generación. Acá viven los patrones que funcionaron, los
> que fallaron, los módulos reutilizables, las skills evolucionadas y las métricas que validan la
> tesis por evidencia y no por mecanismo.

La memoria se reparte en cuatro tablas-cerebro de `web/sql/genetic.sql`, cada una con una función
distinta dentro del ciclo de aprendizaje:

| Tabla | Qué guarda | Cómo se recupera | Archivo de lógica |
|---|---|---|---|
| `verified_exemplars` | Código (route/page) de builds que pasaron el gate | Por similitud semántica (floor 0.55) | `web/lib/swarm-fitness.ts` |
| `puglit_agent_diary` | Lecciones/wins/críticas por agente, con embeddings | Por relevancia + decay (floor 0.35) | `web/lib/progression.ts` |
| `puglit_modules` | Módulos cosechados/mejorados por el enjambre | Por keyword, sólo `stable`/`core` | `web/lib/module-registry.ts` |
| `puglit_metrics` | KPIs de evidencia (build/smoke/judge/ablation) | Agregación por nombre + ventana | `web/lib/swarm-metrics.ts` |
| `puglit_skills` / `puglit_skill_rejects` | Skill docs evolucionadas + buffer de rechazos | Overlay activo por área (`skillFor`) | `web/lib/skill-evolution.ts` |

> **Nota de honestidad metodológica.** Lo que hoy se mide y persiste **automáticamente** es lo que
> tiene una tabla detrás: `puglit_metrics` (4 KPIs), `verified_exemplars`, `puglit_agent_diary`,
> `puglit_modules` y `puglit_skills`. Las secciones de *rankings* (módulos más usados, patrones más
> exitosos, timelines, insights semanales/mensuales) describen lo que la memoria **contiene** y lo
> que es **agregable** sobre esas tablas; varias de esas agregaciones todavía **no tienen un job
> dedicado** que las materialice. Donde corresponde lo aclaramos con la marca **[agregación
> futura]**. Nada acá inventa features que no estén en el código.

---

## 10.1 Top Successful Patterns

Los patrones exitosos se materializan de dos formas complementarias. La primera es **estructural y
determinística** — los `deterministicX(config, bp)` del *module-registry* que inyectan código
*correcto-por-construcción* cuando el blueprint dispara su keyword (ver `web/lib/module-registry.ts`).
La segunda es **empírica** — los `verified_exemplars`: pedazos de código de builds reales que
**pasaron el runtime gate** y se guardan para que el modelo *imite código que funciona en vez de
inventarlo*.

### Patrones determinísticos (correctos por construcción)

Estos no se "aprenden": se inyectan ya correctos. Son el piso de calidad del que parte cualquier build.

| Patrón | Módulo | Por qué es un "successful pattern" |
|---|---|---|
| Anti-double-booking | `rentals`, `booking` | Constraint Postgres `EXCLUDE USING gist` con rango half-open — imposible reservar dos veces a nivel DB, no a nivel app |
| Pricing en enteros (cents) | `rentals` | `priceQuote` determinístico, `search == checkout` (sin drift de redondeo) |
| Ledger append-only | `wallet`, `inventory` | `balance = sum(...)` no puede driftear; débito atómico sin negativos |
| Fire-and-forget seguro | `queue` | `FOR UPDATE SKIP LOCKED` + retries/backoff; **prohíbe** loops paralelos in-process |
| Secrets cifrados | `crypto` (co-inyectado) | AES-256-GCM at rest; se auto-inyecta con `payments`/`social-auth` |
| Audit hash-chained | `auditlog` | Filas encadenadas por hash → tamper-evident |

### Exemplars verificados (aprendidos de builds reales)

`storeExemplar(kind, task, code)` guarda sólo código de **80–8000 chars** que vino de un build que
pasó el gate; lo embebe con el *task* como clave. `exemplarFor(kind, taskText)` lo recupera con un
**floor de similitud de 0.55** — sólo un ejemplo *genuinamente* parecido entra al prompt, y entra con
la instrucción explícita de *imitar la estructura, no copiar el dominio*.

```
storeExemplar("route", task, code)   →  INSERT verified_exemplars (kind, task, code, embedding)
                                          (gate de longitud 80..8000, embedding de nomic-embed)

exemplarFor("route", taskText)       →  embed(taskText) → cosine vs últimos 60 del kind
                                          → mejor match si sim > 0.55, recortado a 3000 chars
```

A esto lo acompaña la presión de selección objetiva: `objectiveScore(bp)` (0–100, **sin LLM**) premia
schemas reales (cada tabla con ≥2 columnas: +14), cobertura de operaciones (routes ≥ tablas: +14) y
penaliza *phantom tables* (−4 por cada tabla referenciada y nunca declarada, hasta −20). Ese score
entra al torneo con peso 40% (el veredicto LLM pesa 60%, ver `web/lib/tournament.ts`), así la
"fitness" no depende sólo del juez ruidoso.

---

## 10.2 Top Failed Patterns

Los patrones que fallan están **codificados como detectores** — el conocimiento de "esto sale mal" no
vive en prosa sino en escáneres que los cazan y reparadores que los arreglan. Salieron del *litmus
test* (Stayforge, el clon de Airbnb) donde el runtime gate expuso **7 bugs reales invisibles a un
compile verde**.

| Failed pattern | Síntoma | Dónde se caza | Mitigación |
|---|---|---|---|
| **Phantom tables** | SQL referencia una tabla nunca `CREATE`-ada (schema alucinado) | `swarm-checks.ts` (`phantom-table`, severity high) + penalización en `objectiveScore` | `swarm-repair.ts`: decide si es typo/alias de una tabla intencionada (mapea, no inventa) o infiere columnas del uso |
| **Hardcoding** | Literales mágicos, nombres de tabla/columna, IDs, precios, límites hardcodeados | Playbook `DEV` ("NEVER HARDCODE") + crítica del completeness-critic / REVIEW | Módulos **parametrizados a la tabla detectada** (ej. `rentals` zero-hardcoding); flag en review |
| **`pool()` bug** | Llamar al pool como función en vez de usar `pool.query` / mal import de `db` | Spine canónico: `export const pool = new Pool()` (`spine/`) | El spine determinístico provee el `db` correcto; los agentes lo importan, no lo reescriben |
| **JSON over-escape** | El modelo sobre-escapa JSON (doble escape) y rompe el parseo | Defensa en parseo (try/catch + fallback) en `relevantLessons`/`exemplarFor` al leer `embedding` | Lectura tolerante: `Array.isArray(v) ? v : JSON.parse(...)` con `catch → []` |
| **Hardcoded secret** | `sk-…`, `AKIA…`, `ghp_…` en el código | `swarm-checks.ts` regex de secretos (severity high) | Escalado a frontier si el local no lo arregla; co-inyección de `crypto` |
| **Schema/route name mismatch** | El route usa un nombre de tabla distinto al del schema | Playbook `REVIEW` (coherencia & naming: una concepto = un nombre) | Flag de "ONE name per concept" |

> **Anti-poisoning como failed-pattern de la propia memoria.** Un riesgo de meta-nivel es que una
> lección *de un build malo* contamine los futuros. `relevantLessons` lo previene: sólo recupera
> lecciones con `quality ≥ 45` y `outcome ≠ 'failure'`, con un **floor de relevancia 0.35** (una
> lección de fintech no se fuerza en un build de health) y **decay de recencia** (half-life ~31 días).
> Si nada supera el floor, devuelve vacío: *"no advice beats wrong advice"*.

---

## 10.3 Common Build Errors

Las clases de error que el sistema reconoce y a las que reacciona. Las severidades vienen de
`swarm-checks.ts`; la disposición final (SHIP / SHIP-WITH-CAVEATS / BLOCK) de `adversarial-review.ts`.

| Clase de error | Severidad | Detector |
|---|---|---|
| `phantom-table` | high | `securityScan` / consistency scan |
| `sql-injection` | high | SQL armado por concatenación de strings |
| `hardcoded-secret` | high | regex de keys reales committeadas |
| `dangerous-exec` | high | `eval` / `exec` |
| `hardcoded-credential` | med | credencial = string literal (en vez de `process.env`) |
| Runtime 5xx | bloqueante | `web/scripts/build-local.mjs` — bootea la app y smoke-testea las páginas (gate: **0 5xx**) |
| Cobertura de tests por debajo de la barra | bloqueante | QA gate: vitest + coverage + **Queen evidence review** (mide cobertura real, rebota) |

El insight central del litmus test: **un compile verde no es evidencia**. El *runtime gate* de
`build-local.mjs` arranca la app y prueba las páginas; ahí aparecieron los 7 bugs de Stayforge que
TypeScript no veía.

---

## 10.4 Common Repair Actions

Las reparaciones son **acotadas y determinísticas** primero, con escalada a un modelo más fuerte sólo
para lo que el local no puede.

| Acción de reparación | Trigger | Lógica |
|---|---|---|
| **Phantom-table reconcile** | `phantom-table` detectada | `swarm-repair.ts`: el reparador decide typo→alias (`CREATE VIEW alias AS SELECT * FROM real_table`) vs tabla nueva (infiere columnas/tipos/keys del uso). La intención del arquitecto es ground-truth |
| **Frontier escalation** | Bug que el local no arregla (ej. seguridad) | `frontierEscalate()` — presupuesto **acotado** por build (`PUGLIT_FRONTIER_BUDGET`), modelo en `PUGLIT_FRONTIER_MODEL`, temp 0.1; devuelve `null` si no hay budget/config |
| **Adversarial bounded repair** | 3 lentes (Auditor/Adversary/Pragmatist) confirman (≥2) un problema | `adversarial-review.ts` → reparación acotada o BLOCK |
| **Best-of-N (rejection sampling)** | Generación ruidosa | `generateBest(gen, score, N)` corre N veces y se queda con el de mayor objective score (`PUGLIT_BEST_OF`) |
| **Lesson injection** | Próximo prompt del agente | `relevantLessons`/`recentLessons` inyectan las lecciones diary como few-shot |

---

## 10.5 Most Used Modules

El catálogo builtin tiene **~85 módulos** (`BUILTIN_MODULES` en `web/lib/module-registry.ts`),
agrupados por categoría. Un módulo se "usa" cuando su `deterministicX` se inyecta en *finalize* porque
el blueprint disparó su keyword, o cuando aparece como dependencia dura vía `MODULE_REQUIRES`.

**Distribución del catálogo por categoría** (conteo real sobre `BUILTIN_MODULES`):

| Categoría | Aprox. | Ejemplos |
|---|---|---|
| `util` | mayoría | queue, storage, cache, stats, charts, wallet, validation, booking, reviews |
| `integration` | ~25 | payments, billing, nango, crm, ecommerce, sso, bi, shipping |
| `channel` | ~7 | telegram, email, whatsapp, slack, discord, teams |
| `agent` | ~10 | llm, rag, agent (JARVIS), voice, graphify, memorygraph, docparse, ocr |

Los módulos con **más entrada por dependencia** (los que se co-inyectan más seguido por
`MODULE_REQUIRES` → `dependencyClosure`) son estructuralmente los más "usados":

| Módulo base | Lo arrastran |
|---|---|
| `crypto` | social-auth, billing, payments, agent |
| `llm` | moderation, rag, agent, graphify |
| `storage` | imagegen, media |
| `realtime` | inappnotify |
| `stats` | charts |
| `validation` | forms |

> **[Agregación futura].** El conteo de *cuántas veces* cada módulo se inyectó en builds reales
> requiere agregar sobre las trazas de build (`run-trace.ts` / `puglit_metrics.meta`). Hoy ese
> ranking no se materializa en una tabla; lo que es real y verificable es el **catálogo** y el **grafo
> de dependencias** que define qué se co-inyecta.

---

## 10.6 Most Successful Modules

"Exitoso" = el módulo que, cuando se inyecta, **no genera bugs de runtime** porque su corrección está
garantizada por construcción (constraint DB, atomicidad, idempotencia) en vez de depender del LLM.

| Módulo | Garantía de corrección |
|---|---|
| `rentals` | Constraint `EXCLUDE USING gist`, pricing integer-cents, refund-by-policy-snapshot, double-blind reviews — **parametrizado a la tabla detectada** (zero hardcoding). Ships `scripts/verify-rentals.mjs` + `/api/health` |
| `wallet` | Ledger append-only, balance = sum (no puede driftear), débito atómico sin negativos |
| `queue` | `FOR UPDATE SKIP LOCKED` + retries/backoff — el fire-and-forget **seguro** |
| `inventory` | Reserva atómica, sin overselling, vía ledger append-only |
| `auditlog` | Filas hash-chained (tamper-evident) |
| `booking` | freeSlots() + book() con prevención de double-booking |

El denominador común: estos módulos llevan **su propia prueba** (ej. `verify-rentals.mjs`) y mueven la
corrección al nivel del schema/constraint, donde el modelo no la puede romper.

> **[Agregación futura].** Un ranking de éxito *medido* (smoke-pass-rate condicionado a tener el
> módulo X) saldría de cruzar `puglit_metrics.smoke_pass` con la lista de módulos inyectados por build.
> La infraestructura de métricas existe (`recordMetric`/`metricRate`); el corte por módulo todavía no
> se computa.

---

## 10.7 Most Problematic Modules

Los más problemáticos son, por diseño, los que dependen de **un gateway externo** o de **un LLM** —
ahí entra la varianza que los módulos determinísticos eliminan.

| Fuente de problema | Módulos afectados | Por qué |
|---|---|---|
| Dependen de gateway Docker | scraper, whatsapp, pdf, media, docgen, ocr, crm, ecommerce, sso, bi, n8n, … | El build puede estar perfecto pero el sidecar no estar levantado/configurado |
| Dependen de LLM (varianza) | moderation, rag, agent, graphify | Su salida no es determinística; entran en `MODULE_REQUIRES.llm` |
| Riesgo legal / gris | `scraper` (cookies de sesión, LinkedIn/paywalls) | Ban risk explícito en su propia descripción |
| **Harvest sin gobernanza** | módulos auto-cosechados (`harvestModules`) | Entran como `experimental`; `findCustomModulesFor` **filtra** y sólo deja pasar `stable`/`core` para que no contaminen builds reales (crítica: catalog rot) |

El ciclo de vida de harvest es la mitigación central: **experimental → candidate → stable → core**.
Un módulo cosechado del trabajo del propio enjambre no toca un build de producción hasta que un humano
o un proceso lo **promueve** (`promoteModule`). Eso convierte "módulo problemático" en un estado
*transitorio y aislado*, no en deuda.

---

## 10.8 Evolution Timeline

Las mejoras de esta línea de trabajo, cada una atada a su archivo y a la crítica que la motivó.
Conceptualmente es la "historia evolutiva" de la base de conocimiento.

| Hito | Qué introdujo | Archivo |
|---|---|---|
| **No-hardcode discipline** | Playbook `DEV` con "NEVER HARDCODE"; módulos verticales parametrizados a la tabla detectada (rentals) | `web/lib/playbooks.ts`, `web/lib/module-registry.ts` |
| **QA / coverage gate** | Runtime gate que bootea la app (0 5xx) + vitest + coverage + **Queen evidence review** que mide cobertura real y rebota debajo de la barra | `web/scripts/build-local.mjs` |
| **Adverse (adversarial review)** | Patrón addyosmani/adverse: 3 lentes ortogonales (Auditor/Adversary/Pragmatist) → cross-examination (≥2 = confirmado) → SHIP / SHIP-WITH-CAVEATS / BLOCK | `web/lib/adversarial-review.ts` |
| **Agent-house (build profiling)** | Scorea la traza de LLM-calls de cada build (Cost/Latency/Reliability/Context) + fixes rankeados | `web/lib/swarm-profile.ts` + `run-trace.ts` |
| **SkillOpt** | El skill DOC de cada rol es estado entrenable; un optimizer propone edits **acotados** (add/delete/replace), aceptados **sólo si baten al actual** en un validation set de 5 tasks congeladas; buffer de rechazos | `web/lib/skill-evolution.ts`, tablas `puglit_skills` / `puglit_skill_rejects` |

El patrón común de toda la timeline: **medir por evidencia, no por mecanismo**. Cada mejora reemplaza
una señal débil (compile verde, juez LLM solo, XP) por una fuerte (runtime smoke, validation set,
constraint DB).

---

## 10.9 Weekly Insights

> **[Agregación futura — parcialmente automatizable hoy].** Los *weekly insights* se computan sobre
> `puglit_metrics` con la ventana que ya soporta `metricRate(name, sinceDays)`. El **scorecard**
> headline existe y agrega los cuatro KPIs que los críticos dijeron que hacen o rompen la tesis:

```
scorecard() → {
  build_success:     { rate, n },   // first-build-success-rate
  smoke_pass:        { rate, n },   // runtime smoke-pass-rate (0 5xx)
  judge_agreement:   { rate, n },   // inter-judge agreement del panel
  ablation_swarm_win:{ rate, n },   // swarm vs single (ablación)
}
```

Un "weekly insight" se obtiene llamando `metricRate(name, 7)` para cada KPI y comparándolo contra la
ventana de 30 días (default). La **diferencia semana-vs-mes** por KPI es el insight. Lo que **falta**
para que sea automático es un job que persista el snapshot semanal (hoy `scorecard()` se calcula
on-demand, no se historiza en una tabla aparte). La materia prima (`puglit_metrics`, indexada por
`(name, created_at DESC)`) ya está.

| Insight semanal | Cómo se deriva | Estado |
|---|---|---|
| First-build-success ↑/↓ | `metricRate("build_success", 7)` vs 30d | Calculable on-demand |
| Smoke-pass ↑/↓ | `metricRate("smoke_pass", 7)` | Calculable on-demand |
| Acuerdo inter-juez | `metricRate("judge_agreement", 7)` | Calculable on-demand |
| Ablación swarm-win | `metricRate("ablation_swarm_win", 7)` | Calculable on-demand |
| Lecciones nuevas / semana | `COUNT(*) puglit_agent_diary WHERE created_at > now()-7d` | [Agregación futura] |
| Exemplars nuevos / semana | `COUNT(*) verified_exemplars …` | [Agregación futura] |

---

## 10.10 Monthly Insights

El default de `metricRate` ya es **30 días**, así que el scorecard mensual es de hecho el
comportamiento por defecto de `scorecard()`. Los insights mensuales que la base de conocimiento puede
sostener:

| Insight mensual | Fuente | Estado |
|---|---|---|
| Scorecard de los 4 KPIs (rate + n) | `scorecard()` (default 30d) | **Automático on-demand** |
| Crecimiento del catálogo de módulos | `puglit_modules` (cuántos promovidos a `stable`/`core`) | [Agregación futura] |
| Evolución de skills aceptadas vs rechazadas | `puglit_skills.val_score` vs `puglit_skill_rejects` | [Agregación futura] |
| Subida de nivel agregada del roster | `puglit_agents.level/xp` (75 agentes) | Consultable, sin snapshot histórico |
| Brain growth | `brain-sync.ts` (UNION append-only / CRDT grow-set) + snapshots git/bucket | Persistido por snapshot, no por reporte |

La persistencia mensual está garantizada a nivel de **datos crudos** por `brain-sync.ts` (tablas
append-only unidas como grow-set CRDT; skills mutables arbitradas por `val_score`; cloud Postgres
autoritativo + snapshots a git/bucket vía `infra/brain-snapshot.sh`). Lo que aún no existe es la capa
de **reporte** que destile esos datos en una narrativa mensual.

---

## 10.11 Trend Analysis

El análisis de tendencias se apoya en que **toda métrica es una serie temporal**: `puglit_metrics`
guarda `(name, value, created_at)` y está indexada por `(name, created_at DESC)`, así que cualquier KPI
es ploteable en el tiempo sin trabajo extra de esquema.

**Tendencias que la arquitectura ya habilita:**

1. **Curva de aprendizaje del enjambre** — `build_success` y `smoke_pass` en el tiempo: si la memoria
   funciona, deberían subir a medida que `verified_exemplars` y `puglit_agent_diary` crecen. Es la
   hipótesis central de Puglit, y es **medible** con la infra actual.
2. **Convergencia de jueces** — `judge_agreement` en el tiempo (el panel se vuelve más coherente).
3. **Ventaja del enjambre** — `ablation_swarm_win` sostenido > 0.5 valida swarm-vs-single.
4. **Maduración de skills** — `val_score` de `puglit_skills` por versión: cada versión aceptada batió
   a la anterior en el validation set de 5 tasks, así que la serie de versiones es monótona en val.

```
Serie temporal lista para tendencia (sin esquema nuevo):
  puglit_metrics(name, value, created_at)  ──▶  GROUP BY date_trunc('week', created_at)
                                                  AVG(value)  ──▶  tendencia por KPI
```

**El plan de carga de la base.** La tendencia más importante en curso es la **100-build
brain-training batch** (`infra/train-brain.sh` + `brain-training-ideas.tsv`): apps diversas (juegos
retro/Atari, calculadoras, trackers, verticales de negocio, money, catálogos, quizzes) que pre-cargan
diary/exemplars/metrics/skills y se snapshotean a git. Esa batch es, literalmente, la generación del
dataset sobre el cual el trend analysis pasa de "habilitado por la arquitectura" a "poblado con datos
reales".

> **Resumen de honestidad.** Medido y persistido hoy de forma automática: los 4 KPIs de
> `puglit_metrics` (vía `recordMetric`/`metricRate`/`scorecard`), los `verified_exemplars`, el
> `puglit_agent_diary` con anti-poisoning, los `puglit_modules` con lifecycle, y `puglit_skills`/
> `puglit_skill_rejects` con val-gating. Requiere agregación/reporte futuro: los rankings de uso por
> módulo, los conteos semanales/mensuales de lecciones y exemplars, los snapshots históricos del
> scorecard, y la narrativa de insights. La **materia prima** para todos ellos ya está en Postgres y
> indexada — falta el job que la destile, no los datos.
