"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type RowId = number | string;
type JsonRecord = Record<string, unknown>;

type StatusPageRow = {
  id?: RowId;
  title?: string;
  slug?: string;
  logo_text?: string | null;
  custom_domain?: string | null;
  is_public?: boolean;
  sms_enabled?: boolean;
  slack_enabled?: boolean;
  webhook_enabled?: boolean;
  timezone?: string;
  updated_at?: string;
};

type ComponentGroupRow = {
  id?: RowId;
  name?: string;
  description?: string | null;
  position?: number;
  collapsed_by_default?: boolean;
};

type ComponentRow = {
  id?: RowId;
  group_id?: RowId | null;
  name?: string;
  description?: string | null;
  current_status?: string;
  position?: number;
  updated_at?: string;
  endpoints?: unknown;
  uptime_days?: unknown;
};

type EndpointRow = {
  id?: RowId;
  component_id?: RowId;
  name?: string;
  url?: string;
  method?: string;
  current_status?: string;
  is_public?: boolean;
  last_checked_at?: string | null;
  response_time_ms?: number;
  avg_response_time_ms?: number;
  latest_response_time_ms?: number;
  latest_check?: unknown;
};

type UptimeDayRow = {
  id?: RowId;
  component_id?: RowId;
  day?: string;
  uptime_percentage?: number | string;
  status?: string;
  checks_count?: number;
  down_minutes?: number;
};

type IncidentRow = {
  id?: RowId;
  title?: string;
  description?: string;
  status?: string;
  impact?: string;
  started_at?: string;
  resolved_at?: string | null;
  components?: unknown;
  affected_components?: unknown;
  component_names?: unknown;
};

type MaintenanceRow = {
  id?: RowId;
  title?: string;
  description?: string;
  status?: string;
  impact?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  started_at?: string | null;
  completed_at?: string | null;
  components?: unknown;
  affected_components?: unknown;
  component_names?: unknown;
};

type StatusPayload = {
  page: StatusPageRow | null;
  groups: ComponentGroupRow[];
  components: ComponentRow[];
  endpoints: EndpointRow[];
  uptime_days: UptimeDayRow[];
  incidents: IncidentRow[];
  maintenances: MaintenanceRow[];
  fetched_at: string;
};

type GlobalState = 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown';

const cardClass = 'rounded-2xl bg-[#FFFFFF] border border-[#D8E0EE] shadow-sm p-4 sm:p-6 text-[#0B1220]';
const primaryButtonClass = 'min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200';
const secondaryButtonClass = 'min-h-11 rounded-full bg-[#FFFFFF] border border-[#D8E0EE] px-5 py-2.5 text-sm font-semibold text-[#0B1220] hover:bg-[#F9FBFF] hover:border-[#B8C4D8] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 transition-all duration-200';

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function listFrom<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (isRecord(value)) {
    if (Array.isArray(value.items)) return value.items as T[];
    if (Array.isArray(value.rows)) return value.rows as T[];
    if (Array.isArray(value.data)) return value.data as T[];
  }
  return [];
}

function recordField(value: JsonRecord, key: string): JsonRecord | null {
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

function uniqueById<T extends { id?: RowId }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const output: T[] = [];
  rows.forEach((row, index) => {
    const key = row?.id === undefined || row?.id === null ? `row-${index}` : String(row.id);
    if (!seen.has(key)) {
      seen.add(key);
      output.push(row);
    }
  });
  return output;
}

