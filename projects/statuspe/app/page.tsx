"use client";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type UnknownRecord = Record<string, unknown>;
type ComponentStatus = 'operational' | 'degraded' | 'outage' | 'paused' | 'maintenance';
type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
type MaintenanceStatus = 'scheduled' | 'in_progress' | 'verifying' | 'completed' | 'cancelled';
type Impact = 'none' | 'minor' | 'major' | 'critical';
type GlobalTone = 'operational' | 'degraded' | 'outage' | 'maintenance';

interface StatusPageRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  main_site_url: string;
  footer_text: string;
  subscribe_email_enabled: boolean;
  subscribe_rss_enabled: boolean;
}

interface UptimeDay {
  endpoint_id: string;
  day: string;
  uptime_percentage: number | null;
  worst_status: ComponentStatus;
  total_checks: number;
}

interface EndpointRow {
  id: string;
  component_id: string;
  name: string;
  url: string;
  method: string;
  region: string;
  current_status: ComponentStatus;
  last_checked_at: string;
  last_response_time_ms: number | null;
  last_status_code: number | null;
  uptime_daily: UptimeDay[];
}

interface ComponentRow {
  id: string;
  group_id: string;
  name: string;
  description: string;
  position: number;
  current_status: ComponentStatus;
  endpoints: EndpointRow[];
  uptime_daily: UptimeDay[];
}

interface ComponentGroupRow {
  id: string;
  name: string;
  description: string;
  position: number;
  components: ComponentRow[];
}

interface TimelineUpdate {
  id: string;
  status: string;
  message: string;
  author_label: string;
  published_at: string;
}

interface IncidentRow {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  impact: Impact;
  started_at: string;
  resolved_at: string;
  updated_at: string;
  updates: TimelineUpdate[];
}

interface MaintenanceRow {
  id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  impact: Impact;
  scheduled_start_at: string;
  scheduled_end_at: string;
  started_at: string;
  completed_at: string;
  updated_at: string;
  updates: TimelineUpdate[];
}

interface HomeData {
  page: StatusPageRow;
  groups: ComponentGroupRow[];
  components: ComponentRow[];
  activeIncidents: IncidentRow[];
  resolvedIncidents: IncidentRow[];
  maintenances: MaintenanceRow[];
  globalTone: GlobalTone;
  globalLabel: string;
  avgUptime24h: number | null;
  lastCheckedAt: string;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isRecord(value)) {
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.rows)) return value.rows;
    if (Array.isArray(value.data)) return value.data;
  }
  return [];
}

function firstArray(source: UnknownRecord, keys: string[]): unknown[] {
  for (const key of keys) {
    const list = normalizeArray(source[key]);
    if (list.length > 0) return list;
  }
  return [];
}

function firstRecord(source: UnknownRecord, keys: string[]): UnknownRecord | null {
  for (const key of keys) {
    const value = source[key];
    if (isRecord(value)) return value;
  }
  return null;
}

function safeStatus(value: unknown): ComponentStatus {
  const status = asString(value, 'operational');
  if (status === 'degraded' || status === 'outage' || status === 'paused' || status === 'maintenance') return status;
  return 'operational';
}

function safeIncidentStatus(value: unknown): IncidentStatus {
  const status = asString(value, 'investigating');
  if (status === 'identified' || status === 'monitoring' || status === 'resolved') return status;
  return 'investigating';
}

function safeMaintenanceStatus(value: unknown): MaintenanceStatus {
  const status = asString(value, 'scheduled');
  if (status === 'in_progress' || status === 'verifying' || status === 'completed' || status === 'cancelled') return status;
  return 'scheduled';
}

function safeImpact(value: unknown): Impact {
  const impact = asString(value, 'minor');
  if (impact === 'none' || impact === 'major' || impact === 'critical') return impact;
  return 'minor';
}

function parseUpdate(value: unknown): TimelineUpdate {
  const row = isRecord(value) ? value : {};
  return {
    id: String(row.id ?? row.published_at ?? ''),
    status: asString(row.status, 'investigating'),
    message: asString(row.message, 'Actualización publicada por el equipo de StatusPe.'),
    author_label: asString(row.author_label, 'StatusPe'),
    published_at: asString(row.published_at, asString(row.created_at, '')),
  };
}

