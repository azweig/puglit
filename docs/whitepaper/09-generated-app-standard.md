# 09 — Generated Applications Standard

> **Objetivo.** Definir, sin ambigüedad, qué constituye una *aplicación válida* generada por Puglit: la base determinista que toda app hereda (el Spine), los componentes obligatorios, los estándares de base de datos, API, seguridad, UI, performance, accesibilidad, testing y deployment, y el conjunto de *gates* automáticos que una build debe pasar antes de considerarse entregable. Este documento es el contrato. Cada afirmación está verificada contra el código real en `/Users/alvaroz/projects/2026/puglit` (`spine/`, `web/scripts/build-local.mjs`, `web/lib/app-builder.ts`).

---

## 1. Generated App Philosophy

Puglit no genera *cualquier* aplicación: genera aplicaciones que comparten una **misma columna vertebral determinista** (el Spine) y un **mismo conjunto de invariantes** que el swarm de agentes nunca puede romper. La filosofía se resume en tres principios.

**Half product, half determinism.** Lo que es *commodity* en todo SaaS — autenticación, rate limiting, analytics, mailer, i18n, pool de Postgres — no se le pide al modelo. Vive pre-escrito en `spine/`, testeado, y se ensambla en cada app. Los agentes sólo escriben lo *bespoke*: las tablas del dominio, los route handlers, las páginas. Esto sube el piso de calidad sin depender de un modelo mejor, y elimina la clase de bugs más cara (un JWT mal verificado, un pool mal configurado).

**Real software, not a green compile.** La definición de "válida" no es "compila". Una app válida **bootea, responde sin 5xx en sus páginas estáticas, carga su SQL contra un Postgres real, y pasa vitest + coverage**. El `RUNTIME GATE` de `build-local.mjs` existe precisamente porque un compilado verde miente: en el litmus test *Stayforge* (clon de Airbnb) el gate expuso **7 bugs reales** invisibles a `tsc`.

**No hardcoding, no external deps.** El estándar `DEV` (de `web/lib/app-builder.ts`, constante `RULES`) prohíbe paquetes npm fuera de React + `fetch` + el Spine — nada de `framer-motion`, `swr`, `axios`, `uuid`, `zod`, `jsonwebtoken`, `bcrypt` en rutas bespoke. Todo lo que el modelo necesita ya está en el Spine y se importa desde `@/lib/*`. El módulo `hardenRoute` (regla 6) elimina deterministamente cualquier import externo que se haya colado y lo reescribe al equivalente del Spine.

| Pregunta | Respuesta del estándar |
|---|---|
| ¿Qué escribe el modelo? | Tablas del dominio, route handlers, páginas, tests |
| ¿Qué NO escribe nunca? | Auth, rate-limit, analytics, mailer, i18n, db pool |
| ¿Qué prueba que "funciona"? | tsc → SQL load → vitest+coverage → boot+smoke (0 5xx) |
| ¿Qué deps puede agregar? | Ninguna fuera de las del Spine |
| ¿Quién es dueño del resultado? | El usuario (BYO GitHub/Vercel; Puglit no persiste tokens) |

---

## 2. Mandatory Components

Toda app generada hereda, sin excepción, los siguientes componentes del Spine. Son **obligatorios**: un build que los pierda no es una app Puglit válida. Cada uno es genérico y agnóstico de dominio.

### 2.1 Auth — `spine/lib/auth.ts`

Sesión **stateless JWT** firmada con `JWT_SECRET` (HS256, vía `jose`). El token viaja como cookie `httpOnly` en web y como `Authorization: Bearer` en mobile; `getAuthUser(request)` acepta ambos transparentemente, de modo que **toda ruta es agnóstica web/mobile sin código extra**. El payload es estrictamente `{ userId, email, plan }` — sin acoplamiento de dominio.

```ts
// spine/lib/auth.ts (verbatim)
export interface JWTPayload { userId: number; email: string; plan: string }
export async function getAuthUser(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) return verifyJWT(authHeader.slice(7))
  const token = request.cookies.get("auth_token")?.value
  if (!token) return null
  return verifyJWT(token)
}
```

