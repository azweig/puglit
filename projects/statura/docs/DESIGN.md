# Design brief — Statura

## DIRECTION

**Statura = status público premium, operativo y sereno**: una mezcla entre **status.claude.com** y la precisión visual de **Linear**, con módulos de uptime tipo “observability dashboard” pero sin complejidad técnica innecesaria. La emoción debe ser: **confiable, transparente, rápido de escanear y calmado incluso durante incidentes**.

---

## LAYOUT ARCHITECTURE

Statura usa una arquitectura **public-status full-width con top bar sticky**, no una app admin.  
La estructura base:

- **Top bar sticky**: `header` fijo arriba con logo Statura/empresa, estado global, navegación horizontal y CTA “Subscribe”.
- **Contenido centrado amplio**: `main` con `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Hero operativo**: bloque superior con estado global grande, timestamp de última actualización y acción de suscripción.
- **Tabs horizontales**: Overview / Uptime / History cuando aplique.
- **Composición home**: estado global → lista de servicios/endpoints → incidentes activos → mantenimiento programado → uptime resumido.

Nada de sidebar. Nada de bottom nav. Nada de columna estrecha genérica. Esta experiencia debe parecer una **página pública de confianza para clientes**, no un panel interno.

---

## COLOR TOKENS

- **Page background**: `bg-[#F6F8FC]`
- **Surface/card**: `bg-[#FFFFFF]`
- **Elevated subtle surface**: `bg-[#F9FBFF]`
- **Primary CTA / brand**: `bg-[#2563EB]`
- **Primary CTA text**: `text-[#FFFFFF]`
- **Accent operational green**: `bg-[#10B981]`
- **Warning**: `bg-[#F59E0B]`
- **Danger**: `bg-[#EF4444]`
- **Ink on cards**: `text-[#0B1220]`
- **Muted on cards**: `text-[#526071]`
- **Subtle meta**: `text-[#7A8799]`
- **Text on blue hero**: always `text-[#FFFFFF]`, secondary text `text-[#DBEAFE]`
- **Border**: `border-[#D8E0EE]`
- **Soft blue tint**: `bg-[#EFF6FF]`, text `text-[#1D4ED8]`

Use a subtle top hero gradient: `bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A]`. All inner cards placed over the hero must be `bg-[#FFFFFF]` with `text-[#0B1220]`.

---

## TYPE

- **Display status title**: `text-3xl sm:text-4xl font-extrabold tracking-tight`
- **Page title**: `text-2xl sm:text-3xl font-extrabold tracking-tight`
- **Section heading**: `text-lg sm:text-xl font-bold`
- **Card title / endpoint name**: `text-base font-semibold`
- **Body**: `text-sm sm:text-base text-[#526071] leading-6`
- **Meta**: `text-xs font-medium text-[#7A8799]`
- **Incident labels**: `text-xs font-bold uppercase tracking-wide`

---

## COMPONENT RECIPES

**Card**: `rounded-2xl bg-[#FFFFFF] border border-[#D8E0EE] shadow-sm p-4 sm:p-6 text-[#0B1220]`. Hoverable cards add `hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`.

**Primary button**: `min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200`.

**Secondary / ghost button**: `min-h-11 rounded-full bg-[#FFFFFF] border border-[#D8E0EE] px-5 py-2.5 text-sm font-semibold text-[#0B1220] hover:bg-[#F9FBFF] hover:border-[#B8C4D8] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 transition-all duration-200`.

**Chip / badge**: `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border`. Operational: `bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]`; degraded: `bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]`; outage: `bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]`; info: `bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]`.

**Input**: `min-h-11 w-full rounded-xl bg-[#FFFFFF] border border-[#D8E0EE] px-4 text-sm text-[#0B1220] placeholder:text-[#7A8799] shadow-sm focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none disabled:opacity-60`.

**Nav item**: active `rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8]`; idle `rounded-full px-4 py-2 text-sm font-semibold text-[#526071] hover:bg-[#FFFFFF] hover:text-[#0B1220]`.

**Avatar / logo fallback**: `h-9 w-9 rounded-full bg-[#2563EB] text-[#FFFFFF] flex items-center justify-center text-sm font-bold`.

---

## MOTION

Use only CSS transitions: `transition-all duration-200 ease-out`. Buttons/cards use `hover:-translate-y-0.5`, `hover:scale-[1.02]` only for compact interactive elements, `active:scale-95`. Skeletons use `animate-pulse`. No decorative animations during incidents; keep motion calm.

---

## PER-SCREEN LAYOUT

### `/` — Estado del sistema

**Populated**: public overview for the default/main status page. Hero gradient with “All systems operational” or equivalent, global badge, last checked timestamp. Below: endpoint cards in a two-column desktop grid showing name, URL/domain, current status chip, response time, and 90-day mini uptime bars. Then active incidents and scheduled maintenance cards.

**Loading**: skeleton hero block, three service-card skeletons, incident-card skeleton.  
**Empty**: centered white card with pulse/radar glyph, “No endpoints configured yet”, hint, CTA “Create first monitor”.  
**Error**: red-tinted inline banner above content with retry button.

### `/status/[slug]` — Estado público por slug

**Populated**: same overview, branded to the specific organization/status page. Top bar shows organization name/logo, tabs Overview / Uptime / History, and “Subscribe”. Service groups are sectioned by category if available.

**Loading**: skeleton organization header, service rows, uptime strips.  
**Empty**: “This status page has no public monitors yet” with subscribe disabled.  
**Error**: “We couldn’t load this status page” red banner with retry.

### `/uptime` — Historical Uptime

**Populated**: dense historical uptime dashboard. Page title, date range selector chips, summary cards for overall uptime, incidents, avg response time. Main content is a service-by-service uptime table with 90 daily bars, each bar status-colored and accessible with label.

**Loading**: skeleton summary cards and table rows.  
**Empty**: “No uptime data yet” with clock glyph.  
**Error**: inline red banner, keep existing cached shell visible if possible.

### `/status/[slug]/uptime` — Historical Uptime

**Populated**: scoped public uptime history for that status page. Include org header compact, tabs, range selector, and uptime matrix. Emphasize readability: sticky service-name column on desktop, horizontal scroll on mobile.

**Loading**: skeleton tab nav, metrics, uptime matrix.  
**Empty**: “No historical checks recorded for this page yet”.  
**Error**: red banner under tabs.

### `/history` — Incident History

**Populated**: timeline layout. Month-grouped incident cards with severity chip, title, affected services, started/resolved timestamps, and duration. Use left vertical timeline rule `border-[#D8E0EE]`.

**Loading**: skeleton timeline cards.  
**Empty**: calm success state: green glyph, “No incidents reported”, hint “System history is clean.”  
**Error**: red banner with retry.

### `/status/[slug]/history` — Incident History

**Populated**: same timeline scoped to slug, with top org header and tabs. Include filters for All / Incidents / Maintenance as chips.

**Loading**: skeleton filters and timeline.  
**Empty**: “No incidents for this status page”.  
**Error**: red banner below header.

### `/incidents/[incidentId]` — Detalle de incidente

**Populated**: detail page with strong incident header: severity badge, title, current state, affected components, started/resolved time. Body uses chronological update cards: Investigating, Identified, Monitoring, Resolved. Each update has timestamp, author/system label, and message. Add related services panel.

**Loading**: skeleton title, badges, update cards.  
**Empty**: “Incident not found” with CTA back to history.  
**Error**: red banner and fallback back link.

### `/maintenance/[maintenanceId]` — Scheduled Maintenance

**Populated**: maintenance detail with blue/info tone, scheduled window, expected impact, affected services, status badge: Scheduled / In progress / Completed. Timeline updates below.

**Loading**: skeleton maintenance header and update list.  
**Empty**: “Maintenance window not found”.  
**Error**: red banner with retry.

### `/subscribe/verify` — Verificar suscripción

**Populated**: focused verification card centered inside the same public shell, not generic auth. Show email icon, heading “Verify your subscription”, explanatory text, email field if required, primary CTA. Success state uses green badge and confirmation.

**Loading**: skeleton card with button block.  
**Empty**: “Verification link missing or expired” with CTA request new link.  
**Error**: red banner inside the card.

### `/subscribe/manage/[token]` — Administrar suscripción

**Populated**: preference management card. Show subscribed email, status page name, checkboxes/toggles for incident updates, maintenance updates, and resolved notifications. Include destructive secondary action “Unsubscribe” styled with red text but white surface.

**Loading**: skeleton preferences form.  
**Empty**: “Subscription not found or expired”.  
**Error**: red banner above form.

### `/app/status-pages/[slug]/subscribers/new` — Subscribe to updates

**Populated**: public subscription form. Hero card: status page name, trust copy, email input, notification type chips, primary CTA “Subscribe”. Below, small privacy reassurance and link back to status page.

**Loading**: skeleton form card.  
**Empty**: if subscriptions disabled, show centered card “Subscriptions are not enabled for this status page”.  
**Error**: inline red banner near submit button; preserve typed email.
