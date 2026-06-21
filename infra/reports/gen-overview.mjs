import fs from "node:fs"
const mods = JSON.parse(fs.readFileSync("/tmp/puglit_modules.json", "utf8"))
const catName = { channel: "Canales de mensajería", util: "Utilidades & capacidades", integration: "Integraciones externas", agent: "Agente / cerebro" }
const order = ["channel", "integration", "util", "agent"]
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const CSS = `
*{box-sizing:border-box} body{font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a2e;line-height:1.55;margin:0;font-size:13.5px}
.page{padding:46px 54px;max-width:900px;margin:0 auto}
h1{font-size:34px;margin:0 0 4px;letter-spacing:-.5px;color:#0b1020}
h2{font-size:21px;margin:30px 0 10px;color:#4f2dd6;border-bottom:2px solid #ece8ff;padding-bottom:5px}
h3{font-size:15.5px;margin:18px 0 6px;color:#0b1020}
p{margin:8px 0} ul{margin:8px 0 8px 2px;padding-left:20px} li{margin:3px 0}
.lead{font-size:15px;color:#333}
.tag{display:inline-block;background:#4f2dd6;color:#fff;border-radius:5px;padding:3px 9px;font-size:11px;font-weight:600;margin-right:6px}
.muted{color:#6b6b80} code{background:#f4f2fb;padding:1px 5px;border-radius:4px;font-size:12px;color:#5b2bd6}
table{border-collapse:collapse;width:100%;margin:10px 0;font-size:12px}
th{background:#0b1020;color:#fff;text-align:left;padding:7px 9px;font-weight:600}
td{border-bottom:1px solid #ece8ff;padding:6px 9px;vertical-align:top}
tr:nth-child(even){background:#faf9ff}
.box{background:#f7f6ff;border:1px solid #e6e1ff;border-left:4px solid #4f2dd6;border-radius:8px;padding:12px 16px;margin:14px 0}
.warn{background:#fff7f0;border-left-color:#e8820c;border-color:#ffe2c2}
.ok{background:#f0fbf4;border-left-color:#16a34a;border-color:#c8eed5}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cover{height:920px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(135deg,#0b1020,#2a1a6e);color:#fff;padding:0 60px;margin:-46px -54px 0;border-radius:0}
.cover h1{color:#fff;font-size:58px} .cover .sub{font-size:20px;color:#c9c2ff;margin-top:10px}
.cover .meta{margin-top:40px;color:#9b93d6;font-size:14px}
.pill{display:inline-block;border:1px solid #6b5dd6;border-radius:20px;padding:5px 14px;margin:4px 6px 0 0;font-size:12px;color:#d8d2ff}
.big{font-size:46px;font-weight:800;color:#4f2dd6;line-height:1}
.stat{text-align:center;padding:10px}
.page-break{page-break-before:always}
.foot{margin-top:30px;border-top:1px solid #ece8ff;padding-top:10px;color:#9b9bb0;font-size:11px}
`

function moduleRows() {
  let html = ""
  for (const c of order) {
    const list = mods.filter((m) => m.cat === c)
    html += `<h3>${catName[c]} <span class="muted">(${list.length})</span></h3><table><tr><th style="width:120px">Módulo</th><th>Qué hace</th></tr>`
    for (const m of list) html += `<tr><td><code>${m.name}</code></td><td>${esc(m.desc)}</td></tr>`
    html += `</table>`
  }
  return html
}

// ---------- DOC 1: OVERVIEW + PITCH ----------
const doc1 = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div class="page">
<div class="cover">
  <h1>Puglit</h1>
  <div class="sub">Una fábrica genética de software: un enjambre de agentes de IA que construye, evoluciona y se auto-corrige — y arma cualquier producto componiendo módulos reutilizables.</div>
  <div class="meta">Documento de proyecto · para entender y criticar · 2026-06-21</div>
  <div style="margin-top:34px">
    <span class="pill">${mods.length} módulos reutilizables</span><span class="pill">Enjambre genético multi-modelo</span>
    <span class="pill">Registro vivo auto-mejorable</span><span class="pill">100% open-source / self-host</span>
    <span class="pill">Auto-repair en build-time</span>
  </div>
</div>