function normalizePayload(data: unknown, slug: string): StatusPayload {
  const root = isRecord(data) ? data : null;
  const pageRecord = root ? recordField(root, 'status_page') ?? recordField(root, 'page') ?? (typeof root.title === 'string' || typeof root.slug === 'string' ? root : null) : null;
  const rootComponents = root ? listFrom<ComponentRow>(root.components) : listFrom<ComponentRow>(data);
  const pageComponents = pageRecord ? listFrom<ComponentRow>(pageRecord.components) : [];
  const components = uniqueById([...rootComponents, ...pageComponents]).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const nestedEndpoints = components.flatMap((component) => listFrom<EndpointRow>(component.endpoints));
  const endpoints = uniqueById([...(root ? listFrom<EndpointRow>(root.endpoints) : []), ...nestedEndpoints]).filter((endpoint) => endpoint.is_public !== false);
  const nestedDays = components.flatMap((component) => listFrom<UptimeDayRow>(component.uptime_days));
  return {
    page: pageRecord ? (pageRecord as StatusPageRow) : { title: slug, slug },
    groups: uniqueById(root ? listFrom<ComponentGroupRow>(root.component_groups).concat(listFrom<ComponentGroupRow>(root.groups)) : []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    components,
    endpoints,
    uptime_days: uniqueById([...(root ? listFrom<UptimeDayRow>(root.uptime_days) : []), ...nestedDays]),
    incidents: root ? listFrom<IncidentRow>(root.incidents).sort((a, b) => Date.parse(b.started_at ?? '') - Date.parse(a.started_at ?? '')) : [],
    maintenances: root ? listFrom<MaintenanceRow>(root.maintenances).sort((a, b) => Date.parse(a.scheduled_start ?? '') - Date.parse(b.scheduled_start ?? '')) : [],
    fetched_at: new Date().toISOString(),
  };
}

function idEquals(left?: RowId | null, right?: RowId | null): boolean {
  if (left === undefined || left === null || right === undefined || right === null) return false;
  return String(left) === String(right);
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function endpointResponseTime(endpoint: EndpointRow | undefined): number | null {
  if (!endpoint) return null;
  const direct = numberValue(endpoint.response_time_ms) ?? numberValue(endpoint.avg_response_time_ms) ?? numberValue(endpoint.latest_response_time_ms);
  if (direct !== null) return direct;
  if (isRecord(endpoint.latest_check)) return numberValue(endpoint.latest_check.response_time_ms);
  return null;
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Pendiente';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatDuration(start?: string, end?: string | null): string {
  const startTime = Date.parse(start ?? '');
  const endTime = Date.parse(end ?? new Date().toISOString());
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return 'Duración no disponible';
  const minutes = Math.max(1, Math.round((endTime - startTime) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours} h ${remainder} min` : `${hours} h`;
}

function safeHost(url?: string): string {
  if (!url) return 'endpoint privado';
  try {
    return new URL(url).host;
  } catch {
    return url.replace('https://', '').replace('http://', '');
  }
}

function safeDayKey(value?: string): string {
  if (!value) return '';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value.slice(0, 10);
  return new Date(parsed).toISOString().slice(0, 10);
}

function globalState(payload: StatusPayload | null): GlobalState {
  if (!payload) return 'unknown';
  const statuses = [...payload.components.map((component) => component.current_status ?? 'unknown'), ...payload.endpoints.map((endpoint) => endpoint.current_status ?? 'unknown')];
  if (statuses.length === 0) return 'unknown';
  if (statuses.some((status) => status === 'major_outage' || status === 'partial_outage' || status === 'down')) return 'outage';
  if (statuses.some((status) => status === 'under_maintenance')) return 'maintenance';
  if (statuses.some((status) => status === 'degraded_performance' || status === 'degraded')) return 'degraded';
  if (statuses.every((status) => status === 'operational')) return 'operational';
  return 'unknown';
}

function statusLabel(status?: string): string {
  switch (status) {
    case 'operational': return 'Operativo';
    case 'degraded_performance':
    case 'degraded': return 'Degradado';
    case 'partial_outage': return 'Interrupción parcial';
    case 'major_outage':
    case 'down': return 'Caída mayor';
    case 'under_maintenance': return 'Mantenimiento';
    case 'investigating': return 'Investigando';
    case 'identified': return 'Identificado';
    case 'monitoring': return 'Monitoreando';
    case 'resolved': return 'Resuelto';
    case 'scheduled': return 'Programado';
    case 'in_progress': return 'En progreso';
    case 'verifying': return 'Verificando';
    case 'completed': return 'Completado';
    default: return 'Sin datos';
  }
}

function chipClass(status?: string): string {
  if (status === 'operational' || status === 'resolved' || status === 'completed') return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
  if (status === 'degraded_performance' || status === 'degraded' || status === 'partial_outage' || status === 'investigating' || status === 'identified' || status === 'monitoring') return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
  if (status === 'major_outage' || status === 'down' || status === 'critical') return 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
  return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
}

function stateCopy(state: GlobalState): { title: string; subtitle: string; status: string } {
  if (state === 'operational') return { title: 'Todos los sistemas operativos', subtitle: 'La plataforma responde con normalidad en todos los componentes públicos.', status: 'operational' };
  if (state === 'degraded') return { title: 'Rendimiento degradado detectado', subtitle: 'Algunos servicios presentan latencia elevada. El equipo está observando el comportamiento.', status: 'degraded' };
  if (state === 'outage') return { title: 'Incidente activo en curso', subtitle: 'Uno o más componentes tienen interrupciones. Publicaremos actualizaciones aquí.', status: 'down' };
  if (state === 'maintenance') return { title: 'Mantenimiento en progreso', subtitle: 'Hay trabajos programados activos sobre componentes públicos.', status: 'under_maintenance' };
  return { title: 'Estado pendiente de comprobación', subtitle: 'Aún no hay suficientes señales públicas para calcular el estado global.', status: 'unknown' };
}

function uptimeBars(component: ComponentRow, days: UptimeDayRow[]): UptimeDayRow[] {
  const byDay = new Map<string, UptimeDayRow>();
  days.filter((day) => idEquals(day.component_id, component.id)).forEach((day) => byDay.set(safeDayKey(day.day), day));
  const today = new Date();
  const bars: UptimeDayRow[] = [];
  for (let index = 89; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    bars.push(byDay.get(key) ?? { component_id: component.id, day: key, status: 'no_data', uptime_percentage: 0, checks_count: 0, down_minutes: 0 });
  }
  return bars;
}

function barColor(status?: string, uptime?: number | string): string {
  const percent = numberValue(uptime) ?? 0;
  if (status === 'no_data') return 'bg-[#D8E0EE]';
  if (status === 'major_outage' || percent < 95) return 'bg-[#EF4444]';
  if (status === 'partial_outage' || status === 'degraded_performance' || percent < 99.5) return 'bg-[#F59E0B]';
  if (status === 'under_maintenance') return 'bg-[#60A5FA]';
  return 'bg-[#10B981]';
}

function affectedNames(item: IncidentRow | MaintenanceRow, allComponents: ComponentRow[]): string[] {
  const explicit = listFrom<string>(item.component_names).filter((name) => typeof name === 'string' && name.length > 0);
  const nested = [...listFrom<ComponentRow>(item.components), ...listFrom<ComponentRow>(item.affected_components)].map((component) => component?.name ?? '').filter((name) => name.length > 0);
  const names = explicit.length > 0 ? explicit : nested;
  if (names.length > 0) return Array.from(new Set(names));
  if (allComponents.length === 1) return [allComponents[0]?.name ?? 'Componente público'];
  return [];
}

function ErrorBanner({ message, onRetry, onDismiss }: { message: string; onRetry: () => void; onDismiss: () => void }) {
  return (
    <div className='rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-[#0B1220] shadow-sm' role='alert'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <span className='mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#EF4444] text-sm font-bold text-[#FFFFFF]'>!</span>
          <div>
            <p className='text-sm font-bold text-[#991B1B]'>No pudimos cargar esta página de estado</p>
            <p className='mt-1 text-sm text-[#7F1D1D]'>{message}</p>
          </div>
        </div>
        <div className='flex gap-2'>
          <button type='button' onClick={onRetry} className='min-h-11 rounded-full bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#991B1B] shadow-sm hover:bg-[#FFF7F7] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2 transition-all duration-200'>Reintentar</button>
          <button type='button' onClick={onDismiss} aria-label='Ocultar error' className='min-h-11 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-4 py-2 text-sm font-semibold text-[#991B1B] hover:bg-[#FEE2E2] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2 transition-all duration-200'>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function Header({ page, slug, state }: { page: StatusPageRow | null; slug: string; state: GlobalState }) {
  const title = page?.title ?? 'Statura';
  const logo = page?.logo_text?.slice(0, 2).toUpperCase() ?? title.slice(0, 1).toUpperCase();
  const copy = stateCopy(state);
  return (
    <header className='sticky top-0 z-40 border-b border-[#D8E0EE] bg-[#F6F8FC]/95 backdrop-blur-xl'>
      <nav className='mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8' aria-label='Navegación pública'>
        <Link href={`/status/${encodeURIComponent(slug)}`} className='flex min-h-11 items-center gap-3 rounded-full pr-3 transition-all duration-200 hover:bg-[#FFFFFF] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>
          <span className='flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-[#FFFFFF]'>{logo}</span>
          <span className='hidden text-sm font-extrabold tracking-tight text-[#0B1220] sm:inline'>{title}</span>
        </Link>
        <div className='hidden items-center gap-1 rounded-full border border-[#D8E0EE] bg-[#F9FBFF] p-1 md:flex'>
          <Link href='/' className='rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8] transition-all duration-200 hover:bg-[#FFFFFF] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Estado</Link>
          <Link href='/uptime' className='rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Uptime histórico</Link>
          <Link href='/history' className='rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Historial de incidentes</Link>
          <Link href={`/api/public/status-pages/[slug]${encodeURIComponent(slug)}/rss`} className='rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>RSS</Link>
        </div>
        <div className='flex items-center gap-2'>
          <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold sm:inline-flex ${chipClass(copy.status)}`}>{statusLabel(copy.status)}</span>
          <Link href='/#subscribe' className={primaryButtonClass}>Subscribe</Link>
        </div>
      </nav>
    </header>
  );
}

function LoadingSkeleton() {
  return (
    <div className='min-h-screen bg-[#F6F8FC] text-[#0B1220]'>
      <header className='sticky top-0 z-40 border-b border-[#D8E0EE] bg-[#F6F8FC]/95 backdrop-blur-xl'><div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8'><div className='h-11 w-44 animate-pulse rounded-full bg-[#D8E0EE]'/><div className='hidden h-11 w-96 animate-pulse rounded-full bg-[#D8E0EE] md:block'/><div className='h-11 w-28 animate-pulse rounded-full bg-[#D8E0EE]'/></div></header>
      <main className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
        <section className='rounded-[2rem] bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] p-5 shadow-xl sm:p-8'><div className='h-8 w-40 animate-pulse rounded-full bg-white/20'/><div className='mt-8 h-12 w-4/5 animate-pulse rounded-2xl bg-white/20 sm:w-2/3'/><div className='mt-4 h-6 w-full max-w-xl animate-pulse rounded-xl bg-white/15'/><div className='mt-8 grid gap-3 sm:grid-cols-3'><div className='h-24 animate-pulse rounded-2xl bg-white'/><div className='h-24 animate-pulse rounded-2xl bg-white'/><div className='h-24 animate-pulse rounded-2xl bg-white'/></div></section>
        <div className='mt-6 grid gap-4 lg:grid-cols-2'>{[0, 1, 2, 3].map((item) => <div key={item} className={`${cardClass} animate-pulse`}><div className='h-5 w-44 rounded bg-[#D8E0EE]'/><div className='mt-3 h-4 w-64 rounded bg-[#D8E0EE]'/><div className='mt-6 flex gap-1'>{Array.from({ length: 36 }).map((_, index) => <div key={index} className='h-8 flex-1 rounded bg-[#E8EEF8]'/>)}</div></div>)}</div>
        <div className='mt-6 h-40 animate-pulse rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] shadow-sm'/>
      </main>
    </div>
  );
}

function EmptyState({ pageTitle }: { pageTitle: string }) {
  return (
    <section className={`${cardClass} mx-auto max-w-2xl text-center`}>
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF] text-3xl text-[#1D4ED8]'>⌁</div>
      <h2 className='mt-5 text-2xl font-extrabold tracking-tight text-[#0B1220]'>Esta página no tiene monitores públicos todavía</h2>
      <p className='mx-auto mt-3 max-w-md text-sm leading-6 text-[#526071]'>{pageTitle} ya está publicado, pero aún no expone componentes visibles para clientes.</p>
      <div className='mt-6 flex flex-col justify-center gap-3 sm:flex-row'>
        <Link href='/' className={secondaryButtonClass}>Ver estado principal</Link>
        <button type='button' disabled className={primaryButtonClass}>Suscripciones no disponibles</button>
      </div>
    </section>
  );
}

function Hero({ payload, state, slug }: { payload: StatusPayload; state: GlobalState; slug: string }) {
  const copy = stateCopy(state);
  const lastChecked = [...payload.endpoints.map((endpoint) => endpoint.last_checked_at ?? undefined), payload.page?.updated_at, payload.fetched_at].filter((value): value is string => typeof value === 'string' && value.length > 0).sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  const operationalCount = payload.components.filter((component) => component.current_status === 'operational').length;
  const publicEndpointCount = payload.endpoints.length;
  const activeIncidentCount = payload.incidents.filter((incident) => incident.status !== 'resolved').length;
  return (
    <section className='overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] p-5 text-[#FFFFFF] shadow-xl sm:p-8'>
      <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
        <div className='max-w-3xl'>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${chipClass(copy.status)}`}>● {statusLabel(copy.status)}</span>
          <h1 className='mt-5 text-3xl font-extrabold tracking-tight text-[#FFFFFF] sm:text-4xl'>{copy.title}</h1>
          <p className='mt-3 max-w-2xl text-sm leading-6 text-[#DBEAFE] sm:text-base'>{copy.subtitle}</p>
          <p className='mt-4 text-xs font-medium text-[#DBEAFE]'>Última actualización: {formatDateTime(lastChecked)} · Zona horaria {payload.page?.timezone ?? 'UTC'}</p>
        </div>
        <div className='flex flex-col gap-3 sm:flex-row lg:flex-col'>
          <Link href='#subscribe' className='min-h-11 rounded-full bg-[#FFFFFF] px-5 py-2.5 text-center text-sm font-semibold text-[#0B1220] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D4ED8]'>Subscribe to updates</Link>
          <Link href={`/api/public/status-pages/[slug]${encodeURIComponent(slug)}/rss`} className='min-h-11 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-center text-sm font-semibold text-[#FFFFFF] transition-all duration-200 hover:bg-white/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D4ED8]'>RSS feed</Link>
        </div>
      </div>
      <div className='mt-8 grid gap-3 sm:grid-cols-3'>
        <div className='rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm'><p className='text-xs font-medium text-[#7A8799]'>Componentes operativos</p><p className='mt-2 text-2xl font-extrabold text-[#0B1220]'>{operationalCount}/{payload.components.length}</p></div>
        <div className='rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm'><p className='text-xs font-medium text-[#7A8799]'>Endpoints públicos</p><p className='mt-2 text-2xl font-extrabold text-[#0B1220]'>{publicEndpointCount}</p></div>
        <div className='rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm'><p className='text-xs font-medium text-[#7A8799]'>Incidentes activos</p><p className='mt-2 text-2xl font-extrabold text-[#0B1220]'>{activeIncidentCount}</p></div>
      </div>
    </section>
  );
}

function Tabs({ slug }: { slug: string }) {
  return (
    <div className='mt-6 flex gap-2 overflow-x-auto rounded-full border border-[#D8E0EE] bg-[#F9FBFF] p-1'>
      <Link href={`/status/${encodeURIComponent(slug)}`} className='min-h-11 whitespace-nowrap rounded-full bg-[#EFF6FF] px-4 py-2.5 text-sm font-semibold text-[#1D4ED8] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Overview</Link>
      <Link href={`/status/${encodeURIComponent(slug)}/uptime`} className='min-h-11 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Uptime</Link>
      <Link href={`/status/${encodeURIComponent(slug)}/history`} className='min-h-11 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>History</Link>
    </div>
  );
}

function ServiceCard({ component, endpoints, days }: { component: ComponentRow; endpoints: EndpointRow[]; days: UptimeDayRow[] }) {
  const componentEndpoints = endpoints.filter((endpoint) => idEquals(endpoint.component_id, component.id));
  const primaryEndpoint = componentEndpoints[0];
  const response = endpointResponseTime(primaryEndpoint);
  const bars = uptimeBars(component, days);
  const ninetyDayAverage = bars.filter((day) => day.status !== 'no_data').reduce((sum, day, _, arr) => sum + ((numberValue(day.uptime_percentage) ?? 0) / Math.max(1, arr.length)), 0);
  return (
    <article className={`${cardClass} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h3 className='text-base font-semibold text-[#0B1220]'>{component.name ?? primaryEndpoint?.name ?? 'Servicio público'}</h3>
          <p className='mt-1 text-sm leading-6 text-[#526071]'>{component.description ?? safeHost(primaryEndpoint?.url)}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${chipClass(component.current_status ?? primaryEndpoint?.current_status)}`}>{statusLabel(component.current_status ?? primaryEndpoint?.current_status)}</span>
      </div>
      <div className='mt-5 grid grid-cols-2 gap-3'>
        <div className='rounded-xl border border-[#D8E0EE] bg-[#F9FBFF] p-3'><p className='text-xs font-medium text-[#7A8799]'>Respuesta</p><p className='mt-1 text-sm font-bold text-[#0B1220]'>{response === null ? 'Sin muestra' : `${Math.round(response)} ms`}</p></div>
        <div className='rounded-xl border border-[#D8E0EE] bg-[#F9FBFF] p-3'><p className='text-xs font-medium text-[#7A8799]'>Uptime 90 días</p><p className='mt-1 text-sm font-bold text-[#0B1220]'>{ninetyDayAverage > 0 ? `${ninetyDayAverage.toFixed(2)}%` : 'Sin datos'}</p></div>
      </div>
      {componentEndpoints.length > 0 ? <div className='mt-4 space-y-2'>{componentEndpoints.slice(0, 3).map((endpoint) => <div key={String(endpoint.id ?? endpoint.url)} className='flex items-center justify-between gap-3 rounded-xl bg-[#EFF6FF] px-3 py-2'><span className='truncate text-xs font-semibold text-[#1D4ED8]'>{endpoint.method ?? 'GET'} · {safeHost(endpoint.url)}</span><span className={`h-2.5 w-2.5 rounded-full ${endpoint.current_status === 'operational' ? 'bg-[#10B981]' : endpoint.current_status === 'down' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} aria-label={statusLabel(endpoint.current_status)}/></div>)}</div> : null}
      <div className='mt-5'>
        <div className='mb-2 flex items-center justify-between'><span className='text-xs font-medium text-[#7A8799]'>Historial diario</span><span className='text-xs font-medium text-[#7A8799]'>90 días</span></div>
        <div className='flex h-9 items-end gap-0.5' aria-label={`Uptime diario para ${component.name ?? 'servicio'}`}>
          {bars.map((day) => <span key={`${day.day}-${String(component.id ?? '')}`} title={`${day.day}: ${numberValue(day.uptime_percentage)?.toFixed(2) ?? '0.00'}%`} aria-label={`${day.day}: ${statusLabel(day.status)}`} className={`min-w-0 flex-1 rounded-sm ${barColor(day.status, day.uptime_percentage)}`}/>) }
        </div>
      </div>
    </article>
  );
}

