import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';

type EventKind = 'incident' | 'maintenance';

type HistoryEvent = {
  id: string;
  kind: EventKind;
  title: string;
  description: string;
  status: string;
  impact: string;
  startedAt: string;
  endedAt: string;
  href: string;
  components: string[];
};

type DayBucket = {
  date: string;
  events: HistoryEvent[];
};

type HistoryData = {
  pageName: string;
  logoUrl: string;
  footerText: string;
  days: DayBucket[];
  eventCount: number;
};

type Tone = 'success' | 'warning' | 'danger' | 'blue' | 'muted';

type PageParams = {
  slug: string;
};

type PageSearchParams = Record<string, string | string[] | undefined>;

type HistoryPageProps = {
  params: Promise<PageParams>;
  searchParams?: Promise<PageSearchParams>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function listFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];
  const items = record.items;
  const rows = record.rows;
  const data = record.data;
  if (Array.isArray(items)) return items;
  if (Array.isArray(rows)) return rows;
  if (Array.isArray(data)) return data;
  return [];
}

function stringValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return '';
}

function firstString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = stringValue(record[key]);
    if (value.trim().length > 0) return value;
  }
  return '';
}

function componentNames(value: unknown): string[] {
  return listFrom(value)
    .map((item: unknown): string => {
      const record = asRecord(item);
      if (!record) return stringValue(item);
      return firstString(record, ['name', 'component_name', 'title']);
    })
    .filter((name: string): boolean => name.trim().length > 0)
    .slice(0, 4);
}