La cookie es `httpOnly`, `sameSite: "lax"`, `secure` en producción, `maxAge` 30 días (token web `30d`, mobile `365d`, refresh `365d`). El registro (`spine/app/api/auth/register/route.ts`) valida server-side: email por regex, `name` 2–60 chars con whitelist Unicode (bloquea HTML/JS injection via NFD strip), password ≥ 8 chars, hash `bcrypt` con cost 10. Campos de signup específicos del dominio se guardan en `profile` (JSONB) — **el Spine nunca hardcodea columnas de dominio**.

Sobre esto, `spine/lib/auth-guards.ts` centraliza el boilerplate de plan: `requireAuth` (401), `requirePaidPlan` (402, lleva al cliente a `/pricing`), `requirePlanAtLeast(minPlanId)`. Planes pagos y ranking se **derivan de `domain.config`** (`priceUsd > 0` = pago; rank = orden en `monetization.plans`) — sin nombres de plan hardcodeados.

### 2.2 Analytics — `spine/lib/analytics.ts` + `spine/lib/db.ts`

Tracking unificado: GA4 + Microsoft Clarity + **un funnel interno persistido**. El cliente (`analytics.ts`) expone `pageView`, `funnelStep`, `event`, `formError`, `setUser`; los IDs vienen de env (`NEXT_PUBLIC_*`). `funnelStep` mapea un embudo genérico de 8 pasos (`landing → signup_view → form_started → … → purchased`) que el generador extiende por dominio.

Crucialmente, los eventos **se persisten, nunca se descartan**: `trackInternal` hace `POST /api/track` y `db.ts` los inserta en `analytics_events` (y `page_visits`). `trackEvent` es tolerante: si la tabla aún no existe en prod, hace no-op en vez de bloquear el request.

### 2.3 Mailer — `spine/lib/mailer.ts`

Primitiva transaccional mínima usada por el módulo de auth. Usa **Resend** cuando `RESEND_API_KEY` está seteada; si no, loggea a consola (modo dev). El `from` sale de `EMAIL_FROM` o `${config.identity.name} <onboarding@resend.dev>`. El módulo completo de email-lifecycle (tracking, bounce poller, drip) sobreescribe esto con `sendTrackedEmail` cuando se habilita — auth sólo necesita una primitiva confiable.

### 2.4 Rate Limit — `spine/lib/rate-limit.ts` + `spine/middleware.ts`

Limitador **in-memory, sin dependencias, edge-compatible** (per-process; para exactitud multi-región se cambia el store por Redis). `middleware.ts` aplica límites por ruta, tuneados a propósito: auth generoso (CGNAT + typos no deben lockear), webhooks alto (reintentos del proveedor), pagos estricto.

| Ruta | Límite | Ventana | Razón |
|---|---|---|---|
| `/api/auth/login` | 10 | 60 s | abuso de credenciales |
| `/api/auth/register` | 20 | 60 s | generoso (CGNAT + typos) |
| `/api/stripe/webhook` | 100 | 60 s | reintentos del proveedor |
| `/api/track` | 120 | 60 s | barato, alto volumen |
| *(default)* | 60 | 60 s | resto de `/api/*` |