function parseUptimeDay(value: unknown): UptimeDay {
  const row = isRecord(value) ? value : {};
  return {
    endpoint_id: String(row.endpoint_id ?? ''),
    day: asString(row.day, ''),
    uptime_percentage: asNumber(row.uptime_percentage),
    worst_status: safeStatus(row.worst_status),
    total_checks: asNumber(row.total_checks) ?? 0,
  };
}

function parseEndpoint(value: unknown, rootUptime: UptimeDay[]): EndpointRow {
  const row = isRecord(value) ? value : {};
  const id = String(row.id ?? '');
  const nestedUptime = normalizeArray(row.uptime_daily).map(parseUptimeDay);
  const relatedRootUptime = rootUptime.filter((day) => day.endpoint_id === id);
  const merged = mergeUptimeDays([...nestedUptime, ...relatedRootUptime]);

  return {
    id,
    component_id: String(row.component_id ?? ''),
    name: asString(row.name, 'Endpoint HTTPS'),
    url: asString(row.url, ''),
    method: asString(row.method, 'GET'),
    region: asString(row.region, 'global'),
    current_status: safeStatus(row.current_status),
    last_checked_at: asString(row.last_checked_at, ''),
    last_response_time_ms: asNumber(row.last_response_time_ms),
    last_status_code: asNumber(row.last_status_code),
    uptime_daily: merged,
  };
}

function parseComponent(value: unknown, rootEndpoints: EndpointRow[], rootUptime: UptimeDay[]): ComponentRow {
  const row = isRecord(value) ? value : {};
  const id = String(row.id ?? '');
  const nestedEndpoints = normalizeArray(row.endpoints).map((endpoint) => parseEndpoint(endpoint, rootUptime));
  const relatedEndpoints = rootEndpoints.filter((endpoint) => endpoint.component_id === id);
  const endpointsById = new Map<string, EndpointRow>();

  [...relatedEndpoints, ...nestedEndpoints].forEach((endpoint, index) => {
    const key = endpoint.id || `${endpoint.name}-${index}`;
    endpointsById.set(key, endpoint);
  });

  const componentUptime = normalizeArray(row.uptime_daily).map(parseUptimeDay);

  return {
    id,
    group_id: String(row.group_id ?? ''),
    name: asString(row.name, 'Componente sin nombre'),
    description: asString(row.description, ''),
    position: asNumber(row.position) ?? 0,
    current_status: safeStatus(row.current_status),
    endpoints: Array.from(endpointsById.values()).sort((a, b) => a.name.localeCompare(b.name)),
    uptime_daily: mergeUptimeDays(componentUptime),
  };
}

function parseIncident(value: unknown, rootUpdates: TimelineUpdate[]): IncidentRow {
  const row = isRecord(value) ? value : {};
  const id = String(row.id ?? '');
  const nestedUpdates = normalizeArray(row.updates).length > 0 ? normalizeArray(row.updates) : normalizeArray(row.incident_updates);
  const updates = [...nestedUpdates.map(parseUpdate), ...rootUpdates.filter((update) => update.id.startsWith(`${id}:`))]
    .sort((a, b) => dateMs(b.published_at) - dateMs(a.published_at));

  return {
    id,
    title: asString(row.title, 'Incidente operativo'),
    description: asString(row.description, ''),
    status: safeIncidentStatus(row.status),
    impact: safeImpact(row.impact),
    started_at: asString(row.started_at, ''),
    resolved_at: asString(row.resolved_at, ''),
    updated_at: asString(row.updated_at, asString(row.created_at, '')),
    updates,
  };
}

function parseMaintenance(value: unknown): MaintenanceRow {
  const row = isRecord(value) ? value : {};
  const updates = (normalizeArray(row.updates).length > 0 ? normalizeArray(row.updates) : normalizeArray(row.maintenance_updates))
    .map(parseUpdate)
    .sort((a, b) => dateMs(b.published_at) - dateMs(a.published_at));

  return {
    id: String(row.id ?? ''),
    title: asString(row.title, 'Mantenimiento programado'),
    description: asString(row.description, ''),
    status: safeMaintenanceStatus(row.status),
    impact: safeImpact(row.impact),
    scheduled_start_at: asString(row.scheduled_start_at, ''),
    scheduled_end_at: asString(row.scheduled_end_at, ''),
    started_at: asString(row.started_at, ''),
    completed_at: asString(row.completed_at, ''),
    updated_at: asString(row.updated_at, asString(row.created_at, '')),
    updates,
  };
}