function currentMonth(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isMonthText(value: string): boolean {
  if (value.length !== 7 || value.charAt(4) !== '-') return false;
  const digits = `${value.slice(0, 4)}${value.slice(5, 7)}`;
  return digits.split('').every((character: string): boolean => character >= '0' && character <= '9');
}

function parseMonth(value: string | null): string {
  if (value && isMonthText(value)) return value;
  return currentMonth();
}

function searchParamValue(searchParams: PageSearchParams | undefined, key: string): string | null {
  const value = searchParams?.[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function shiftMonth(month: string, delta: number): string {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const date = new Date(year, monthIndex + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthDays(month: string): DayBucket[] {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const total = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: total }, (_: unknown, index: number): DayBucket => ({
    date: `${month}-${String(index + 1).padStart(2, '0')}`,
    events: [],
  })).reverse();
}

function isIsoDayPrefix(value: string): boolean {
  if (value.length < 10 || value.charAt(4) !== '-' || value.charAt(7) !== '-') return false;
  const digits = `${value.slice(0, 4)}${value.slice(5, 7)}${value.slice(8, 10)}`;
  return digits.split('').every((character: string): boolean => character >= '0' && character <= '9');
}

function isoDay(value: string): string {
  if (isIsoDayPrefix(value)) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function parseIncident(item: unknown, slug: string, fallbackDate: string): HistoryEvent | null {
  const record = asRecord(item);
  if (!record) return null;
  const id = firstString(record, ['id', 'incident_id']);
  if (!id) return null;
  const startedAt = firstString(record, ['started_at', 'created_at', 'published_at']) || `${fallbackDate}T12:00:00.000Z`;
  return {
    id,
    kind: 'incident',
    title: firstString(record, ['title']) || 'Incidente operativo',
    description: firstString(record, ['description']),
    status: firstString(record, ['status']) || 'investigating',
    impact: firstString(record, ['impact']) || 'minor',
    startedAt,
    endedAt: firstString(record, ['resolved_at', 'ended_at']),
    href: `/s/${encodeURIComponent(slug)}/incidents/${encodeURIComponent(id)}`,
    components: componentNames(record.components ?? record.affected_components),
  };
}

function parseMaintenance(item: unknown, slug: string, fallbackDate: string): HistoryEvent | null {
  const record = asRecord(item);
  if (!record) return null;
  const id = firstString(record, ['id', 'maintenance_id']);
  if (!id) return null;
  const startedAt = firstString(record, ['scheduled_start_at', 'started_at', 'created_at']) || `${fallbackDate}T12:00:00.000Z`;
  return {
    id,
    kind: 'maintenance',
    title: firstString(record, ['title']) || 'Mantenimiento programado',
    description: firstString(record, ['description']),
    status: firstString(record, ['status']) || 'scheduled',
    impact: firstString(record, ['impact']) || 'none',
    startedAt,
    endedAt: firstString(record, ['completed_at', 'scheduled_end_at']),
    href: `/s/${encodeURIComponent(slug)}/maintenances/${encodeURIComponent(id)}`,
    components: componentNames(record.components ?? record.affected_components),
  };
}

function normalizeHistory(payload: unknown, slug: string, month: string): HistoryData {
  const root = asRecord(payload) ?? {};
  const statusPage = asRecord(root.status_page) ?? {};
  const pageName = firstString(statusPage, ['name']) || firstString(root, ['name']) || 'StatusPe';
  const logoUrl = firstString(statusPage, ['logo_url']) || firstString(root, ['logo_url']);
  const footerText = firstString(statusPage, ['footer_text']) || 'Powered by StatusPe';
  const dayMap = new Map<string, DayBucket>();
  monthDays(month).forEach((day: DayBucket): void => dayMap.set(day.date, { ...day }));
  const seen = new Set<string>();

  function addEvent(event: HistoryEvent | null, fallbackDate: string): void {
    if (!event) return;
    const day = isoDay(event.startedAt) || fallbackDate;
    if (!day.startsWith(month)) return;
    const key = `${event.kind}:${event.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    const bucket = dayMap.get(day) ?? { date: day, events: [] };
    bucket.events.push(event);
    dayMap.set(day, bucket);
  }

  const daySources = [...listFrom(root.days), ...listFrom(root.history)];
  daySources.forEach((item: unknown): void => {
    const record = asRecord(item);
    if (!record) return;
    const day = firstString(record, ['date', 'day']) || isoDay(firstString(record, ['started_at', 'scheduled_start_at']));
    if (!day) return;
    listFrom(record.incidents).forEach((incident: unknown): void => addEvent(parseIncident(incident, slug, day), day));
    listFrom(record.maintenances).forEach((maintenance: unknown): void => addEvent(parseMaintenance(maintenance, slug, day), day));
    listFrom(record.events).forEach((eventItem: unknown): void => {
      const eventRecord = asRecord(eventItem);
      const eventKind = eventRecord ? firstString(eventRecord, ['kind', 'type']) : '';
      if (eventKind === 'maintenance') addEvent(parseMaintenance(eventItem, slug, day), day);
      else addEvent(parseIncident(eventItem, slug, day), day);
    });
  });

  listFrom(root.incidents).forEach((incident: unknown): void => addEvent(parseIncident(incident, slug, month), month));
  listFrom(root.maintenances).forEach((maintenance: unknown): void => addEvent(parseMaintenance(maintenance, slug, month), month));

  listFrom(payload).forEach((item: unknown): void => {
    const record = asRecord(item);
    if (!record) return;
    const kind = firstString(record, ['kind', 'type']);
    if (kind === 'maintenance' || record.scheduled_start_at) addEvent(parseMaintenance(item, slug, month), month);
    if (kind === 'incident' || record.started_at) addEvent(parseIncident(item, slug, month), month);
  });

  const days = Array.from(dayMap.values())
    .sort((a: DayBucket, b: DayBucket): number => b.date.localeCompare(a.date))
    .map((day: DayBucket): DayBucket => ({
      ...day,
      events: [...day.events].sort((a: HistoryEvent, b: HistoryEvent): number => b.startedAt.localeCompare(a.startedAt)),
    }));

  return { pageName, logoUrl, footerText, days, eventCount: seen.size };
}

async function requestOrigin(): Promise<string> {
  const headerStore = await headers();
  const forwardedHost = headerStore.get('x-forwarded-host');
  const forwardedProtocol = headerStore.get('x-forwarded-proto');
  const host = forwardedHost ?? headerStore.get('host') ?? process.env.VERCEL_URL ?? 'localhost:3000';
  const protocol = forwardedProtocol ?? (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

async function fetchHistoryData(slug: string, month: string): Promise<HistoryData> {
  const origin = await requestOrigin();
  const url = new URL(`/api/v1/status-pages/${encodeURIComponent(slug)}/history`, origin);
  url.searchParams.set('month', month);
  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) throw new Error(`El servidor respondió ${response.status}. Intenta nuevamente en unos segundos.`);
  const payload: unknown = await response.json();
  return normalizeHistory(payload, slug, month);
}

function formatMonthLabel(month: string): string {
  const [yearText, monthText] = month.split('-');
  return new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(new Date(Number(yearText), Number(monthText) - 1, 1));
}

function formatDay(dateText: string): string {
  const date = new Date(`${dateText}T12:00:00`);
  return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: '2-digit', month: 'short' }).format(date);
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Hora no disponible';
  return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function durationLabel(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  if (Number.isNaN(startDate.getTime())) return 'Duración no disponible';
  if (!endDate || Number.isNaN(endDate.getTime())) return 'En curso';
  const minutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

function impactLabel(impact: string): string {
  const labels: Record<string, string> = { none: 'Sin impacto', minor: 'Impacto menor', major: 'Impacto mayor', critical: 'Crítico' };
  return labels[impact] ?? 'Impacto menor';
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    investigating: 'Investigando',
    identified: 'Identificado',
    monitoring: 'Monitoreando',
    resolved: 'Resuelto',
    scheduled: 'Programado',
    in_progress: 'En progreso',
    verifying: 'Verificando',
    completed: 'Completado',
    cancelled: 'Cancelado',
  };
  return labels[status] ?? status;
}

function toneForImpact(impact: string): Tone {
  if (impact === 'critical' || impact === 'major') return 'danger';
  if (impact === 'minor') return 'warning';
  return 'success';
}

function toneClasses(tone: Tone): string {
  const classes: Record<Tone, string> = {
    success: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
    warning: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    danger: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
    blue: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]',
    muted: 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]',
  };
  return classes[tone];
}

function Header(): JSX.Element {
  return (
    <header className='sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur'>
      <nav className='mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8' aria-label='Navegación principal'>
        <Link href='/' className='flex min-h-11 items-center gap-3 rounded-full pr-3 text-[#0F172A] transition-all duration-200 hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>
          <span className='flex size-9 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-extrabold text-[#1D4ED8]'>SP</span>
          <span className='hidden text-sm font-bold tracking-tight text-[#0F172A] sm:inline'>StatusPe</span>
        </Link>
        <div className='flex items-center gap-1 overflow-x-auto rounded-full bg-white p-1 text-sm shadow-sm ring-1 ring-[#E2E8F0]'>
          <Link href='/' className='min-h-10 whitespace-nowrap rounded-full px-3 py-2 font-semibold text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Estado</Link>
          <Link href='/s/statuspe/history' className='min-h-10 whitespace-nowrap rounded-full bg-[#EFF6FF] px-3 py-2 font-semibold text-[#2563EB] transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Historial</Link>
          <Link href='/s/statuspe/subscribe' className='min-h-10 whitespace-nowrap rounded-full px-3 py-2 font-semibold text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Suscribirse</Link>
          <Link href='/api/v1/status-pages/[slug]' className='min-h-10 whitespace-nowrap rounded-full px-3 py-2 font-semibold text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>RSS</Link>
        </div>
      </nav>
    </header>
  );
}

function ErrorBanner({ message }: { message: string }): JSX.Element {
  return (
    <div className='rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 shadow-sm' role='alert'>
      <p className='text-sm font-bold text-[#991B1B]'>No pudimos cargar este historial</p>
      <p className='mt-1 text-sm leading-6 text-[#7F1D1D]'>{message}</p>
    </div>
  );
}

function EmptyMonth({ slug, month }: { slug: string; month: string }): JSX.Element {
  return (
    <section className='rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm'>
      <div className='mx-auto flex size-14 items-center justify-center rounded-full bg-[#EFF6FF] text-2xl' aria-hidden='true'>🛰️</div>
      <h2 className='mt-4 text-lg font-semibold text-[#0F172A]'>Sin incidentes registrados en {formatMonthLabel(month)}</h2>
      <p className='mx-auto mt-2 max-w-xl text-sm leading-6 text-[#334155]'>La bitácora está limpia para este mes. Aun así, mantenemos cada día visible para que el historial sea auditable.</p>
      <Link href={`/s/${slug}/subscribe`} className='mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Recibir alertas</Link>
    </section>
  );
}

function DayBar({ days }: { days: DayBucket[] }): JSX.Element {
  const chronological = [...days].reverse();
  return (
    <div className='grid grid-cols-7 gap-1.5 sm:grid-cols-14 md:grid-cols-31' aria-label='Resumen visual del mes'>
      {chronological.map((day: DayBucket): JSX.Element => {
        const hasDanger = day.events.some((event: HistoryEvent): boolean => event.impact === 'critical' || event.impact === 'major');
        const hasWarning = day.events.length > 0 && !hasDanger;
        const color = hasDanger ? 'bg-[#DC2626]' : hasWarning ? 'bg-[#F59E0B]' : 'bg-[#16A34A]';
        return <span key={day.date} title={`${formatDay(day.date)} · ${day.events.length === 0 ? 'sin eventos' : `${day.events.length} evento(s)`}`} className={`h-8 rounded-lg ${color} shadow-sm ring-1 ring-black/5`} />;
      })}
    </div>
  );
}

function EventCard({ event }: { event: HistoryEvent }): JSX.Element {
  const eventTone = event.kind === 'maintenance' ? 'blue' : toneForImpact(event.impact);
  return (
    <Link href={event.href} className='group block rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-lg hover:shadow-blue-950/5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses(eventTone)}`}>{event.kind === 'maintenance' ? 'Mantenimiento' : 'Incidente'}</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses(toneForImpact(event.impact))}`}>{impactLabel(event.impact)}</span>
            <span className='inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#475569]'>{statusLabel(event.status)}</span>
          </div>
          <h3 className='mt-3 text-base font-bold text-[#0F172A] transition-colors duration-200 group-hover:text-[#2563EB]'>{event.title}</h3>
          {event.description ? <p className='mt-1 line-clamp-2 text-sm leading-6 text-[#334155]'>{event.description}</p> : null}
          {event.components.length > 0 ? <p className='mt-3 text-xs font-medium text-[#64748B]'>Afectó: {event.components.join(', ')}</p> : null}
        </div>
        <div className='flex shrink-0 flex-row gap-3 sm:flex-col sm:text-right'>
          <div>
            <p className='text-xs font-medium text-[#64748B]'>Inicio</p>
            <p className='text-sm font-semibold text-[#0F172A]'>{formatTime(event.startedAt)}</p>
          </div>
          <div>
            <p className='text-xs font-medium text-[#64748B]'>Duración</p>
            <p className='text-sm font-semibold text-[#0F172A]'>{durationLabel(event.startedAt, event.endedAt)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DaySection({ day }: { day: DayBucket }): JSX.Element {
  return (
    <section className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6'>
      <div className='flex flex-col gap-2 border-b border-[#E2E8F0] pb-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wide text-[#64748B]'>{day.date}</p>
          <h2 className='mt-1 text-lg font-semibold capitalize text-[#0F172A]'>{formatDay(day.date)}</h2>
        </div>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${day.events.length > 0 ? toneClasses('warning') : toneClasses('success')}`}>{day.events.length > 0 ? `${day.events.length} evento(s)` : 'Operación normal'}</span>
      </div>
      <div className='mt-4 space-y-3'>
        {day.events.length === 0 ? (
          <div className='flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4'>
            <span className='flex size-9 items-center justify-center rounded-full bg-[#DCFCE7] text-sm font-bold text-[#166534]' aria-hidden='true'>✓</span>
            <p className='text-sm font-medium text-[#334155]'>No se reportaron incidentes</p>
          </div>
        ) : (
          day.events.map((event: HistoryEvent): JSX.Element => <EventCard key={`${event.kind}-${event.id}`} event={event} />)
        )}
      </div>
    </section>
  );
}

export async function generateMetadata({ params, searchParams }: HistoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const month = parseMonth(searchParamValue(resolvedSearchParams, 'month'));
  let pageName = 'StatusPe';

  try {
    const history = await fetchHistoryData(slug, month);
    pageName = history.pageName;
  } catch {
    pageName = 'StatusPe';
  }

  return {
    title: `${pageName} uptime history ${month} — StatusPe`,
    description: `Historial público de uptime, incidentes y mantenimientos de ${pageName} para ${month}`,
    alternates: {
      canonical: `/s/${slug}/history?month=${month}`,
    },
  };
}

export default async function HistoryPage({ params, searchParams }: HistoryPageProps): Promise<JSX.Element> {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const month = parseMonth(searchParamValue(resolvedSearchParams, 'month'));
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  let history: HistoryData | null = null;
  let error = '';

  try {
    history = await fetchHistoryData(slug, month);
  } catch (caught: unknown) {
    error = caught instanceof Error ? caught.message : 'Ocurrió un error inesperado al consultar el historial.';
  }

  return (
    <div className='min-h-screen bg-[#F6F8FC]'>
      <Header />
      <main className='mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8'>
        <div className='space-y-6'>
          {!history ? <ErrorBanner message={error} /> : null}

          {history ? (
            <>
              <section className='rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#EFF6FF] to-[#FFFFFF] p-5 shadow-lg shadow-blue-950/5 sm:p-6'>
                <div className='flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between'>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-3'>
                      {history.logoUrl ? <img src={history.logoUrl} alt={`Logo de ${history.pageName}`} className='size-11 rounded-full border border-[#E2E8F0] bg-white object-cover shadow-sm' /> : <span className='flex size-11 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-extrabold text-[#1D4ED8]'>{history.pageName.slice(0, 2).toUpperCase()}</span>}
                      <div>
                        <p className='text-xs font-semibold uppercase tracking-wide text-[#2563EB]'>{history.pageName}</p>
                        <h1 className='mt-1 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl'>Historial de incidentes</h1>
                      </div>
                    </div>
                    <p className='mt-4 max-w-2xl text-sm leading-6 text-[#334155] sm:text-base'>Bitácora pública de incidentes y mantenimientos para {formatMonthLabel(month)}. Cada evento incluye impacto, duración y enlace al detalle operativo.</p>
                  </div>
                  <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col'>
                    <Link href={`/s/${slug}/history?month=${previousMonth}`} className='inline-flex min-h-11 items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] shadow-sm transition-all duration-200 hover:bg-[#F8FAFC] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>← {formatMonthLabel(previousMonth)}</Link>
                    <Link href={`/s/${slug}/history?month=${nextMonth}`} className='inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>{formatMonthLabel(nextMonth)} →</Link>
                  </div>
                </div>
                <div className='mt-6 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm'>
                  <div className='mb-3 flex items-center justify-between gap-3'>
                    <p className='text-sm font-semibold text-[#0F172A]'>Uptime diario del mes</p>
                    <p className='text-xs font-medium text-[#64748B]'>{history.eventCount} evento(s)</p>
                  </div>
                  <DayBar days={history.days} />
                </div>
              </section>

              {history.eventCount === 0 ? <EmptyMonth slug={slug} month={month} /> : null}

              <div className='space-y-4'>
                {history.days.map((day: DayBucket): JSX.Element => <DaySection key={day.date} day={day} />)}
              </div>

              <footer className='pb-6 text-center text-xs font-medium text-[#64748B]'>{history.footerText}</footer>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