function ServicesSection({ payload }: { payload: StatusPayload }) {
  const grouped = useMemo(() => {
    const groups = payload.groups.map((group) => ({ group, components: payload.components.filter((component) => idEquals(component.group_id, group.id)) })).filter((entry) => entry.components.length > 0);
    const groupedIds = new Set(groups.flatMap((entry) => entry.components.map((component) => String(component.id ?? ''))));
    const ungrouped = payload.components.filter((component) => !groupedIds.has(String(component.id ?? '')));
    return ungrouped.length > 0 ? [...groups, { group: { name: 'Servicios públicos', description: 'Componentes visibles para clientes', position: 9999 }, components: ungrouped }] : groups;
  }, [payload]);
  return (
    <section className='mt-8 space-y-8'>
      {grouped.map((entry) => <div key={String(entry.group.id ?? entry.group.name)}><div className='mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'><div><h2 className='text-lg font-bold text-[#0B1220] sm:text-xl'>{entry.group.name ?? 'Servicios'}</h2><p className='text-sm leading-6 text-[#526071]'>{entry.group.description ?? 'Estado actual, latencia y disponibilidad reciente.'}</p></div><span className='text-xs font-medium text-[#7A8799]'>{entry.components.length} componentes</span></div><div className='grid gap-4 lg:grid-cols-2'>{entry.components.map((component) => <ServiceCard key={String(component.id ?? component.name)} component={component} endpoints={payload.endpoints} days={payload.uptime_days}/>)}</div></div>)}
    </section>
  );
}

function IncidentsSection({ payload }: { payload: StatusPayload }) {
  const active = payload.incidents.filter((incident) => incident.status !== 'resolved');
  return (
    <section className='mt-8 grid gap-4 lg:grid-cols-2'>
      <div className={cardClass}>
        <div className='flex items-center justify-between gap-3'><div><h2 className='text-lg font-bold text-[#0B1220] sm:text-xl'>Incidentes activos</h2><p className='mt-1 text-sm text-[#526071]'>Actualizaciones operativas visibles para clientes.</p></div><Link href={`/status/${encodeURIComponent(payload.page?.slug ?? 'statura')}/history`} className='rounded-full bg-[#EFF6FF] px-3 py-2 text-xs font-bold text-[#1D4ED8] transition-all duration-200 hover:bg-[#DBEAFE] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Ver historial</Link></div>
        <div className='mt-5 space-y-3'>
          {active.length === 0 ? <div className='rounded