<h2>1 · El pitch en 60 segundos</h2>
<p class="lead">La mayoría de los generadores de apps hacen CRUDs de molde. <b>Puglit apunta a construir cualquier producto</b> — juegos, marketplaces, asistentes omnicanal, fintech — haciéndolo de a poco y mejor en cada intento.</p>
<p>La idea central: <b>no un agente, sino un enjambre genético</b>. Tres equipos rivales (Lean, Enterprise, Hacker), cada uno con un modelo distinto, diseñan el mismo producto en paralelo. Un <b>panel de jueces (triunvirato)</b> vota al ganador. El ganador <b>gana XP, sube de nivel y escribe un diario</b> de lecciones que aplica en la próxima ronda. El sistema <b>evoluciona</b>.</p>
<p>Encima de eso hay una <b>fábrica de módulos</b>: 49 building blocks (pagos, omnicanal, auth social, voz, RAG, scraping, mapas, etc.) que el enjambre <b>inyecta automáticamente</b> según lo que el producto necesita — y que <b>crece sola</b>: si el enjambre construye algo nuevo y reutilizable, lo cosecha al catálogo; si encuentra un bug, sube la mejora.</p>
<div class="box ok"><b>La tesis:</b> con un catálogo lo bastante rico, construir software complejo se vuelve <b>componer módulos que ya existen + pegar la lógica del dominio</b>. Cada proyecto deja la fábrica más capaz que antes.</div>

<h2>2 · ¿Por qué importa?</h2>
<div class="grid">
<div class="box"><b>Soberanía & costo</b><br>Todo es open-source y self-host (LLMs locales en una GPU A40 + un proxy de tiers gratuitos con ~1.7B tokens/mes). Sin lock-in, sin facturas por token, los datos no salen.</div>
<div class="box"><b>BYO credentials</b><br>Nunca se guardan tokens de terceros: GitHub/Vercel/APIs se pasan por request. La seguridad es un principio de diseño, no un parche.</div>
<div class="box"><b>Se auto-mejora</b><br>El registro vivo + el loop de XP + el auto-repair hacen que la calidad suba con el uso, no que se degrade.</div>
<div class="box"><b>Cobertura real</b><br>49 módulos cubren SaaS, marketplace, fintech, social, B2B, AI y omnicanal — no un nicho.</div>
</div>

<div class="page-break"></div>
<h2>3 · Cómo funciona (arquitectura)</h2>
<h3>3.1 · El torneo genético</h3>
<ul>
<li><b>Divergencia:</b> 3 equipos (A·Lean/qwen, B·Enterprise/deepseek, C·Hacker/devstral) diseñan el mismo brief con filosofías distintas.</li>
<li><b>Juicio:</b> un panel de N jueces (configurable) vota por área; mayoría gana, desempate por overall agregado. Todo local/gratis.</li>
<li><b>Evolución:</b> el ganador recibe XP = área×victoria×participación, sube de nivel, y guarda lecciones (embeddings) que recupera semánticamente en la próxima ronda.</li>
</ul>
<h3>3.2 · El pipeline de build (por fases)</h3>
<p><code>blueprint → critique → brief → routes → pages → finalize</code></p>
<ul>
<li><b>blueprint:</b> el arquitecto diseña tablas, operaciones y páginas reales del producto (no un admin CRUD). <b>Ve el catálogo de módulos</b> en su prompt y reusa en vez de reinventar.</li>
<li><b>finalize:</b> inyección determinista de módulos (detección por keywords), <b>harvest</b> de módulos nuevos, y el <b>quality gate</b> (abajo).</li>
</ul>
<h3>3.3 · El quality gate (swarm-checks + auto-repair)</h3>
<ul>
<li><b>securityScan</b> (estilo SkillSpector): secrets hardcodeados, <code>eval</code>/exec, SQL injection, XSS.</li>
<li><b>consistencyScan</b> (estilo codegraph): <b>tablas fantasma</b> — SQL que referencia tablas nunca declaradas (el bug recurrente de "schema alucinado") + imports a archivos inexistentes.</li>
<li><b>auto-repair:</b> ante tablas fantasma, el swarm <b>infiere el schema faltante del uso</b> (LLM) y lo agrega a <code>app.sql</code> automáticamente. El loop se cierra: detecta → arregla → re-escanea.</li>
</ul>

<h3>3.4 · El registro vivo de módulos</h3>
<div class="grid">
<div class="box"><b>VEN</b> el directorio — el catálogo se inyecta en el prompt del arquitecto.</div>
<div class="box"><b>EXTIENDEN</b> — harvest auto-registra conectores nuevos que el enjambre escribe.</div>
<div class="box"><b>SANAN</b> — registerModule hace upsert con bump de versión (las mejoras vuelven).</div>
<div class="box"><b>Persistencia</b> — Postgres (<code>puglit_modules</code>) + espejo a <code>modules/</code> para review en git.</div>
</div>

