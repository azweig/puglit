# Design brief — StatusPe

## DIRECTION
**StatusPe debe sentirse como una página de estado premium tipo `status.claude.com` + Linear observability:** sobria, precisa, confiable y muy legible. Objetivo emocional: **calma operativa, transparencia inmediata y confianza técnica**. Nada de dashboard SaaS genérico; esto es una página pública de infraestructura.

## LAYOUT ARCHITECTURE
Estructura **full-width pública con header superior sticky**, no sidebar, no bottom tabs. El producto se consume como documento vivo de estado.

- **Header sticky**: `top-0 z-40 backdrop-blur bg-white/85 border-b border-black/5`, con logo/servicio a la izquierda y acciones a la derecha: “Subscribe”, “RSS”, “History”.
- **Contenido**: centrado pero amplio: `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Home composition**: hero compacto con estado global, seguido de componentes monitoreados en cards, barras de uptime de 90 días, incidentes activos y historial reciente.
- En páginas detalle, usar composición editorial: encabezado con estado/severidad, timeline vertical, updates y metadata lateral en desktop.

## COLOR TOKENS
Paleta dominante azul StatusPe.

- Page background: `bg-[#F6F8FC]`
- Surface/card: `bg-[#FFFFFF]`
- Primary CTA: `bg-[#2563EB]`
- Accent success: `bg-[#16A34A]`
- Warning: `bg-[#F59E0B]`
- Incident/error: `bg-[#DC2626]`
- Ink primary on cards: `text-[#0F172A]`
- Ink on blue CTA: `text-[#FFFFFF]`
- Muted text: `text-[#64748B]`
- Border: `border-[#E2E8F0]`

**Contraste obligatorio:** todo texto sobre cards blancas usa `text-[#0F172A]` o `text-[#64748B]`. Todo texto sobre `bg-[#2563EB]` usa `text-white`. Fondos de estado usan chips tintados con texto oscuro: success `bg-[#DCFCE7] text-[#166534]`, warning `bg-[#FEF3C7] text-[#92400E]`, error `bg-[#FEE2E2] text-[#991B1B]`. Hero usa gradiente sutil: `bg-gradient-to-br from-[#EFF6FF] to-[#FFFFFF]`.

## TYPE
- Display: `text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]`
- Page title: `text-2xl font-bold tracking-tight text-[#0F172A]`
- Section heading: `text-lg font-semibold text-[#0F172A]`
- Body: `text-sm sm:text-base text-[#334155] leading-6`
- Meta: `text-xs font-medium text-[#64748B]`
- Status labels: `text-xs font-semibold uppercase tracking-wide`

## COMPONENT RECIPES
- **Card:** `rounded-2xl bg-white border border-[#E2E8F0] shadow-sm p-4 sm:p-6`
- **Raised card:** add `shadow-lg shadow-blue-950/5`
- **Primary button:** `inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200`
- **Secondary button:** `rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 transition-all duration-200`
- **Chip/badge:** `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold`
- **Input:** `min-h-11 rounded-xl border border-[#CBD5E1] bg-white px-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20`
- **Nav item active:** `text-[#2563EB] bg-[#EFF6FF] rounded-full px-3 py-2 font-semibold`
- **Nav item idle:** `text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-full px-3 py-2`
- **Avatar/fallback:** `size-9 rounded-full bg-[#DBEAFE] text-[#1D4ED8] font-bold flex items-center justify-center`

## MOTION
Use only CSS: `transition-all duration-200 ease-out`. Cards hover subtly: `hover:-translate-y-0.5 hover:shadow-lg`. Buttons: `active:scale-95`. Skeletons: `animate-pulse bg-black/5 rounded-xl`.

## PER-SCREEN LAYOUT

### `/` — Estado de StatusPe
Landing pública de la propia plataforma StatusPe. Hero con “StatusPe está operativo”, uptime global y CTA “Ver página pública”. Cards para API, workers, checks HTTPS y notificaciones.  
Loading: skeleton hero + 4 service rows. Empty: ilustración “🛰️” + “Aún no hay monitores”. Error: banner rojo dismissible. Populated: estado global + métricas.

### `/s/[slug]` — Página pública de estado
Pantalla principal del cliente. Header con nombre del servicio, status global grande y botón Subscribe. Lista de componentes con punto verde/ámbar/rojo, latencia, último check y barra uptime 90 días.  
Loading: skeleton de status + filas. Empty: “Sin componentes publicados”. Error: banner “No pudimos cargar este status”. Populated: componentes, incidentes activos, historial reciente.

### `/s/[slug]/incidents/[incidentId]`
Detalle editorial del incidente. Título, severidad, estado actual, timestamps y timeline vertical de updates. Desktop: metadata sticky a la derecha.  
Loading: skeleton título + timeline. Empty: “Incidente no encontrado”. Error: banner rojo. Populated: timeline con chips “Investigating / Identified / Monitoring / Resolved”.

### `/s/[slug]/maintenances/[maintenanceId]`
Página de mantenimiento programado. Hero con chip azul/ámbar, ventana horaria, servicios afectados y descripción. Timeline de progreso.  
Loading: skeleton de evento. Empty: “Mantenimiento no disponible”. Error: banner. Populated: fecha, duración estimada, componentes afectados.

### `/s/[slug]/history`
Historial escaneable por mes. Lista cronológica agrupada, filtros por componente y severidad, mini barras uptime arriba.  
Loading: skeleton list. Empty: “Sin incidentes registrados”. Error: banner. Populated: grupos mensuales con cards compactas.

### `/s/[slug]/subscribe`
Formulario centrado dentro de card ancha. Email, canales disponibles, consentimiento claro y CTA primario.  
Loading: skeleton form. Empty: no aplica; mostrar formulario. Error: banner inline. Populated: form + preview de qué recibirá.

### `/subscribe/verify`
Confirmación de suscripción. Card celebratoria con icono “✓”, email verificado y enlace al status.  
Loading: skeleton card. Empty/error: token inválido con CTA para reenviar. Populated: éxito claro.

### `/subscribe/manage/[token]`
Gestión de preferencias. Card con email, checkboxes por componente, tipos de notificación y botón guardar.  
Loading: skeleton preferences. Empty/error: token expirado. Populated: preferencias editables.

### `/s/[slug]/rss`
Vista técnica minimal. Card con URL RSS, botón copiar, explicación breve y últimas entradas RSS.  
Loading: skeleton URL + items. Empty: “No hay entradas RSS todavía”. Error: banner. Populated: feed list compacto con fechas.
