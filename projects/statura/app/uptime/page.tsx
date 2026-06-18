"use client";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const PAGE_SLUG = 'statura';
const DAYS = 90;

type RawRecord = Record<string, unknown>;

type NormalizedDay = {
  day: string;
  status: string;
  uptime_percentage: number;
  checks_count: number;
  down_minutes: number;
};

type UptimeComponent = {
  id: string;
  name: string;
  description: string;
  current_status: string;
  group_id: string;
  group_name: string;
  uptime_percentage: number;
  avg_response_time_ms: number;
  uptime_days: NormalizedDay[];
};

type UptimeGroup = {
  id: string;
  name: string;
  description: string;
  components: UptimeComponent[];
};

type UptimePayload = {
  title: string;
  logo_text: string;
  timezone: string;
  groups: UptimeGroup[];
  overall_uptime: number;
  incident_count: number;
  avg_response_time_ms: number;
  last_updated_at: string;
};

type SelectedDay = {
  componentName: string;
  day: NormalizedDay;
};

function asRecord(value: unknown): RawRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as RawRecord) : null;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function arrayFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];
  const items = record.items;
  const rows = record.rows;
  if (Array.isArray(items)) return items;
  if (Array.isArray(rows)) return rows;
  return [];
}

function firstArray(record: RawRecord | null, keys: string[]): unknown[] {
  if (!record) return [];
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    const nested = arrayFrom(value);
    if (nested.length > 0) return nested;
  }
  return [];
}

function normalizeDay(value: unknown): NormalizedDay {
  const record = asRecord(value) ?? {};
  const rawDay = asString(record.day, asString(record.date));
  const day = rawDay.length >= 10 ? rawDay.slice(0, 10) : rawDay;
  return {
    day,
    status: asString(record.status, 'no_data'),
    uptime_percentage: asNumber(record.uptime_percentage, 0),
    checks_count: Math.round(asNumber(record.checks_count, 0)),
    down_minutes: Math.round(asNumber(record.down_minutes, 0)),
  };
}

