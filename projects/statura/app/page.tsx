"use client";
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Row = Record<string, unknown>;

type StatusPayload = {
  statusPage: Row | null;
  groups: Row[];
  components: Row[];
  endpoints: Row[];
  uptimeDays: Row[];
  incidents: Row[];
  maintenances: Row[];
};

type GlobalState = 'operational' | 'degraded' | 'partial' | 'major' | 'maintenance';

type SubscribeState = 'idle' | 'sending' | 'success';

const config = { defaultStatusPageSlug: process.env.NEXT_PUBLIC_DEFAULT_STATUS_PAGE_SLUG ?? 'statura' };

function isRecord(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Row | null {
  return isRecord(value) ? value : null;
}

function normalizeList(value: unknown): Row[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (isRecord(value)) {
    const items = value.items;
    if (Array.isArray(items)) return items.filter(isRecord);
    const rows = value.rows;
    if (Array.isArray(rows)) return rows.filter(isRecord);
  }
  return [];
}

function readText(row: Row | null | undefined, key: string, fallback = ''): string {
  const value = row?.[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function readNumber(row: Row | null | undefined, key: string, fallback = 0): number {
  const value = row?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function readBoolean(row: Row | null | undefined, key: string, fallback: boolean): boolean {
  const value = row?.[key];
  return typeof value === 'boolean' ? value : fallback;
}

function readNestedRows(root: Row | null, key: string): Row[] {
  if (!root) return [];
  return normalizeList(root[key]);
}

function uniqueById(rows: Row[]): Row[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const id = String(row.id ?? `${readText(row, 'title')}-${readText(row, 'name')}-${readText(row, 'started_at')}`);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function parsePayload(raw: unknown): StatusPayload {
  const root = asRecord(raw);
  const statusPage = asRecord(root?.status_page) ?? asRecord(root?.page) ?? asRecord(root?.statusPage) ?? (root && (root.title || root.slug) ? root : null);
  const groups = readNestedRows(root, 'component_groups').concat(readNestedRows(statusPage, 'component_groups'));
  const components = readNestedRows(root, 'components').concat(readNestedRows(statusPage, 'components'));
  const endpoints = readNestedRows(root, 'endpoints').concat(readNestedRows(statusPage, 'endpoints'));
  const uptimeDays = readNestedRows(root, 'uptime_days').concat(readNestedRows(statusPage, 'uptime_days'));
  const incidents = readNestedRows(root, 'incidents')
    .concat(readNestedRows(root, 'active_incidents'))
    .concat(readNestedRows(root, 'past_incidents'))
    .concat(readNestedRows(statusPage, 'incidents'));
  const maintenances = readNestedRows(root, 'maintenances')
    .concat(readNestedRows(root, 'scheduled_maintenances'))
    .concat(readNestedRows(statusPage, 'maintenances'));

  return {
    statusPage,
    groups: uniqueById(groups).sort((a, b) => readNumber(a, 'position') - readNumber(b, 'position')),
    components: uniqueById(components).sort((a, b) => readNumber(a, 'position') - readNumber(b, 'position')),
    endpoints: uniqueById(endpoints),
    uptimeDays: uniqueById(uptimeDays),
    incidents: uniqueById(incidents).sort((a, b) => new Date(readText(b, 'started_at', readText(b, 'created_at'))).getTime() - new Date(readText(a, 'started_at', readText(a, 'created_at'))).getTime()),
    maintenances: uniqueById(maintenances).sort((a, b) => new Date(readText(a, 'scheduled_start')).getTime() - new Date(readText(b, 'scheduled_start')).getTime()),
  };
}

function formatDateTime(value: string, timezone = 'UTC'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time pending';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: timezone }).format(date);
}

function formatDay(value: string, timezone = 'UTC'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unscheduled day';
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone: timezone }).format(date);
}

function hostCandidate(): string {
  if (typeof window === 'undefined') return config.defaultStatusPageSlug;
  const host = window.location.hostname.toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || host.endsWith('.vercel.app')) return config.defaultStatusPageSlug;
  return host;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    operational: 'Operational',
    degraded: 'Degraded',
    degraded_performance: 'Degraded Performance',
    partial_outage: 'Partial Outage',
    major_outage: 'Major Outage',
    down: 'Down',
    unknown: 'Unknown',
    under_maintenance: 'Under Maintenance',
    investigating: 'Investigating',
    identified: 'Identified',
    monitoring: 'Monitoring',
    resolved: 'Resolved',
    scheduled: 'Scheduled',
    in_progress: 'In progress',
    verifying: 'Verifying',
    completed: 'Completed',
  };
  return labels[status] ?? status.replaceAll('_', ' ');
}

function statusChipClass(status: string): string {
  if (status === 'operational' || status === 'resolved' || status === 'completed') return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
  if (status === 'degraded' || status === 'degraded_performance' || status === 'partial_outage' || status === 'scheduled' || status === 'in_progress' || status === 'verifying' || status === 'under_maintenance') return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
  if (status === 'major_outage' || status === 'down' || status === 'critical') return 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
  return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
}

function globalCopy(state: GlobalState): { title: string; detail: string; dot: string; badge: string } {
  if (state === 'major') return { title: 'Major Outage', detail: 'A critical service interruption is currently being handled by the response team.', dot: 'bg-[#EF4444]', badge: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]' };
  if (state === 'partial') return { title: 'Partial System Outage', detail: 'Some components are unavailable. Updates are published as the incident progresses.', dot: 'bg-[#F59E0B]', badge: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' };
  if (state === 'degraded') return { title: 'Degraded Performance', detail: 'Core services are reachable, with elevated latency or reduced reliability on some components.', dot: 'bg-[#F59E0B]', badge: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' };
  if (state === 'maintenance') return { title: 'Under Maintenance', detail: 'Scheduled operational work is in progress. Customer impact is being actively monitored.', dot: 'bg-[#2563EB]', badge: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]' };
  return { title: 'All Systems Operational', detail: 'All public components are healthy. We continuously check availability and response health.', dot: 'bg-[#10B981]', badge: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]' };
}

function deriveGlobalState(components: Row[], endpoints: Row[], incidents: Row[], maintenances: Row[]): GlobalState {
  const activeIncidents = incidents.filter((incident) => readText(incident, 'status') !== 'resolved');
  const activeMaintenance = maintenances.some((maintenance) => ['in_progress', 'verifying'].includes(readText(maintenance, 'status')));
  const statuses = components.map((component) => readText(component, 'current_status')).concat(endpoints.map((endpoint) => readText(endpoint, 'current_status')));
  if (activeIncidents.some((incident) => readText(incident, 'impact') === 'critical') || statuses.some((status) => ['major_outage', 'down'].includes(status))) return 'major';
  if (activeIncidents.some((incident) => readText(incident, 'impact') === 'major') || statuses.includes('partial_outage')) return 'partial';
  if (statuses.some((status) => ['degraded', 'degraded_performance'].includes(status))) return 'degraded';
  if (activeMaintenance || statuses.includes('under_maintenance')) return 'maintenance';
  return 'operational';
}

function componentEndpoints(component: Row, endpoints: Row[]): Row[] {
  const id = String(component.id ?? '');
  const nested = readNestedRows(component, 'endpoints');
  const attached = endpoints.filter((endpoint) => String(endpoint.component_id ?? '') === id);
  return uniqueById(nested.concat(attached));
}

function daysForComponent(component: Row, allDays: Row[]): Row[] {
  const nested = readNestedRows(component, 'uptime_days');
  const id = String(component.id ?? '');
  const attached = allDays.filter((day) => String(day.component_id ?? '') === id);
  return uniqueById(nested.concat(attached));
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function uptimeBars(component: Row, allDays: Row[]): Row[] {
  const byDay = new Map<string, Row>();
  daysForComponent(component, allDays).forEach((day) => {
    const key = readText(day, 'day').slice(0, 10);
    if (key) byDay.set(key, day);
  });
  return Array.from({ length: 90 }, (_, index) => {
    const date = new Date();
    date.setUTCHours(12, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (89 - index));
    const key = isoDay(date);
    return byDay.get(key) ?? { day: key, status: 'no_data', uptime_percentage: 0, checks_count: 0 };
  });
}

function uptimeColor(status: string, percentage: number): string {
  if (status === 'no_data') return 'bg-[#D8E0EE]';
  if (status === 'major_outage' || percentage < 95) return 'bg-[#EF4444]';
  if (status === 'partial_outage' || status === 'degraded_performance' || percentage < 99.5) return 'bg-[#F59E0B]';
  if (status === 'under_maintenance') return 'bg-[#2563EB]';
  return 'bg-[#10B981]';
}

function uptimePercent(component: Row, allDays: Row[]): number | null {
  const measured = uptimeBars(component, allDays).filter((day) => readText(day, 'status') !== 'no_data' && readNumber(day, 'checks_count', 1) > 0);
  if (measured.length === 0) return null;
  const total = measured.reduce((sum, day) => sum + readNumber(day, 'uptime_percentage', 100), 0);
  return total / measured.length;
}

function durationLabel(start: string, end?: string): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 'Duration pending';
  const minutes = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

function latestUpdate(incident: Row): Row | null {
  const updates = readNestedRows(incident, 'updates').concat(readNestedRows(incident, 'incident_updates'));
  if (updates.length === 0) return asRecord(incident.latest_update);
  return updates.sort((a, b) => new Date(readText(b, 'published_at', readText(b, 'created_at'))).getTime() - new Date(readText(a, 'published_at', readText(a, 'created_at'))).getTime())[0] ?? null;
}

function groupByDay(rows: Row[], timezone: string): { key: string; rows: Row[] }[] {
  const grouped = new Map<string, Row[]>();
  rows.forEach((row) => {
    const key = formatDay(readText(row, 'started_at', readText(row, 'scheduled_start', readText(row, 'created_at'))), timezone);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  });
  return Array.from(grouped.entries()).map(([key, value]) => ({ key, rows: value }));
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-black/5 ${className}`} />;
}

function ErrorBanner({ message, onRetry, onDismiss }: { message: string; onRetry: () => void; onDismiss: () => void }) {
  return (
    <div className={'rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-[#0B1220] shadow-sm'} role={'alert'}>
      <div className={'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'}>
        <div>
          <p className={'text-sm font-bold text-[#B91C1C]'}>We couldn’t refresh the public status page.</p>
          <p className={'mt-1 text-sm leading-6 text-[#7F1D1D]'}>{message}</p>
        </div>
        <div className={'flex gap-2'}>
          <button onClick={onRetry} className={'min-h-11 rounded-full bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#B91C1C] shadow-sm transition-all duration-200 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2'}>Retry</button>
          <button onClick={onDismiss} aria-label={'Dismiss error'} className={'min-h-11 rounded-full bg-[#B91C1C] px-4 py-2 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:bg-[#991B1B] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2'}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}

function Header({ title, logoText, global, onSubscribe }: { title: string; logoText: string; global: GlobalState; onSubscribe: () => void }) {
  const copy = globalCopy(global);
  return (
    <header className={'sticky top-0 z-40 border-b border-[#D8E0EE]/80 bg-[#F6F8FC]/90 backdrop-blur-xl'}>
      <div className={'mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8'}>
        <Link href={'/'} className={'flex min-h-11 items-center gap-3 rounded-full pr-3 transition-all duration-200 hover:bg-[#FFFFFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'}>
          <span className={'flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-[#FFFFFF] shadow-sm'}>{logoText}</span>
          <span className={'hidden text-sm font-extrabold tracking-tight text-[#0B1220] sm:inline'}>{title}</span>
        </Link>
        <nav className={'hidden items-center gap-1 rounded-full border border-[#D8E0EE] bg-[#F9FBFF] p-1 md:flex'} aria-label={'Primary navigation'}>
          <Link href={'/'} className={'rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8]'}>Estado</Link>
          <Link href={'/uptime'} className={'rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]'}>Uptime histórico</Link>
          <Link href={'/history'} className={'rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]'}>Historial de incidentes</Link>
          <Link href={'/api/public/status-pages/[slug]'} className={'rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]'}>RSS</Link>
        </nav>
        <div className={'flex items-center gap-2'}>
          <span className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold sm:inline-flex ${copy.badge}`}><span className={`h-2 w-2 rounded-full ${copy.dot}`} />{copy.title}</span>
          <button onClick={onSubscribe} className={'min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'}>Subscribe to updates</button>
        </div>
      </div>
    </header>
  );
}

function LoadingState() {
  return (
    <main className={'mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'}>
      <SkeletonBlock className={'h-64 w-full'} />
      <div className={'mt-6 grid gap-4 md:grid-cols-2'}>
        <SkeletonBlock className={'h-48'} />
        <SkeletonBlock className={'h-48'} />
        <SkeletonBlock className={'h-48'} />
        <SkeletonBlock className={'h-48'} />
      </div>
      <div className={'mt-6 grid gap-4 lg:grid-cols-2'}>
        <SkeletonBlock className={'h-40'} />
        <SkeletonBlock className={'h-40'} />
      </div>
    </main>
  );
}

function EmptyState({ onSubscribe }: { onSubscribe: () => void }) {
  return (
    <main className={'mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8'}>
      <section className={'rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-8 text-center text-[#0B1220] shadow-sm'}>
        <div className={'mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF] text-3xl'} aria-hidden={'true'}>◌</div>
        <h1 className={'mt-5 text-2xl font-extrabold tracking-tight text-[#0B1220] sm:text-3xl'}>No endpoints configured yet</h1>
        <p className={'mx-auto mt-2 max-w-xl text-sm leading-6 text-[#526071] sm:text-base'}>This public status page is live, but there are no visible components to report. Subscribe and we’ll notify you as soon as monitoring starts.</p>
        <div className={'mt-6 flex flex-col justify-center gap-3 sm:flex-row'}>
          <button onClick={onSubscribe} className={'min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'}>Subscribe to updates</button>
          <Link href={'/uptime'} className={'min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-5 py-2.5 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:bg-[#F9FBFF] hover:border-[#B8C4D8] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'}>View historical uptime</Link>
        </div>
      </section>
    </main>
  );
}

function UptimeStrip({ component, uptimeDays }: { component: Row; uptimeDays: Row[] }) {
  const bars = uptimeBars(component, uptimeDays);
  const percent = uptimePercent(component, uptimeDays);
  return (
    <div>
      <div className={'mb-2 flex items-center justify-between gap-3'}>
        <span className={'text-xs font-medium text-[#7A8799]'}>90-day uptime</span>
        <span className={'text-xs font-bold text-[#0B1220]'}>{percent === null ? 'No checks yet' : `${percent.toFixed(3)}%`}</span>
      </div>
      <div className={'flex h-8 items-end gap-[2px] overflow-hidden rounded-lg'} aria-label={`90 day uptime for ${readText(component, 'name', 'component')}`}>
        {bars.map((day) => {
          const status = readText(day, 'status', 'no_data');
          const percentage = readNumber(day, 'uptime_percentage', 0);
          const label = `${readText(day, 'day')}: ${statusLabel(status)}, ${percentage.toFixed(3)}% uptime`;
          return <span key={readText(day, 'day')} title={label} aria-label={label} className={`min-w-[3px] flex-1 rounded-full ${uptimeColor(status, percentage)}`} />;
        })}
      </div>
    </div>
  );
}

function ComponentCard({ component, endpoints, uptimeDays }: { component: Row; endpoints: Row[]; uptimeDays: Row[] }) {
  const status = readText(component, 'current_status', 'operational');
  const attachedEndpoints = componentEndpoints(component, endpoints).filter((endpoint) => readBoolean(endpoint, 'is_public', true));
  return (
    <article className={'rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-6'}>
      <div className={'flex items-start justify-between gap-3'}>
        <div>
          <h3 className={'text-base font-semibold text-[#0B1220]'}>{readText(component, 'name', 'Public component')}</h3>
          {readText(component, 'description') ? <p className={'mt-1 text-sm leading-6 text-[#526071]'}>{readText(component, 'description')}</p> : null}
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusChipClass(status)}`}>{statusLabel(status)}</span>
      </div>
      {attachedEndpoints.length > 0 ? (
        <div className={'mt-4 space-y-2'}>
          {attachedEndpoints.slice(0, 3).map((endpoint) => {
            const endpointStatus = readText(endpoint, 'current_status', 'unknown');
            return (
              <div key={String(endpoint.id ?? readText(endpoint, 'url'))} className={'flex items-center justify-between gap-3 rounded-xl border border-[#D8E0EE] bg-[#F9FBFF] px-3 py-2'}>
                <div className={'min-w-0'}>
                  <p className={'truncate text-sm font-semibold text-[#0B1220]'}>{readText(endpoint, 'name', readText(component, 'name'))}</p>
                  <p className={'truncate text-xs font-medium text-[#7A8799]'}>{readText(endpoint, 'method', 'GET')} · {readText(endpoint, 'url')}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusChipClass(endpointStatus)}`}>{statusLabel(endpointStatus)}</span>
              </div>
            );
          })}
        </div>
      ) : null}
      <div className={'mt-5'}>
        <UptimeStrip component={component} uptimeDays={uptimeDays} />
      </div>
    </article>
  );
}