El mismo middleware setea headers de seguridad (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`) y una cookie de sesión de visitante para el funnel (saltea Bearer y páginas cacheables para no romper el cache del CDN). Un 429 devuelve `Retry-After` y `X-RateLimit-Remaining`. El generador extiende `RATE_LIMITS` con las rutas del dominio.

### 2.5 i18n — `spine/lib/i18n.tsx`

Contexto bilingüe mínimo (`LanguageProvider` + `useLanguage`). Las strings de *chrome* viven en `DICT` (en/es); el contenido de dominio (nombre, tagline, features) viene de `domain.config` resuelto vía `tr(Localized)`. El idioma por defecto es inglés si el producto lo soporta (estos demos se muestran en un sitio en inglés), si no el primer idioma del producto. La elección se persiste en `localStorage`. Agregar idiomas = extender `identity.languages` + `DICT`.

---

## 3. Folder Structure

Cada app generada es **Spine ensamblado + archivos bespoke que sobreescriben en colisión**. El Spine real es:

```
spine/
├── app/
│   ├── layout.tsx            # metadata SSR + LanguageProvider + fuente
│   ├── page.tsx              # landing (reemplazada por la app real)
│   ├── globals.css           # Tailwind v4
│   ├── login/  register/     # páginas de auth (chrome)
│   ├── app/                  # dashboard autenticado (layout, [entity], account)
│   └── api/
│       ├── auth/             # register, login, me, logout, verify-email,
│       │                     #   forgot/reset-password, resend-verification
│       ├── records/[entity]/ # CRUD genérico scoped al usuario
│       └── track/            # ingestión del funnel (persiste analytics_events)
├── components/               # AuthShell, AppSidebar, EntityManager, Mark
├── lib/
│   ├── auth.ts  auth-guards.ts  auth-emails.ts  users.ts
│   ├── db.ts                 # export const pool = new Pool()
│   ├── rate-limit.ts  analytics.ts  i18n.tsx  mailer.ts  records.ts
├── middleware.ts             # rate limit + headers + cookie de sesión
├── domain.config.ts          # identidad, módulos, entidades, monetización
├── domain-types.ts           # DomainConfig, Localized
├── next.config.ts            # standalone (no-Vercel), poweredByHeader:false
├── tsconfig.json             # strict, alias @/* → ./*
└── package.json              # next 16, react 19, pg, jose, bcryptjs (sin más)
```

Durante el ensamblado (`build-local.mjs → assemble()`), un conjunto de superficies-template del Spine se **descarta** (`SPINE_DROP`) para que la app real las provea: `app/page.tsx`, `app/login`, `app/register`, `app/app/*`, los componentes de chrome y `domain.config.ts`. Sobre ese esqueleto se escriben los archivos bespoke (override en colisión), y se inyectan tres SQL: `sql/001_core.sql`, `002_auth.sql`, `003_records.sql` (del Spine) + el `sql/app.sql` y `sql/seed.sql` del dominio.

Una app **generada** típica (ej. el clon de status page por defecto) luce así tras el ensamblado:

```
.builds/puglit-<slug>/
├── app/
│   ├── page.tsx              # el producto real (overview)
│   ├── incidents/page.tsx    # superficies del dominio
│   ├── api/<recurso>/route.ts# route handlers bespoke
│   └── (spine app/api/auth, api/track intactos)
├── lib/<dominio>.ts          # lógica pura del dominio (lo que se testea)
├── lib/__tests__/*.test.ts   # vitest del swarm/Queen
├── sql/{001_core,002_auth,003_records}.sql   # Spine
├── sql/{app,seed}.sql        # dominio (reparados hasta cargar limpio)
├── domain.config.ts          # materializado del idea del usuario
├── next.config.ts vitest.config.ts .env.local  # escritos por el builder
└── node_modules/             # hard-links del Spine (cp -al)
```

---

## 4. Naming Standards

Los nombres son parte del contrato porque otras capas (UI ↔ API ↔ SQL) deben coincidir exactamente. El generador los normaliza deterministamente.

| Elemento | Estándar | Origen / enforcement |
|---|---|---|
| Path de route handler | `app/api/<segments>/route.ts` | `canonicalRoutePath()` corrige nombres inválidos (p.ej. `/create.ts`) |
| Handlers HTTP | `export async function GET/POST/PUT/PATCH/DELETE` | `RULES` + `routeScore` (+50 si presentes) |
| Páginas | `app/<route>/page.tsx`; home siempre `app/page.tsx` | blueprint exige `/` = el producto real |
| Columnas SQL | `snake_case`; timestamp real `created_at` | `hardenRoute` regla 1 mapea columnas inventadas |
| Respuestas de lista | **array desnudo**, columnas `snake_case` exactas | `hardenRoute` regla 7 (`{data:rows}` prohibido) |
| Payload de auth | `u.userId` (number) — nunca `u.id` | `fixAuthUserFields()` reescribe `.id`→`.userId` |
| Dinero | `*_cents` (entero), nunca floats | playbook ARCHITECT + módulo rentals |
| Config | `domain.config.ts` (identity/modules/entities/monetization) | `domain-types.ts` |

La regla de **shape de lista** merece énfasis: un `GET` que devuelve una colección **retorna el array desnudo** (`return NextResponse.json(rows)`), nunca envuelto en `{ matches }` o `{ data }`. Envolver es la causa #1 de `x.map is not a function` en la página — por eso `hardenRoute` lo desenvuelve deterministamente.

---

## 5. Database Standards

**Postgres crudo vía `pg`, sin ORM.** El acceso es siempre `import { pool } from "@/lib/db"` y `pool.query(text, params)`. No hay Prisma, Drizzle ni query builders.

**SQL parametrizado, exclusivamente.** `$1, $2, …` — nunca interpolación de input del usuario. `routeScore` premia `\$\d` (+15) y penaliza fuerte (-40) cualquier `query(\`…${...}…\`)`. El scanner de seguridad estático (`web/lib/swarm-checks.ts`) marca SQLi por interpolación.

**Dinero en *integer cents*, nunca floats.** El playbook y los prompts del arquitecto lo imponen como ley; el módulo de rentals lo materializa: `nightly_price_cents`, `cleaning_fee_cents`, `service_fee_cents`, `taxes_cents`, `total_cents` — todo entero. El pricing es determinista para que *search total === checkout total*.

**`EXCLUDE` constraints para invariantes a nivel DB.** El caso canónico es anti-double-booking, agregado automáticamente cuando se detecta un dominio de reservas (`web/lib/rentals-module.ts`):

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE <bookings> ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (listing_id WITH =, daterange(check_in, check_out, '[)') WITH &&);
```

Una reserva solapada dispara el código de error Postgres `23P01`, que la lógica del dominio traduce a un **409**. La correctitud vive en la base, no en la aplicación.

**El pool está tuneado para el pooler.** `spine/lib/db.ts` configura `max` (default 15, `× N máquinas ≤ límite de la DB`), `connectionTimeoutMillis` 8s, `allowExitOnIdle`, TLS por defecto (`POSTGRES_SSL=disable` sólo local), y un handler de error en el pool que loggea el código. En producción `ensureSchema()` se **saltea** — el DDL se envía como `scripts/sql/*.sql` para correr manualmente, porque el rol de la app no es dueño de la DB (y se conecta vía el **pooler Supavisor**, no el host directo IPv6-only).

| Regla | Enforcement |
|---|---|
| Sólo `pg` crudo + `pool.query` | `SPINE_API`, `hardenRoute` regla 6 |
| SQL parametrizado | `routeScore`, `swarm-checks.ts` |
| Integer cents | playbooks + rentals-module |
| `EXCLUDE` para overlaps | rentals-module (auto-inyectado) |
| `created_at TIMESTAMPTZ DEFAULT NOW()` | blueprint DDL template |
| Tablas referenciadas existen | `hardenRoute` regla 1 + `swarm-repair` (phantom-table) |

---

## 6. API Standards

Toda API es un **App Router route handler** (Next 16). Los estándares "production-grade" (de `genRouteFile` en `web/lib/app-builder.ts`) son no-negociables:

**Completitud.** Un handler por método necesario. Si el recurso es una *colección* que la UI lee y escribe (mensajes, comentarios, ítems), implementa **GET y POST**. Lecturas/escrituras sobre datos de otro usuario deben estar *scoped* (verificar que el caller es participante antes).

**Status codes correctos.** 200 read · 201 create · 400 bad input · 401 sin auth · 403 forbidden/no-participante · 404 missing · 409 conflict. JSON en todo path.

**Validación de input antes de tocar la DB.** Campos requeridos presentes, tipos primitivos correctos, rangos/longitudes sanas; input inválido → 400 con `{error:"..."}` (nunca dejar que llegue a SQL ni que tire 500). Números con `Number()` y rechazo de `NaN`.

**Transaction safety.** Toda mutación multi-statement que deba ser atómica corre en una transacción:

```ts
const c = await pool.connect()
try { await c.query("BEGIN"); /* … */; await c.query("COMMIT") }
catch (e) { await c.query("ROLLBACK"); throw e }
finally { c.release() }
```

**Resiliencia.** Cuerpo del handler en `try/catch`; loggear y devolver `500 {error:"internal"}` ante fallo inesperado. Nunca filtrar objetos de error crudos al cliente.

Ejemplo del Spine (`api/auth/register`) que materializa el estándar: valida email/name/password, normaliza, hashea con bcrypt, maneja el caso "email ya existe" como login (mejor UX que un muro 409), y envuelve todo en `try/catch` con 500 limpio.

Tras la generación, **`hardenRoute`** (un Reliability Engineer LLM) corrige bugs runtime que `tsc` no ve: conformidad de schema (toda columna referenciada existe — *bug #1*), scoping de participantes, exclusión del propio caller en feeds, correctitud de mutual-match, Haversine para "near me", remoción de deps externas, y shape de lista. La revisión es **determinista donde puede serlo**: el swipe→match se reemplaza por una ruta generada por código (`deterministicSwipeRoute`) cuando el shape calza, porque el LLM acierta el SQL pero invierte el binding de parámetros.

---

## 7. Security Standards

| Vector | Defensa | Dónde |
|---|---|---|
| SQLi | SQL parametrizado obligatorio + scan estático | `swarm-checks.ts`, `routeScore` |
| Auth bypass | `getAuthUser` central; rutas per-user → 401 sin token | `auth.ts`, `auth-guards.ts` |
| Privilege escalation | `requirePaidPlan`/`requirePlanAtLeast` (402); plan derivado de config | `auth-guards.ts` |
| IDOR / cross-tenant | scoping de participante obligatorio (GET y POST) | `hardenRoute` reglas 2–3 |
| Secrets en código | scan estático de secretos hardcodeados | `swarm-checks.ts` |
| Injection en inputs | validación server-side; whitelist Unicode en `name` | `api/auth/register` |
| Clickjacking / sniffing | `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` | `middleware.ts` |
| Abuso / fuerza bruta | rate limit por ruta + 429 con `Retry-After` | `middleware.ts` |
| Cookie theft | `httpOnly` + `secure` (prod) + `sameSite: lax` | `auth.ts` |
| Deps maliciosas/innecesarias | cero deps externas fuera del Spine | `RULES`, `hardenRoute` regla 6 |
| Leak de email entre usuarios | nunca exponer email; sólo alias/first name | prompt del arquitecto |

La revisión adversarial (`web/lib/adversarial-review.ts`) agrega una capa de auditoría con tres lentes ortogonales — Auditor (lógica), Adversary (abuso/seguridad), Pragmatist (diseño) — con cross-examination determinista (≥2 lentes = confirmado) y veredicto **SHIP / SHIP-WITH-CAVEATS / BLOCK**. La regla de oro: **secretos siempre fail-closed**, ningún default inseguro que deje correr la app sin protección.

---

## 8. UI Standards

**Stack.** Next.js 16 (App Router) + Turbopack + React 19 + **Tailwind v4 únicamente** — no hay Shadcn/Radix ni librería de componentes; cada elemento se construye a mano con utility classes.

**Boundaries RSC.** Páginas cliente arrancan con `"use client"`. La normalización es determinista en dos lugares: `normalizeUseClient` en `app-builder.ts` (corrige `use client;` sin comillas → TS1434, lo agrega si la página usa hooks) y `ensureUseClient` en `build-local.mjs` (mismo invariante en el loop de reparación). Hooks y JSX viven dentro de **un** componente default-exported; todo hook se importa de `react`.

**Reglas de navegación Next 16** (de `RULES`): `<Link href>` directo, **nunca** un `<a>` anidado dentro de `<Link>` (crash en runtime). Params dinámicos en páginas cliente con `useParams()` de `next/navigation` — nunca `router.query` (no existe en App Router).

**Sin websockets, sin blob storage.** Realtime/chat = `setInterval(fetch, 2500)` + `clearInterval` en unmount. Upload de imágenes = `<input type="file">` → `FileReader.readAsDataURL` → string `data:` URL guardado en una columna `TEXT`.

**Design playbook (`VISUAL_SYSTEM`).** Un *Art Director* LLM produce un brief de identidad por producto (dirección estética, arquitectura de layout, tokens de color con roles, escala tipográfica, recipes de componentes, motion, layout por pantalla), y cada agente de frontend lo sigue *verbatim*. La barra de calidad visual es un hard spec, no inspiración:

- **CONTRAST IS LAW**: todo nodo de texto con color explícito AA contra su propio fondo (el defecto #1 es texto blanco invisible sobre card blanca).
- Profundidad y jerarquía: escala de radios, shadows en capas, hairline borders.
- Los cuatro estados siempre: **LOADING** (skeletons `animate-pulse`), **EMPTY** (bloque amigable + CTA), **ERROR** (banner inline dismissible), **POPULATED**.
- Estados de interacción en cada elemento: hover, active, `focus-visible:ring`, disabled.
- **BANNED**: el look genérico de admin centrado y angosto, botones sin estilo, gris sobre gris, cards Bootstrap-ish.

Tras generar cada página corre un **QC loop reactivo** (`genPolishedPage`): genera → el QC critica contra el brief → refina.

---

## 9. Performance Standards

| Estándar | Detalle |
|---|---|
| Turbopack | dev y build sobre Turbopack; `turbopack.root` pinneado a la app para evitar root inferido erróneo |
| `output: standalone` | imagen Docker chica (deshabilitado en Vercel, que maneja su propio tracing) |
| Listas paginadas | `?limit/?offset` con defaults sanos y `limit` capeado; `ORDER BY` una columna real |
| Columnas explícitas | seleccionar columnas, evitar `SELECT *` al shapear respuestas |
| Índices | el SQL del core indexa lo caliente (`idx_page_visits_created`, `idx_analytics_events_event`, …) |
| Pool reusado | un único `pool` exportado, `max` capeado por máquina, `idleTimeoutMillis` 30s |
| Cache del CDN | la cookie de sesión se saltea en páginas públicas cacheables (`/`, `/blog`, `/_next`, `/static`) |
| `poweredByHeader: false` | sin header `X-Powered-By` |
| Fuente optimizada | `next/font/google` (Plus Jakarta Sans) con `variable` |

El analytics del lado servidor es *fire-and-forget* tolerante: `trackEvent` nunca bloquea el request si la tabla no existe aún.

---

## 10. Accessibility Standards

La accesibilidad es parte de `VISUAL_SYSTEM` y se exige en cada pantalla:

- **Elementos semánticos**: `header / nav / main / section / button` (no `div` clickeables).
- **`alt` en imágenes** y **`aria-label` en botones icon-only**.
- **Foco visible**: `focus-visible:ring-2 ring-offset-2`.
- **El color nunca es la única señal** de estado.
- **Contraste AA** garantizado para cada par texto-sobre-superficie (la regla "CONTRAST IS LAW").
- **Tap targets ≥ 44px** en mobile.
- Responsive mobile-first con refinamientos `sm:/md:/lg:`.

La lente *Pragmatist* de la revisión adversarial vigila estos puntos de diseño además de la lógica.

---

## 11. Testing Standards

El testing es **vitest + coverage medida**, y no se confía en la afirmación del agente: se *mide*.

**Config (`build-local.mjs` escribe `vitest.config.ts`).** Entorno `node`, alias `@` → root de la app, coverage `v8` con reporters `text-summary` + `json-summary`, `include: ["lib/**/*.ts"]`, excluyendo tests y `__tests__`. Sólo se cubre la **lógica de dominio** en `lib/` — se saltean explícitamente los libs del Spine (`db`, `auth`, `mailer`, `rate-limit`, `analytics`, `i18n`).

**Estilo (`genTests` + el prompt del Test Engineer).** **Arrange-Act-Assert**: cada test estructurado Arrange → Act → Assert; nombrado por comportamiento — `describe("<unit>")`, `it("<expected behavior> when <condition>")`; **un comportamiento por test**. Se importan las funciones **reales** desde `@/lib/…` y se testean **sólo funciones puras** — nunca algo que toque DB/red. Se asertan **valores exactos** + casos borde (boundaries, input inválido, transiciones de estado).

**Anti-patterns prohibidos** (verbatim del prompt): `expect(true).toBe(true)`; snapshot-everything; asserts demasiado amplios; `test.skip`; borrar/debilitar una aserción para pasar; `await` faltante en async.

**El Queen evidence gate.** Tras compilar y cargar SQL, `runTests()` corre vitest+coverage y la **Abeja Reina** del equipo revisa la evidencia real: ¿tests verdes? ¿coverage ≥ bar (default **70%**, `PUGLIT_COVERAGE_BAR`)? Si no llega, la **rebota con feedback específico** ("coverage 41% < 70%, estas funciones sin cubrir: …") y el equipo escribe más tests → se re-mide. Loop hasta cruzar el bar o agotar `PUGLIT_QA_ROUNDS` (default 2). El veredicto (`✓ APROBADO` / entregado con deuda de QA) se persiste en el status del export. Si no hay lógica de dominio testeable, se reporta coverage 0% honestamente.

---

## 12. Deployment Standards

**El runtime gate de `build-local.mjs` es la línea de aceptación.** No es "trust the claim": se ejecuta el pipeline completo localmente y se *sirve una app corriendo*. Las etapas, en orden:

1. **Generar** (los agentes: interview → spec → blueprint → routes/pages → 3 supervisiones).
2. **Pull** de los archivos generados desde Postgres.
3. **Ensamblar** Spine + bespoke en un proyecto runnable (con tres correcciones deterministas: `ensureSpineImports` prepende imports de Spine faltantes — `pool`, `getAuthUser`, `NextResponse`/`NextRequest` — que el modelo usa sin importar; `unescapeJsx` arregla TSX JSON-sobre-escapado; `ensureUseClient`).
4. **Cargar SQL** contra una DB fresca cada intento (spine → app → seed), **reparando DDL** que el modelo erró, hasta cargar limpio (hasta 5 rondas).
5. **`tsc --noEmit`** → se alimenta cada archivo con error + sus errores de vuelta al modelo → loop con anti-oscilación (guarda el mejor snapshot, para si 2 rondas no mejoran).
6. **QA gate** (vitest + coverage + Queen, §11).
7. **`next dev`** + **SMOKE TEST**: el `RUNTIME GATE`. Bootea la app, camina el árbol `app/` recolectando rutas de páginas estáticas, las hitea (GET, sin side-effects) y **asierta cero 5xx**. `pagesOk/pagesFail` se persisten en el status. Esto es el chequeo real de "¿realmente corre?".

**Export BYO (Bring Your Own).** El usuario es dueño del deploy. Si `GH_TOKEN` o `VERCEL_TOKEN` están en el env (pasados directo a `infra/deploy.sh`, **nunca persistidos**):

- **GitHub = salida universal** (cualquier tipo de app): crea el repo bajo *tu* cuenta y hace push. Siempre se corre.
- **Vercel = opcional**, sólo web apps: además da una URL pública live.

El status final (`status: done`, `compiles`, `githubUrl`, `vercelUrl`, `smoke`, métricas de QA) se escribe a `EXPORT_STATUS_FILE` para que el frontend lo muestre. Puglit no cobra nada por el deploy ni guarda tus tokens.

---

### Resumen — definición de "app válida"

Una aplicación generada por Puglit es válida si, y sólo si:

1. Hereda intactos los **5 componentes obligatorios** del Spine (auth, analytics, mailer, rate-limit, i18n) y el pool de Postgres.
2. Usa **`pg` crudo + SQL parametrizado**, integer cents, e invariantes en la DB (`EXCLUDE`) donde aplica.
3. Sus APIs son route handlers con **status codes correctos, validación, transacciones y try/catch**, sin deps externas.
4. Su UI es Next 16 + Tailwind con los cuatro estados, contraste AA y accesibilidad.
5. **Compila** (`tsc`), su **SQL carga** contra Postgres real, **pasa vitest + coverage ≥ bar** (Queen), y **bootea sin 5xx** (runtime gate).
6. Es **exportable** a *tu* GitHub/Vercel — código que poseés, sin lock-in.