function mergeUptimeDays(days: UptimeDay[]): UptimeDay[] {
  const byDay = new Map<string, UptimeDay>();
  days.forEach((day) => {
    if (day.day) byDay.set(day.day, day);
  });
  return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
}

function dateMs(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseHomeData(raw: unknown): HomeData {
  const root = isRecord(raw) ? raw : { components: normalizeArray(raw) };
  const pageSource = firstRecord(root, ['status_page', 'page']) ?? root;
  const page: StatusPageRow = {
    id: String(pageSource.id ?? 'statuspe'),
    name: asString(pageSource.name, 'StatusPe'),
    slug: asString(pageSource.slug, 'statuspe'),
    logo_url: asString(pageSource.logo_url, ''),
    main_site_url: asString(pageSource.main_site_url, 'https://statuspe.com'),
    footer_text: asString(pageSource.footer_text, 'Powered by StatusPe'),
    subscribe_email_enabled: asBoolean(pageSource.subscribe_email_enabled, true),
    subscribe_rss_enabled: asBoolean(pageSource.subscribe_rss_enabled, true),
  };

  const rootUptime = firstArray(root, ['uptime_daily', 'uptime']).map(parseUptimeDay);
  const rootEndpoints = firstArray(root, ['endpoints']).map((endpoint) => parseEndpoint(endpoint, rootUptime));
  const componentRaw = firstArray(root, ['components']);
  const groupRaw = firstArray(root, ['component_groups', 'groups']);

  const nestedComponents = groupRaw.flatMap((group) => (isRecord(group) ? normalizeArray(group.components) : []));
  const components = [...componentRaw, ...nestedComponents]
    .map((component) => parseComponent(component, rootEndpoints, rootUptime))
    .filter((component, index, list) => component.id === '' || list.findIndex((item) => item.id === component.id) === index)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));

  const groups = groupRaw
    .map((group) => {
      const row = isRecord(group) ? group : {};
      const id = String(row.id ?? '');
      return {
        id,
        name: asString(row.name, 'Componentes'),
        description: asString(row.description, ''),
        position: asNumber(row.position) ?? 0,
        components: components.filter((component) => component.group_id === id),
      };
    })
    .filter((group) => group.components.length > 0)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));

  const groupedIds = new Set(groups.flatMap((group) => group.components.map((component) => component.id)));
  const ungrouped = components.filter((component) => !groupedIds.has(component.id));
  const finalGroups = groups.length > 0
    ? [...groups, ...(ungrouped.length > 0 ? [{ id: 'ungrouped', name: 'Infraestructura StatusPe', description: 'Monitores públicos sin grupo asignado.', position: 999, components: ungrouped }] : [])]
    : (components.length > 0 ? [{ id: 'default', name: 'Infraestructura StatusPe', description: 'Servicios públicos monitoreados por StatusPe.', position: 0, components }] : []);

  const incidentUpdates = firstArray(root, ['incident_updates']).map((update) => {
    const row = isRecord(update) ? update : {};
    const parsed = parseUpdate(update);
    return { ...parsed, id: `${String(row.incident_id ?? '')}:${parsed.id}` };
  });
  const incidentRaw = [...firstArray(root, ['active_incidents']), ...firstArray(root, ['incidents']), ...firstArray(root, ['recent_incidents'])];
  const incidentById = new Map<string, IncidentRow>();
  incidentRaw.map((incident) => parseIncident(incident, incidentUpdates)).forEach((incident, index) => {
    incidentById.set(incident.id || `incident-${index}`, incident);
  });
  const incidents = Array.from(incidentById.values()).sort((a, b) => dateMs(b.started_at) - dateMs(a.started_at));
  const activeIncidents = incidents.filter((incident) => incident.status !== 'resolved');
  const resolvedIncidents = incidents.filter((incident) => incident.status === 'resolved').slice(0, 6);

  const maintenanceRaw = [...firstArray(root, ['active_maintenances']), ...firstArray(root, ['scheduled_maintenances']), ...firstArray(root, ['maintenances'])];
  const maintenanceById = new Map<string, MaintenanceRow>();
  maintenanceRaw.map(parseMaintenance).forEach((maintenance, index) => {
    maintenanceById.set(maintenance.id || `maintenance-${index}`, maintenance);
  });
  const maintenances = Array.from(maintenanceById.values())
    .filter((maintenance) => maintenance.status !== 'completed' && maintenance.status !== 'cancelled')
    .sort((a, b) => dateMs(a.scheduled_start_at) - dateMs(b.scheduled_start_at));

  const globalTone = computeGlobalTone(components, activeIncidents, maintenances);
  const labelMap: Record<GlobalTone, string> = {
    operational: 'Todos los sistemas operativos',
    degraded: 'Rendimiento degradado',
    outage: 'Interrupción mayor/parcial',
    maintenance: 'Mantenimiento',
  };

  const uptimeValues = components.flatMap((component) => component.endpoints.map((endpoint) => uptime24(endpoint))).filter((value): value is number => value !== null);
  const avgUptime24h = uptimeValues.length > 0 ? uptimeValues.reduce((sum, value) => sum + value, 0) / uptimeValues.length : null;
  const lastCheckedAt = components
    .flatMap((component) => component.endpoints.map((endpoint) => endpoint.last_checked_at))
    .sort((a, b) => dateMs(b) - dateMs(a))[0] ?? '';

  return {
    page,
    groups: finalGroups,
    components,
    activeIncidents,
    resolvedIncidents,
    maintenances,
    globalTone,
    globalLabel: labelMap[globalTone],
    avgUptime24h,
    lastCheckedAt,
  };
}

