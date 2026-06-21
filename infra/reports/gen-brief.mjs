import fs from "node:fs"
const mods = JSON.parse(fs.readFileSync("/tmp/puglit_modules.json", "utf8"))
const names = mods.map((m) => m.name).join(", ")
const CSS = `*{box-sizing:border-box}body{font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#16161f;line-height:1.5;margin:0;font-size:13px}
.page{padding:44px 52px;max-width:900px;margin:0 auto}
h1{font-size:30px;color:#0b1020;margin:0 0 2px} h2{font-size:18px;color:#4f2dd6;margin:24px 0 8px;border-bottom:2px solid #ece8ff;padding-bottom:4px}
.sub{color:#6b6b80;margin:0 0 18px} p{margin:7px 0} ul{margin:6px 0 6px 0;padding-left:20px} li{margin:2px 0}
code{background:#f4f2fb;padding:1px 5px;border-radius:4px;color:#5b2bd6;font-size:12px}
.kv{background:#0b1020;color:#e8e6ff;border-radius:10px;padding:16px 20px;margin:14px 0;font-size:12.5px;line-height:1.6}
.kv b{color:#b9aeff} .box{background:#f7f6ff;border-left:4px solid #4f2dd6;border-radius:8px;padding:10px 15px;margin:12px 0}
.foot{margin-top:28px;border-top:1px solid #ece8ff;padding-top:10px;color:#9b9bb0;font-size:11px}`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="page">
<h1>Puglit — Master Brief (el "prompt general")</h1>
<p class="sub">Documento autocontenido para que cualquier persona (o IA) entienda el sistema completo de un saque.</p>

<div class="kv">
<b>QUÉ ES.</b> Puglit es un sistema genético multi-agente de generación de software, open-source y self-host, cuyo objetivo es construir <b>cualquier</b> producto (no CRUDs de molde), avanzando de a poco y mejorando con cada intento.
</div>

<h2>El modelo mental en una frase</h2>
<p>Un <b>enjambre de agentes rivales</b> que compiten, son juzgados, evolucionan (XP/niveles/diario), y construyen productos <b>componiendo ${mods.length} módulos reutilizables</b> de un <b>catálogo vivo</b> que ellos mismos extienden y reparan.</p>

<h2>Cómo construye una app (pipeline)</h2>
<p><code>blueprint → critique → brief → routes → pages → finalize</code></p>
<ul>
<li><b>Torneo:</b> 3 equipos (Lean/qwen, Enterprise/deepseek, Hacker/devstral) diseñan el mismo brief en paralelo con filosofías distintas.</li>
<li><b>Juez (triunvirato):</b> panel de N modelos vota por área; mayoría gana, desempate por overall. Todo local/gratis.</li>
<li><b>Evolución:</b> el ganador gana XP=área×victoria×participación, sube nivel, guarda lecciones (embeddings) que recupera semánticamente la próxima ronda.</li>
<li><b>finalize:</b> inyección determinista de módulos (por keywords) + harvest de módulos nuevos + quality-gate.</li>
</ul>

<h2>El quality-gate (se auto-corrige + RUNTIME GATE)</h2>
<ul>
<li><b>capability planner:</b> antes de inyectar, un LLM lee el producto + el catálogo y nombra las capacidades que necesita (caza lo que la regex no ve, ej. "ERP hospitalario").</li>
<li><b>dependency graph:</b> cada módulo declara <code>requires</code>; el resolver auto-inyecta dependencias duras (social-auth→crypto) → ningún build sale roto por falta del módulo base.</li>
<li><b>securityScan:</b> secrets hardcodeados, eval/exec, SQL injection, XSS.</li>
<li><b>consistencyScan:</b> tablas fantasma (SQL→tabla nunca declarada) + imports inexistentes.</li>
<li><b>auto-repair:</b> reconcilia la tabla fantasma contra la INTENCIÓN del arquitecto (no solo el uso, que puede estar mal) + backup. Detecta → arregla → re-escanea.</li>
<li><b>runtime gate:</b> levanta la app y le pega a cada página (GET) — falla si hay 5xx/crash. <b>Static scan ≠ software que funciona.</b></li>
</ul>