function average(values: number[]): number {
  const usable = values.filter((value) => Number.isFinite(value));
  if (usable.length === 0) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function normalizeComponent(value: unknown, index: number): UptimeComponent | null {
  const record = asRecord(value);
  if (!record) return null;
  if (record.is_visible === false) return null;
  const uptimeDays = firstArray(record, ['uptime_days', 'days', 'history']).map(normalizeDay);
  const computedUptime = uptimeDays.length > 0 ? average(uptimeDays.map((day) => day.uptime_percentage)) : 0;
  const name = asString(record.name, `Component ${index + 1}`);
  return {
    id: asString(record.id, asString(record.component_id, `component-${index}`)),
    name,
    description: asString(record.description, 'Public component monitored by Statura.'),
    current_status: asString(record.current_status, 'operational'),
    group_id: asString(record.group_id),
    group_name: asString(record.group_name, 'Core platform'),
    uptime_percentage: asNumber(record.uptime_percentage, computedUptime),
    avg_response_time_ms: Math.round(asNumber(record.avg_response_time_ms, asNumber(record.response_time_ms, 0))),
    uptime_days: uptimeDays,
  };
}

function normalizePayload(data: unknown): UptimePayload {
  const root = asRecord(data);
  const statusPage = asRecord(root?.status_page) ?? asRecord(root?.page) ?? null;
  const summary = asRecord(root?.summary) ?? {};
  const directRows = Array.isArray(data) ? data : firstArray(root, ['components', 'items', 'rows', 'data']);
  const directComponents = directRows.map((item, index) => normalizeComponent(item, index)).filter((component): component is UptimeComponent => component !== null);
  const rawGroups = firstArray(root, ['component_groups', 'groups']);
  const assigned = new Set<string>();
  const groups: UptimeGroup[] = rawGroups.map((item, groupIndex) => {
    const groupRecord = asRecord(item) ?? {};
    const groupId = asString(groupRecord.id, `group-${groupIndex}`);
    const embeddedRows = firstArray(groupRecord, ['components', 'items', 'rows']);
    const embeddedComponents = embeddedRows.map((row, componentIndex) => normalizeComponent(row, componentIndex)).filter((component): component is UptimeComponent => component !== null);
    const matchedComponents = embeddedComponents.length > 0 ? embeddedComponents : directComponents.filter((component) => component.group_id === groupId);
    matchedComponents.forEach((component) => assigned.add(component.id));
    return {
      id: groupId,
      name: asString(groupRecord.name, 'Core platform'),
      description: asString(groupRecord.description, 'Customer-facing services and endpoints.'),
      components: matchedComponents,
    };
  }).filter((group) => group.components.length > 0);

  const remaining = directComponents.filter((component) => !assigned.has(component.id));
  if (rawGroups.length === 0 && remaining.length > 0) {
    const byName = new Map<string, UptimeComponent[]>();
    remaining.forEach((component) => {
      const key = component.group_name || 'Core platform';
      const current = byName.get(key) ?? [];
      current.push(component);
      byName.set(key, current);
    });
    Array.from(byName.entries()).forEach(([name, components], index) => {
      groups.push({ id: `derived-${index}`, name, description: 'Grouped public uptime components.', components });
    });
  } else if (remaining.length > 0) {
    groups.push({ id: 'ungrouped', name: 'Core platform', description: 'Public components without a configured group.', components: remaining });
  }

  const allComponents = groups.flatMap((group) => group.components);
  const overall = asNumber(summary.overall_uptime, asNumber(summary.uptime_percentage, average(allComponents.map((component) => component.uptime_percentage))));
  const avgResponse = Math.round(asNumber(summary.avg_response_time_ms, average(allComponents.map((component) => component.avg_response_time_ms))));
  return {
    title: asString(statusPage?.title, 'Statura'),
    logo_text: asString(statusPage?.logo_text, 'S'),
    timezone: asString(statusPage?.timezone, 'UTC'),
    groups,
    overall_uptime: overall,
    incident_count: Math.round(asNumber(summary.incident_count, asNumber(summary.incidents, 0))),
    avg_response_time_ms: avgResponse,
    last_updated_at: asString(root?.updated_at, asString(statusPage?.updated_at, new Date().toISOString())),
  };
}

function statusMeta(status: string): { label: string; chipClass: string; barClass: string; dotClass: string } {
  if (status === 'operational') return { label: 'Operational', chipClass: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]', barClass: 'bg-[#10B981]', dotClass: 'bg-[#10B981]' };
  if (status === 'degraded' || status === 'degraded_performance') return { label: 'Degraded', chipClass: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]', barClass: 'bg-[#F59E0B]', dotClass: 'bg-[#F59E0B]' };
  if (status === 'partial_outage') return { label: 'Partial outage', chipClass: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]', barClass: 'bg-[#F97316]', dotClass: 'bg-[#F97316]' };
  if (status === 'major_outage' || status === 'down') return { label: 'Major outage', chipClass: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]', barClass: 'bg-[#EF4444]', dotClass: 'bg-[#EF4444]' };
  if (status === 'under_maintenance' || status === 'maintenance') return { label: 'Maintenance', chipClass: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]', barClass: 'bg-[#2563EB]', dotClass: 'bg-[#2563EB]' };
  return { label: 'No data', chipClass: 'bg-[#F9FBFF] text-[#526071] border-[#D8E0EE]', barClass: 'bg-[#CBD5E1]', dotClass: 'bg-[#CBD5E1]' };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayLabel(day: string): string {
  if (!day) return 'Sin fecha';
  const date = new Date(`${day}T00:00:00`);
  return new Intl.DateTimeFormat('es', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return new Intl.DateTimeFormat('es', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatPercent(value: number): string {
  const safe = Math.max(0, Math.min(100, value));
  if (safe === 100) return '100%';
  return `${safe.toFixed(3)}%`;
}

function makeDateRange(offsetDays: number): Date[] {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() - offsetDays);
  return Array.from({ length: DAYS }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (DAYS - 1 - index));
    return date;
  });
}

function getDayForDate(component: UptimeComponent, key: string): NormalizedDay {
  const found = component.uptime_days.find((day) => day.day === key);
  return found ?? { day: key, status: 'no_data', uptime_percentage: 0, checks_count: 0, down_minutes: 0 };
}

function SkeletonPage(): JSX.Element {
  return (
    <main className='mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
      <section className='rounded-3xl bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] p-5 shadow-xl sm:p-8'>
        <div className='animate-pulse space-y-5'>
          <div className='h-8 w-44 rounded-full bg-white/20' />
          <div className='h-11 w-full max-w-xl rounded-2xl bg-white/20' />
          <div className='h-5 w-72 rounded-full bg-white/20' />
          <div className='grid gap-3 sm:grid-cols-3'>
            <div className='h-28 rounded-2xl bg-white/90' />
            <div className='h-28 rounded-2xl bg-white/90' />
            <div className='h-28 rounded-2xl bg-white/90' />
          </div>
        </div>
      </section>
      <section className='mt-6 rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 shadow-sm sm:p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-6 w-52 rounded-full bg-black/5' />
          <div className='space-y-3'>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className='grid min-w-full gap-3 rounded-2xl border border-[#D8E0EE] p-4 sm:grid-cols-[220px_120px_1fr]'>
                <div className='h-10 rounded-xl bg-black/5' />
                <div className='h-10 rounded-xl bg-black/5' />
                <div className='h-10 rounded-xl bg-black/5' />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ErrorBanner(props: { message: string; onRetry: () => void; onDismiss: () => void }): JSX.Element {
  return (
    <div className='mb-5 flex flex-col gap-3 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-[#0B1220] shadow-sm sm:flex-row sm:items-center sm:justify-between'>
      <div>
        <p className='text-sm font-bold text-[#B91C1C]'>No pudimos cargar el uptime histórico</p>
        <p className='mt-1 text-sm leading-6 text-[#7F1D1D]'>{props.message}</p>
      </div>
      <div className='flex gap-2'>
        <button onClick={props.onRetry} className='min-h-11 rounded-full bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#B91C1C] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2'>Retry</button>
        <button onClick={props.onDismiss} aria-label='Dismiss error' className='min-h-11 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-4 py-2 text-sm font-semibold text-[#7F1D1D] transition-all duration-200 hover:bg-[#FEE2E2] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2'>Dismiss</button>
      </div>
    </div>
  );
}

function EmptyState(): JSX.Element {
  return (
    <section className='rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-8 text-center text-[#0B1220] shadow-sm sm:p-10'>
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF] text-3xl text-[#1D4ED8]'>◷</div>
      <h2 className='mt-5 text-2xl font-extrabold tracking-tight text-[#0B1220]'>No uptime data yet</h2>
      <p className='mx-auto mt-2 max-w-lg text-sm leading-6 text-[#526071]'>Statura has not recorded enough public checks for the main status page. Once monitors run, the 90-day matrix will appear here.</p>
      <Link href='/' className='mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Back to status overview</Link>
    </section>
  );
}

export default function HistoricalUptimePage(): JSX.Element {
  const [offsetDays, setOffsetDays] = useState(0);
  const [payload, setPayload] = useState<UptimePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadUptime(): Promise<void> {
      setIsLoading(true);
      setDismissedError(false);
      setSelectedDay(null);
      try {
        const response = await fetch(`/api/public/status-pages/[slug]${PAGE_SLUG}/uptime?days=${DAYS}&offset_days=${offsetDays}`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error(`The uptime API responded with ${response.status}.`);
        const data: unknown = await response.json();
        setPayload(normalizePayload(data));
        setError(null);
      } catch (caught: any) {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        const message = caught instanceof Error ? caught.message : 'Unexpected network error.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }
    void loadUptime();
    return () => controller.abort();
  }, [offsetDays, refreshKey]);

  const dateRange = useMemo(() => makeDateRange(offsetDays), [offsetDays]);
  const periodStart = dateRange[0] ?? new Date();
  const periodEnd = dateRange[dateRange.length - 1] ?? new Date();
  const allComponents = useMemo(() => payload?.groups.flatMap((group) => group.components) ?? [], [payload]);
  const globalStatus = useMemo(() => {
    if (allComponents.some((component) => component.current_status === 'major_outage')) return 'major_outage';
    if (allComponents.some((component) => component.current_status === 'partial_outage')) return 'partial_outage';
    if (allComponents.some((component) => component.current_status === 'degraded_performance')) return 'degraded_performance';
    if (allComponents.some((component) => component.current_status === 'under_maintenance')) return 'under_maintenance';
    return 'operational';
  }, [allComponents]);
  const globalMeta = statusMeta(globalStatus);
  const showInitialLoading = isLoading && payload === null;
  const showEmpty = !isLoading && payload !== null && allComponents.length === 0 && error === null;

  return (
    <div className='min-h-screen bg-[#F6F8FC] text-[#0B1220]'>
      <header className='sticky top-0 z-40 border-b border-[#D8E0EE] bg-[#F6F8FC]/95 backdrop-blur-xl'>
        <div className='mx-auto flex min-h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8'>
          <Link href='/' className='flex min-h-11 items-center gap-3 rounded-full pr-3 transition-all duration-200 hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>
            <span className='flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-[#FFFFFF]'>{payload?.logo_text ?? 'S'}</span>
            <span className='hidden text-sm font-extrabold tracking-tight text-[#0B1220] sm:inline'>{payload?.title ?? 'Statura'}</span>
          </Link>
          <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold sm:inline-flex ${globalMeta.chipClass}`}><span className={`h-2 w-2 rounded-full ${globalMeta.dotClass}`} />{globalMeta.label}</span>
          <nav aria-label='Primary navigation' className='flex flex-1 items-center gap-1 overflow-x-auto py-2'>
            <Link href='/' className='rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Estado</Link>
            <Link href='/uptime' className='rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8] transition-colors duration-200 hover:bg-[#DBEAFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Uptime histórico</Link>
            <Link href='/history' className='rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Historial de incidentes</Link>
            <a href='/api/public/status-pages/[slug]' className='rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>RSS</a>
          </nav>
          <Link href='/#subscribe' className='hidden min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:inline-flex'>Subscribe</Link>
        </div>
      </header>

      {showInitialLoading ? <SkeletonPage /> : (
        <main className='mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
          {error && !dismissedError ? <ErrorBanner message={error} onRetry={() => setRefreshKey((current) => current + 1)} onDismiss={() => setDismissedError(true)} /> : null}

          <section className='overflow-hidden rounded-3xl bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] p-5 text-[#FFFFFF] shadow-xl sm:p-8'>
            <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
              <div className='max-w-2xl'>
                <span className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#DBEAFE]'><span className={`h-2 w-2 rounded-full ${globalMeta.dotClass}`} />Historical Uptime</span>
                <h1 className='mt-4 text-3xl font-extrabold tracking-tight text-[#FFFFFF] sm:text-4xl'>{payload?.title ?? 'Statura'} uptime histórico</h1>
                <p className='mt-3 text-sm leading-6 text-[#DBEAFE] sm:text-base'>Disponibilidad diaria de los últimos 90 días para la página pública principal. Última actualización: {payload ? formatDateTime(payload.last_updated_at) : 'sin datos'}.</p>
              </div>
              <div className='flex flex-wrap gap-2'>
                <button onClick={() => setOffsetDays((current) => current + DAYS)} disabled={isLoading} className='min-h-11 rounded-full border border-white/20 bg-[#FFFFFF] px-5 py-2.5 text-sm font-semibold text-[#0B1220] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F9FBFF] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D4ED8]'>Periodo anterior</button>
                <button onClick={() => setOffsetDays((current) => Math.max(0, current - DAYS))} disabled={offsetDays === 0 || isLoading} className='min-h-11 rounded-full border border-white/20 bg-[#FFFFFF] px-5 py-2.5 text-sm font-semibold text-[#0B1220] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F9FBFF] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D4ED8]'>Siguiente</button>
              </div>
            </div>

            <div className='mt-6 grid gap-3 sm:grid-cols-3'>
              <div className='rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm sm:p-5'>
                <p className='text-xs font-medium uppercase tracking-wide text-[#7A8799]'>Uptime del periodo</p>
                <p className='mt-2 text-3xl font-extrabold tracking-tight text-[#0B1220]'>{formatPercent(payload?.overall_uptime ?? 0)}</p>
                <p className='mt-1 text-sm text-[#526071]'>{formatDate(periodStart)} → {formatDate(periodEnd)}</p>
              </div>
              <div className='rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm sm:p-5'>
                <p className='text-xs font-medium uppercase tracking-wide text-[#7A8799]'>Incidentes</p>
                <p className='mt-2 text-3xl font-extrabold tracking-tight text-[#0B1220]'>{payload?.incident_count ?? 0}</p>
                <p className='mt-1 text-sm text-[#526071]'>Registrados en esta ventana</p>
              </div>
              <div className='rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm sm:p-5'>
                <p className='text-xs font-medium uppercase tracking-wide text-[#7A8799]'>Respuesta promedio</p>
                <p className='mt-2 text-3xl font-extrabold tracking-tight text-[#0B1220]'>{payload?.avg_response_time_ms ?? 0}ms</p>
                <p className='mt-1 text-sm text-[#526071]'>Componentes públicos monitoreados</p>
              </div>
            </div>
          </section>

          <div className='mt-6 flex flex-col gap-3 rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='text-sm font-bold text-[#0B1220]'>Rango seleccionado</p>
              <p className='text-sm leading-6 text-[#526071]'>{DAYS} días · {payload?.timezone ?? 'UTC'} · offset_days={offsetDays}</p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <button onClick={() => setOffsetDays(0)} disabled={offsetDays === 0 || isLoading} className='min-h-11 rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#DBEAFE] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Últimos 90 días</button>
              <button onClick={() => setRefreshKey((current) => current + 1)} disabled={isLoading} className='min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D8] hover:bg-[#F9FBFF] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>{isLoading ? 'Actualizando…' : 'Actualizar'}</button>
            </div>
          </div>

          {showEmpty ? <div className='mt-6'><EmptyState /></div> : null}

          {!showEmpty && payload !== null ? (
            <section className='mt-6 rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm sm:p-6'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
                <div>
                  <h2 className='text-lg font-bold text-[#0B1220] sm:text-xl'>Matriz diaria por componente</h2>
                  <p className='mt-1 text-sm leading-6 text-[#526071]'>Cada barra representa un día. Haz clic o enfoca una barra para ver porcentaje, checks y minutos degradados.</p>
                </div>
                <div className='rounded-full bg-[#F9FBFF] px-3 py-1 text-xs font-medium text-[#7A8799]'>{allComponents.length} componentes</div>
              </div>

              <div className='mt-5 space-y-6'>
                {payload.groups.map((group) => (
                  <div key={group.id} className='overflow-hidden rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] text-[#0B1220]'>
                    <div className='border-b border-[#D8E0EE] bg-[#F9FBFF] px-4 py-3'>
                      <h3 className='text-base font-semibold text-[#0B1220]'>{group.name}</h3>
                      <p className='mt-1 text-sm text-[#526071]'>{group.description}</p>
                    </div>
                    <div className='overflow-x-auto'>
                      <div role='table' aria-label={`${group.name} uptime table`} className='min-w-[1180px] divide-y divide-[#D8E0EE]'>
                        <div role='row' className='grid grid-cols-[240px_132px_1fr] items-center gap-4 bg-[#FFFFFF] px-4 py-3'>
                          <div className='text-xs font-bold uppercase tracking-wide text-[#7A8799]'>Component</div>
                          <div className='text-xs font-bold uppercase tracking-wide text-[#7A8799]'>Period uptime</div>
                          <div className='flex items-center justify-between text-xs font-medium text-[#7A8799]'><span>{formatDayLabel(formatDayKey(periodStart))}</span><span>{formatDayLabel(formatDayKey(periodEnd))}</span></div>
                        </div>
                        {group.components.map((component) => {
                          const componentMeta = statusMeta(component.current_status);
                          return (
                            <div role='row' key={component.id} className='grid grid-cols-[240px_132px_1fr] items-center gap-4 px-4 py-4 transition-colors duration-200 hover:bg-[#F9FBFF]'>
                              <div className='sticky left-0 z-10 bg-inherit pr-2'>
                                <div className='flex items-start gap-3'>
                                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${componentMeta.dotClass}`} aria-hidden='true' />
                                  <div>
                                    <p className='text-base font-semibold text-[#0B1220]'>{component.name}</p>
                                    <p className='mt-1 line-clamp-2 text-sm leading-5 text-[#526071]'>{component.description}</p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className='text-sm font-extrabold text-[#0B1220]'>{formatPercent(component.uptime_percentage)}</p>
                                <p className='mt-1 text-xs font-medium text-[#7A8799]'>{component.avg_response_time_ms}ms avg</p>
                              </div>
                              <div className='flex items-center gap-1.5'>
                                {dateRange.map((date) => {
                                  const key = formatDayKey(date);
                                  const day = getDayForDate(component, key);
                                  const meta = statusMeta(day.status);
                                  const isSelected = selectedDay?.componentName === component.name && selectedDay.day.day === key;
                                  return (
                                    <button key={key} type='button' onClick={() => setSelectedDay({ componentName: component.name, day })} aria-label={`${component.name}, ${formatDayLabel(key)}, ${meta.label}, ${formatPercent(day.uptime_percentage)}`} title={`${formatDayLabel(key)} · ${meta.label} · ${formatPercent(day.uptime_percentage)}`} className={`group/bar relative flex h-11 min-w-11 items-center justify-center rounded-lg border transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#EFF6FF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:h-9 sm:min-w-[10px] sm:border-transparent sm:p-0 ${isSelected ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-transparent bg-transparent'}`}>
                                      <span className={`h-7 w-2 rounded-full shadow-sm ${meta.barClass}`} />
                                      <span className='pointer-events-none absolute bottom-12 left-1/2 z-20 hidden w-