<h3>3.5 · El spine (base de toda app generada)</h3>
<p>Cada app nace sobre un esqueleto Next.js que ya trae <b>auth, rate-limit, analytics, i18n y mailer</b> — los módulos NO los duplican.</p>

<h3>3.6 · Infra de modelos</h3>
<p>Abstracción de proveedor <b>por tier</b>: codegen pesado en la A40 local; tiers livianos y boost vía <b>freellmapi</b> (16+ providers gratis, failover automático, da acceso a modelos más grandes de los que entran en la GPU: Qwen3-235B, DeepSeek V4). El <b>juez</b> se mantiene local y consistente.</p>

<div class="page-break"></div>
<h2>4 · El catálogo de módulos (${mods.length})</h2>
<p class="muted">Cada módulo se inyecta solo cuando el producto lo necesita (detección por keywords), sigue un patrón uniforme, y es liviano (cliente HTTP) o gateway-backed (el motor pesado corre en Docker aparte). Todos BYO-credentials.</p>
${moduleRows()}

<div class="page-break"></div>
<h2>5 · Cómo criticarlo (debilidades honestas)</h2>
<div class="box warn"><b>Esta sección es para que el lector ataque el proyecto.</b> Son los riesgos reales que conocemos.</div>
<ul>
<li><b>Modelos locales = techo.</b> qwen2.5-coder:32B es bueno pero no frontier. freellmapi ayuda pero sin SLA y degradando al pegar caps. ¿La calidad de generación alcanza para productos serios sin un modelo frontier?</li>
<li><b>Reverse-APIs (scraper/LinkedIn) = zona gris.</b> Riesgo de ban de cuenta/IP. Útiles pero no "production-safe" sin cuidado constante.</li>
<li><b>Inyección por keywords.</b> La detección determinista puede sobre/sub-disparar (un "store" que no es e-commerce). ¿Conviene un router por LLM en vez de regex?</li>
<li><b>Carga operativa de gateways.</b> 14 módulos dependen de servicios Docker (MinIO/Meili/n8n/scraper-server/etc.). "Código listo" ≠ "todo corriendo". setup-gateways.sh ayuda pero es superficie de fallo.</li>
<li><b>Auto-repair parcial.</b> Hoy arregla tablas fantasma; security issues solo se flaggean (no se auto-corrigen por riesgo de romper el build).</li>
<li><b>Verificación end-to-end.</b> ¿Cada app generada corre 100% siempre? El swarm-checks sube la confianza pero la prueba de fuego sigue siendo levantarla y usarla.</li>
<li><b>Calidad dispar de módulos.</b> Algunos son clientes finos que dependen de un servicio externo + keys; no todos son "plug and play".</li>
<li><b>Evaluación del juez.</b> El panel vota, pero ¿los criterios son consistentes y resistentes a "lo que suena bien" vs lo que funciona?</li>
</ul>

<h2>6 · Roadmap</h2>
<ul>
<li>Auto-repair extendido a SQL-injection/secrets (no solo tablas).</li>
<li>codegraph como MCP para que el critic entienda el código en profundidad.</li>
<li>vLLM + LMCache para acelerar el enjambre; medir tokens/seg.</li>
<li>Interop con el estándar Agent Skills (anthropics/skills) — exportar/consumir skills del ecosistema.</li>
<li>JARVIS: el asistente omnicanal como composición de módulos (agente+canales+voz+memorygraph+tools).</li>
</ul>

<div class="foot">Puglit · documento generado automáticamente desde el código (registro de módulos en vivo) · todas las afirmaciones son verificables en el repo.</div>
</div></body></html>`

fs.writeFileSync("/tmp/puglit-overview.html", doc1)

// ---------- DOC 2: stats one-pager ----------
const counts = order.map((c) => `<div class="stat"><div class="big">${mods.filter((m) => m.cat === c).length}</div><div class="muted">${catName[c]}</div></div>`).join("")
const doc2 = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="page">
<h1>Puglit — Catálogo de módulos</h1>
<p class="lead">Referencia rápida de los ${mods.length} building blocks que el enjambre compone automáticamente.</p>
<div style="display:flex;justify-content:space-around;background:#faf9ff;border:1px solid #ece8ff;border-radius:12px;margin:16px 0">${counts}<div class="stat"><div class="big">${mods.length}</div><div class="muted">TOTAL</div></div></div>
${moduleRows()}
<div class="foot">Generado desde lib/module-registry.ts · cada módulo: lib/&lt;name&gt;-module.ts + inyector deterministicX + entrada en el catálogo.</div>
</div></body></html>`
fs.writeFileSync("/tmp/puglit-catalog.html", doc2)
console.log("HTML generado: overview + catalog")