function SubscribeModal({ open, onClose, slug, title, components }: { open: boolean; onClose: () => void; slug: string; title: string; components: Row[] }) {
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, setState] = useState<SubscribeState>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) setSelected(new Set(components.map((component) => String(component.id ?? '')).filter(Boolean)));
  }, [components, open]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Enter a valid email address to receive operational updates.');
      return;
    }
    setState('sending');
    try {
      const componentIds = Array.from(selected).map((id) => Number(id)).filter((id) => Number.isFinite(id));
      const response = await fetch(`/api/public/status-pages/[slug]${encodeURIComponent(slug)}/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'email', destination: email, component_ids: componentIds }),
      });
      if (!response.ok) throw new Error(`Subscription request failed with status ${response.status}`);
      setState('success');
    } catch (caught: any) {
      const message = caught instanceof Error ? caught.message : 'Subscription could not be created.';
      setError(message);
      setState('idle');
    }
  };

  if (!open) return null;

  return (
    <div className={'fixed inset-0 z-50 flex items-end justify-center bg-[#0F172A]/55 p-4 backdrop-blur-sm sm:items-center'} role={'dialog'} aria-modal={'true'} aria-labelledby={'subscribe-title'}>
      <div className={'w-full max-w-xl rounded-3xl border border-[#D8E0EE] bg-[#FFFFFF] p-5 text-[#0B1220] shadow-2xl sm:p-6'}>
        <div className={'flex items-start justify-between gap-4'}>
          <div>
            <span className={'inline-flex items-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#1D4ED8]'}>Email notifications</span>
            <h2 id={'subscribe-title'} className={'mt-3 text-2xl font-extrabold tracking-tight text-[#0B1220]'}>Subscribe to updates</h2>
            <p className={'mt-2 text-sm leading-6 text-[#526071]'}>Get incident, maintenance, and resolution notices for {title}. We only send operational updates.</p>
          </div>
          <button onClick={onClose} aria-label={'Close subscription modal'} className={'min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-4 text-sm font-bold text-[#0B1220] transition-all duration-200 hover:bg-[#F9FBFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'}>✕</button>
        </div>

        {state === 'success' ? (
          <div className={'mt-6 rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-5 text-[#0B1220]'}>
            <div className={'flex items-center gap-3'}><span className={'flex h-10 w-10 items-center justify-center rounded-full bg-[#10B981] text-[#FFFFFF]'}>✓</span><div><p className={'font-bold text-[#047857]'}>Check your inbox</p><p className={'text-sm leading-6 text-[#065F46]'}>We sent a verification link to {email}. Your subscription becomes active after verification.</p></div></div>
            <button onClick={onClose} className={'mt-5 min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className={'mt-6 space-y-4'}>
            <label className={'block'}>
              <span className={'text-sm font-semibold text-[#0B1220]'}>Email address</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type={'email'} placeholder={'you@company.com'} className={'mt-2 min-h-11 w-full rounded-xl border border-[#D8E0EE] bg-[#FFFFFF] px-4 text-sm text-[#0B1220] shadow-sm outline-none transition-all duration-200 placeholder:text-[#7A8799] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:opacity-60'} />
            </label>
            {components.length > 0 ? (
              <div>
                <p className={'text-sm font-semibold text-[#0B1220]'}>Components</p>
                <div className={'mt-2 grid gap-2 sm:grid-cols-2'}>
                  {components.map((component) => {
                    const id = String(component.id ?? '');
                    const checked = selected.has(id);
                    return (
                      <label key={id || readText(component, 'name')} className={'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#D8E0EE] bg-[#F9FBFF] px-3 py-2 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:border-[#B8C4D8] hover:bg-[#FFFFFF]'}>
                        <input type={'checkbox'} checked={checked} onChange={() => setSelected((previous) => { const next = new Set(previous); if (checked) next.delete(id); else next.add(id); return next; })} className={'h-4 w-4 accent-[#2563EB]'} />
                        {readText(component, 'name', 'Component')}
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {error ? <div className={'rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm font-semibold text-[#B91C1C]'}>{error}</div> : null}
            <button disabled={state === 'sending'} className={'min-h-11 w-full rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'}>{state === 'sending' ? 'Subscribing…' : 'Subscribe'}</button>
            <p className={'text-center text-xs font-medium leading-5 text-[#7A8799]'}>You can manage or unsubscribe from every notification email.</p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [resolvedSlug, setResolvedSlug] = useState(config.defaultStatusPageSlug);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(true);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const load = useCallback(async (showSkeleton: boolean) => {
    if (showSkeleton) setLoading(true);
    setError('');
    const first = hostCandidate();
    const candidates = Array.from(new Set([first, config.defaultStatusPageSlug, 'statura'].filter(Boolean)));
    let lastMessage = 'The status page API did not return a usable response.';
    for (const candidate of candidates) {
      try {
        const response = await fetch(`/api/public/status-pages/[slug]${encodeURIComponent(candidate)}`, { cache: 'no-store' });
        if (!response.ok) {
          lastMessage = `GET /api/public/status-pages/${candidate} returned ${response.status}.`;
          continue;
        }
        const json: unknown = await response.json();
        const parsed = parsePayload(json);
        if (!parsed.statusPage && parsed.components.length === 0) {
          lastMessage = 'The response did not include a public status page.';
          continue;
        }
        setPayload(parsed);
        setResolvedSlug(readText(parsed.statusPage, 'slug', candidate));
        setShowError(true);
        setLoading(false);
        return;
      } catch (caught: any) {
        lastMessage = caught instanceof Error ? caught.message : 'The status page API did not return a usable response.';
      }
    }
    setPayload(null);
    setError(lastMessage);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  const data = useMemo(() => payload ?? { statusPage: null, groups: [], components: [], endpoints: [], uptimeDays: [], incidents: [], maintenances: [] }, [payload]);
  const timezone = readText(data.statusPage, 'timezone', 'UTC');
  const title = readText(data.statusPage, 'title', 'Status');
  const logoText = readText(data.statusPage, 'title', 'S').slice(0, 1).toUpperCase() || 'S';
  const global = deriveGlobalState(data.components, data.endpoints, data.incidents, data.maintenances);
  const groupedIncidents = groupByDay(data.incidents, timezone);
  const groupedMaintenances = groupByDay(data.maintenances, timezone);

  if (loading) return <LoadingState />;

  return (
    <>
      <Header title={title} logoText={logoText} global={global} onSubscribe={() => setSubscribeOpen(true)} />
      <SubscribeModal open={subscribeOpen} onClose={() => setSubscribeOpen(false)} slug={resolvedSlug} title={title} components={data.components} />
      <main className={'mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'}>
        {error && showError ? <div className={'mb-6'}><ErrorBanner message={error} onRetry={() => void load(true)} onDismiss={() => setShowError(false)} /></div> : null}

        {!payload || data.components.length === 0 ? (
          <EmptyState onSubscribe={() => setSubscribeOpen(true)} />
        ) : (
          <div className={'space-y-6'}>
            <section className={'rounded-3xl border border-[#D8E0EE] bg-[#FFFFFF] p-6 shadow-sm sm:p-8'}>
              <div className={'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'}>
                <div>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${globalCopy(global).badge}`}><span className={`h-2 w-2 rounded-full ${globalCopy(global).dot}`} />{globalCopy(global).title}</span>
                  <h1 className={'mt-4 text-3xl font-extrabold tracking-tight text-[#0B1220] sm:text-4xl'}>{title}</h1>
                  <p className={'mt-3 max-w-3xl text-sm leading-6 text-[#526071] sm:text-base'}>{globalCopy(global).detail}</p>
                </div>
                <div className={'rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] px-4 py-3 text-sm font-medium text-[#526071]'}>
                  Updated {formatDateTime(new Date().toISOString(), timezone)}
                </div>
              </div>
            </section>

            <section className={'grid gap-4 md:grid-cols-2'}>
              {data.components.map((component) => (
                <ComponentCard key={String(component.id ?? readText(component, 'name'))} component={component} endpoints={data.endpoints} uptimeDays={data.uptimeDays} />
              ))}
            </section>

            {groupedIncidents.length > 0 ? (
              <section className={'rounded-3xl border border-[#D8E0EE] bg-[#FFFFFF] p-6 shadow-sm sm:p-8'}>
                <h2 className={'text-xl font-extrabold tracking-tight text-[#0B1220]'}>Incidents</h2>
                <div className={'mt-5 space-y-6'}>
                  {groupedIncidents.map((group) => (
                    <div key={group.key}>
                      <h3 className={'text-sm font-bold uppercase tracking-wide text-[#7A8799]'}>{group.key}</h3>
                      <div className={'mt-3 space-y-3'}>
                        {group.rows.map((incident) => {
                          const id = String(incident.id ?? readText(incident, 'name'));
                          const update = latestUpdate(incident);
                          const isCollapsed = collapsed[id] ?? true;
                          return (
                            <article key={id} className={'rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4'}>
                              <div className={'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'}>
                                <div>
                                  <div className={'flex flex-wrap items-center gap-2'}>
                                    <h4 className={'text-base font-bold text-[#0B1220]'}>{readText(incident, 'title', 'Incident')}</h4>
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusChipClass(readText(incident, 'status', 'investigating'))}`}>{statusLabel(readText(incident, 'status', 'investigating'))}</span>
                                  </div>
                                  <p className={'mt-1 text-xs font-medium text-[#7A8799]'}>{formatDateTime(readText(incident, 'started_at', readText(incident, 'created_at')), timezone)} · {durationLabel(readText(incident, 'started_at', readText(incident, 'created_at')), readText(incident, 'resolved_at') || undefined)}</p>
                                </div>
                                <button onClick={() => setCollapsed((prev) => ({ ...prev, [id]: !isCollapsed }))} className={'min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-4 text-sm font-semibold text-[#0B1220]'}>{isCollapsed ? 'Expand' : 'Collapse'}</button>
                              </div>
                              {!isCollapsed ? (
                                <div className={'mt-4 space-y-3'}>
                                  {readText(incident, 'body') ? <p className={'text-sm leading-6 text-[#526071]'}>{readText(incident, 'body')}</p> : null}
                                  {update ? (
                                    <div className={'rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4'}>
                                      <p className={'text-xs font-bold uppercase tracking-wide text-[#7A8799]'}>Latest update</p>
                                      <p className={'mt-2 text-sm font-semibold text-[#0B1220]'}>{readText(update, 'status', readText(incident, 'status', 'investigating'))}</p>
                                      <p className={'mt-1 text-sm leading-6 text-[#526071]'}>{readText(update, 'body', readText(update, 'message'))}</p>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {groupedMaintenances.length > 0 ? (
              <section className={'rounded-3xl border border-[#D8E0EE] bg-[#FFFFFF] p-6 shadow-sm sm:p-8'}>
                <h2 className={'text-xl font-extrabold tracking-tight text-[#0B1220]'}>Scheduled maintenance</h2>
                <div className={'mt-5 space-y-6'}>
                  {groupedMaintenances.map((group) => (
                    <div key={group.key}>
                      <h3 className={'text-sm font-bold uppercase tracking-wide text-[#7A8799]'}>{group.key}</h3>
                      <div className={'mt-3 space-y-3'}>
                        {group.rows.map((maintenance) => (
                          <article key={String(maintenance.id ?? readText(maintenance, 'title'))} className={'rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4'}>
                            <div className={'flex flex-wrap items-center gap-2'}>
                              <h4 className={'text-base font-bold text-[#0B1220]'}>{readText(maintenance, 'title', 'Maintenance')}</h4>
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusChipClass(readText(maintenance, 'status', 'scheduled'))}`}>{statusLabel(readText(maintenance, 'status', 'scheduled'))}</span>
                            </div>
                            <p className={'mt-1 text-xs font-medium text-[#7A8799]'}>{formatDateTime(readText(maintenance, 'scheduled_start'), timezone)}</p>
                            {readText(maintenance, 'body') ? <p className={'mt-3 text-sm leading-6 text-[#526071]'}>{readText(maintenance, 'body')}</p> : null}
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </>
  );
}
"