function computeGlobalTone(components: ComponentRow[], activeIncidents: IncidentRow[], maintenances: MaintenanceRow[]): GlobalTone {
  const hasOutageComponent = components.some((component) => component.current_status === 'outage');
  const hasMajorIncident = activeIncidents.some((incident) => incident.impact === 'major' || incident.impact === 'critical');
  if (hasOutageComponent || hasMajorIncident) return 'outage';

  const hasLiveMaintenance = maintenances.some((maintenance) => maintenance.status === 'in_progress' || maintenance.status === 'verifying');
  const hasMaintenanceComponent = components.some((component) => component.current_status === 'maintenance');
  if (hasLiveMaintenance || hasMaintenanceComponent) return 'maintenance';

  const hasDegraded = components.some((component) => component.current_status === 'degraded') || activeIncidents.length > 0;
  if (hasDegraded) return 'degraded';

  return 'operational';
}

function uptime24(endpoint: EndpointRow): number | null {
  const explicit = asNumber((endpoint as unknown as UnknownRecord).uptime_24h);
  if (explicit !== null) return explicit;
  const sorted = [...endpoint.uptime_daily].sort((a, b) => b.day.localeCompare(a.day));
  return sorted[0]?.uptime_percentage ?? null;
}

function formatPercent(value: number | null): string {
  return value === null ? 'Sin datos' : `${value.toFixed(2)}%`;
}