<h2>Cómo se mide (evidencia, no mecanismo)</h2>
<p>El KPI no es XP ni módulos creados, sino: <b>build_success_rate</b>, <b>smoke_pass_rate</b>, <b>acuerdo inter-juez</b> y la <b>ablación</b> (torneo vs un solo agente). Tabla <code>puglit_metrics</code> + <code>scorecard()</code>. Si el torneo no le gana al agente solo, sobra complejidad — y ahora se mide.</p>

<h2>Quick start (el journey)</h2>
<ol>
<li>El usuario escribe: <i>"Quiero un SaaS de newsletter con Stripe y emails"</i>.</li>
<li>Puglit: blueprint → planner de capacidades → torneo → finalize (inyección + deps + gate + runtime) → <code>generated/projects/&lt;user&gt;/001-newsletter/</code>.</li>
<li>El usuario corre <code>docker-compose up</code> → app en localhost:3000.</li>
</ol>

<h2>El catálogo vivo (${mods.length} módulos)</h2>
<p>Los agentes lo <b>VEN</b> (catálogo en el prompt), lo <b>EXTIENDEN</b> (harvest), lo <b>SANAN</b> (registerModule + versión). Persistido en Postgres + espejo en <code>modules/</code> (git).</p>
<div class="box"><b>Los ${mods.length}:</b> ${names}.</div>
<p>Cada módulo: <code>lib/&lt;name&gt;-module.ts</code> con un inyector <code>deterministicX(config, bp)</code> + entrada en el registro. Patrón uniforme; liviano (cliente HTTP) o gateway-backed (motor pesado en Docker aparte). Todos BYO-credentials.</p>

<h2>Infra & principios</h2>
<ul>
<li><b>Modelos por tier:</b> A40 local para codegen; <b>freellmapi</b> (16+ tiers gratis, ~1.7B tokens/mes, failover) para boost y modelos más grandes (Qwen3-235B, DeepSeek V4). Juez local y consistente.</li>
<li><b>Spine:</b> cada app nace con auth, rate-limit, analytics, i18n, mailer.</li>
<li><b>Entrega:</b> <code>generated/projects/&lt;user&gt;/&lt;NNN-slug&gt;/</code> + git local; "Compilar y exportar" con tokens BYO de GitHub/Vercel.</li>
<li><b>Seguridad:</b> BYO credentials (nunca se guardan), módulo crypto (AES-256-GCM at-rest), sandbox por sesión para el agente, DDoS en capas (Cloudflare edge + Turnstile + rate-limit + cache).</li>
<li><b>Multi-usuario:</b> login passwordless, cada uno ve solo sus proyectos, el enjambre es compartido (evolución colectiva).</li>
<li><b>Gateways:</b> <code>setup-gateways.sh</code> levanta MinIO, Meilisearch, apprise, n8n, Nango, scraper-server (scrape/pdf/image/ocr/parse/docgen), pgvector, freellmapi.</li>
</ul>

<h2>Críticas — resueltas (v2) vs. abiertas</h2>
<p><b>Resueltas tras la ronda de crítica:</b> runtime gate (ya se ejecuta la app), inyección frágil → capability planner, falta de grafo de deps → <code>requires</code>+resolver, auto-repair que persistía alucinaciones → reconcilia contra intención + backup, sin métricas → <code>puglit_metrics</code>+scorecard, catalog rot → ciclo de promoción, contaminación de lecciones → relevance-floor + decay, jurado caído → circuit breaker (draft mode), rúbrica del juez ambigua → anclas explícitas + voto por diseño completo.</p>
<p><b>Aclaraciones:</b> el juez vota el DISEÑO COMPLETO de un equipo (no ensambla piezas Frankenstein); "BYO credentials" (creds de servicio en runtime, nunca persistidas) y "crypto AES-256-GCM" (PII del usuario final) son cosas distintas, no contradicción.</p>
<p><b>Abiertas (honestas):</b> el techo lo manda el modelo base local (no-frontier) + juez local ruidoso; freellmapi sin SLA (free-tiers frágiles); reverse-APIs (scraper/LinkedIn) = riesgo de ban; barrera de entrada alta (GPU seria + ~8 containers); falta la ablación medida que pruebe que el torneo le gana a un agente solo (ahora instrumentada, falta correrla).</p>

<div class="foot">Puglit Master Brief · generado desde el repo · 2026-06-21</div>
</div></body></html>`
fs.writeFileSync("/tmp/puglit-brief.html", html)
console.log("brief HTML ok")