function formatDateTime(value: string): string {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatRelative(value: string): string {
  if (!value) return 'sin revisión registrada';
  const timestamp = dateMs(value);
  if (timestamp === 0) return 'sin revisión registrada';
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'hace menos de 1 min';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function durationBetween(start: string, end: string): string {
  const startMs = dateMs(start);
  const endMs = dateMs(end);
  if (startMs === 0 || endMs === 0 || endMs < startMs) return 'Duración por confirmar';
  const minutes = Math.round((endMs - startMs) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

function statusClasses(status: ComponentStatus): string {
  if (status === 'operational') return 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]';
  if (status === 'degraded') return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
  if (status === 'outage') return 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]';
  if (status === 'maintenance') return 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]';
  return 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';
}

function statusLabel(status: ComponentStatus): string {
  if (status === 'operational') return 'Operativo';
  if (status === 'degraded') return 'Degradado';
  if (status === 'outage') return 'Interrupción';
  if (status === 'maintenance') return 'Mantenimiento';
  return 'Pausado';
}

function incidentStatusLabel(status: IncidentStatus): string {
  if (status === 'investigating') return 'Investigando';
  if (status === 'identified') return 'Identificado';
  if (status === 'monitoring') return 'Monitoreando';
  return 'Resuelto';
}

function maintenanceStatusLabel(status: MaintenanceStatus): string {
  if (status === 'scheduled') return 'Programado';
  if (status === 'in_progress') return 'En curso';
  if (status === 'verifying') return 'Verificando';
  if (status === 'completed') return 'Completado';
  return 'Cancelado';
}

function impactLabel(impact: Impact): string {
  if (impact === 'critical') return 'Crítico';
  if (impact === 'major') return 'Mayor';
  if (impact === 'minor') return 'Menor';
  return 'Sin impacto';
}

function globalBannerClasses(tone: GlobalTone): string {
  if (tone === 'operational') return 'border-[#BBF7D0] bg-[#DCFCE7] text-[#166534]';
  if (tone === 'degraded') return 'border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]';
  if (tone === 'outage') return 'border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]';
  return 'border-[#BFDBFE] bg-[#DBEAFE] text-[#1E40AF]';
}

function dotClass(status: ComponentStatus): string {
  if (status === 'operational') return 'bg-[#16A34A]';
  if (status === 'degraded') return 'bg-[#F59E0B]';
  if (status === 'outage') return 'bg-[#DC2626]';
  if (status === 'maintenance') return 'bg-[#2563EB]';
  return 'bg-[#94A3B8]';
}

function barClass(day: UptimeDay | null): string {
  if (!day) return 'bg-[#E2E8F0]';
  if (day.worst_status === 'outage') return 'bg-[#DC2626]';
  if (day.worst_status === 'degraded') return 'bg-[#F59E0B]';
  if (day.worst_status === 'maintenance') return 'bg-[#2563EB]';
  if (day.worst_status === 'paused') return 'bg-[#CBD5E1]';
  const uptime = day.uptime_percentage ?? 100;
  if (uptime >= 99.9) return 'bg-[#16A34A]';
  if (uptime >= 98) return 'bg-[#F59E0B]';
  return 'bg-[#DC2626]';
}

function buildNinetyDaySeries(days: UptimeDay[]): Array<UptimeDay | null> {
  const byDay = new Map(days.map((day) => [day.day, day]));
  const result: Array<UptimeDay | null> = [];
  for (let offset = 89; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    result.push(byDay.get(key) ?? null);
  }
  return result;
}

function StatusBadge({ status }: { status: ComponentStatus }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(status)}`}><span className={`size-2 rounded-full ${dotClass(status)}`} />{statusLabel(status)}</span>;
}

function Header({ page }: { page: StatusPageRow | null }) {
  const name = page?.name ?? 'StatusPe';
  const logoUrl = page?.logo_url ?? '';
  return (
    <header className='sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur'>
      <nav className='mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8' aria-label='Navegación principal'>
        <Link href='/' className='flex min-h-11 items-center gap-3 rounded-full pr-3 text-[#0F172A] transition-all duration-200 hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>
          {logoUrl ? <img src={logoUrl} alt={`Logo de ${name}`} className='size-9 rounded-full border border-[#E2E8F0] object-cover' /> : <span className='flex size-9 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-extrabold text-[#1D4ED8]'>SP</span>}
          <span className='hidden text-sm font-bold tracking-tight text-[#0F172A] sm:inline'>{name}</span>
        </Link>
        <div className='flex items-center gap-1 overflow-x-auto'>
          <Link href='/' className='min-h-11 whitespace-nowrap rounded-full bg-[#EFF6FF] px-3 py-2 text-sm font-semibold text-[#2563EB] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Estado</Link>
          <Link href='/s/statuspe/history' className='min-h-11 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Historial</Link>
          <Link href='/s/statuspe/subscribe' className='min-h-11 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Suscribirse</Link>
          <a href='/api/v1/status-pages/[slug]' className='min-h-11 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>RSS</a>
        </div>
      </nav>
    </header>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className='rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 shadow-sm' role='alert'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='text-sm font-semibold text-[#991B1B]'>No pudimos actualizar el estado en vivo</p>
          <p className='mt-1 text-sm leading-6 text-[#7F1D1D]'>{message}</p>
        </div>
        <button type='button' onClick={onDismiss} aria-label='Cerrar alerta' className='flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#991B1B] transition-all duration-200 hover:bg-[#FEE2E2] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2'>×</button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <main className='mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8'>
      <section className='rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-lg shadow-blue-950/5 sm:p-8'>
        <div className='h-5 w-36 animate-pulse rounded-full bg-black/5' />
        <div className='mt-5 h-10 w-full max-w-xl animate-pulse rounded-xl bg-black/5' />
        <div className='mt-4 h-5 w-64 animate-pulse rounded-xl bg-black/5' />
        <div className='mt-6 grid gap-3 sm:grid-cols-3'>
          <div className='h-24 animate-pulse rounded-2xl bg-black/5' />
          <div className='h-24 animate-pulse rounded-2xl bg-black/5' />
          <div className='h-24 animate-pulse rounded-2xl bg-black/5' />
        </div>
      </section>
      <section className='mt-6 space-y-3'>
        {[0, 1, 2, 3].map((item) => <div key={item} className='h-28 animate-pulse rounded-2xl bg-black/5' />)}
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <section className='rounded-3xl border border-[#E2E8F0] bg-white p-8 text-center shadow-lg shadow-blue-950/5 sm:p-12'>
      <div className='mx-auto flex size-16 items-center justify-center rounded-full bg-[#EFF6FF] text-3xl' aria-hidden='true'>🛰️</div>
      <h2 className='mt-5 text-2xl font-bold tracking-tight text-[#0F172A]'>Aún no hay monitores</h2>
      <p className='mx-auto mt-2 max-w-xl text-sm leading-6 text-[#64748B]'>Cuando StatusPe publique componentes, checks HTTPS o uptime diario, esta página mostrará el estado casi en vivo con historial de 90 días.</p>
      <Link href='/s/statuspe/history' className='mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-all duration-200 hover:bg-[#F8FAFC] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Ver historial público</Link>
    </section>
  );
}

function Hero({ data }: { data: HomeData }) {
  return (
    <section className='overflow-hidden rounded-3xl border border-[#E2E8F0] bg-gradient-to-br from-[#EFF6FF] to-[#FFFFFF] p-5 shadow-lg shadow-blue-950/5 sm:p-8'>
      <div className='flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
        <div className='min-w-0'>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${globalBannerClasses(data.globalTone)}`}><span className={`size-2.5 rounded-full ${data.globalTone === 'operational' ? 'bg-[#16A34A]' : data.globalTone === 'degraded' ? 'bg-[#F59E0B]' : data.globalTone === 'outage' ? 'bg-[#DC2626]' : 'bg-[#2563EB]'}`} />{data.globalLabel}</span>
          <h1 className='mt-5 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl'>Estado de {data.page.name}</h1>
          <p className='mt-3 max-w-2xl text-sm leading-6 text-[#334155] sm:text-base'>Página pública de infraestructura con checks HTTPS, latencia, uptime diario e incidentes operativos. Se actualiza automáticamente cada 2.5 segundos.</p>
          <div className='mt-6 flex flex-col gap-3 sm:flex-row'>
            <Link href='/s/statuspe/subscribe' className='inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Suscribirse a actualizaciones</Link>
            <a href={data.page.main_site_url || 'https://statuspe.com'} className='inline-flex min-h-11 items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-all duration-200 hover:bg-[#F8FAFC] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Ir al sitio principal</a>
          </div>
        </div>
        <div className='grid gap-3 sm:grid-cols-3 lg:w-[420px] lg:grid-cols-1'>
          <MetricCard label='Uptime 24h' value={formatPercent(data.avgUptime24h)} hint='Promedio de endpoints activos' />
          <MetricCard label='Componentes' value={String(data.components.length)} hint='Servicios publicados' />
          <MetricCard label='Última revisión' value={formatRelative(data.lastCheckedAt)} hint='Check más reciente' />
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm'>
      <p className='text-xs font-medium uppercase tracking-wide text-[#64748B]'>{label}</p>
      <p className='mt-2 text-xl font-extrabold tracking-tight text-[#0F172A]'>{value}</p>
      <p className='mt-1 text-xs font-medium text-[#64748B]'>{hint}</p>
    </div>
  );
}

function IncidentCard({ incident }: { incident: IncidentRow }) {
  const latest = incident.updates[0];
  return (
    <article className='rounded-2xl border border-[#FECACA] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <div className='flex flex-wrap gap-2'>
            <span className='inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-semibold text-[#991B1B]'>Impact