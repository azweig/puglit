"use client";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

type MaintenanceStatus = 'scheduled' | 'in_progress' | 'verifying' | 'completed' | string;

type StatusPageRecord = {
  id: string;
  title: string;
  slug: string;
  logo_text: string;
  timezone: string;
};

type ComponentRecord = {
  id: string;
  name: string;
  description: string;
  current_status: string;
};

type MaintenanceUpdateRecord = {
  id: string;
  status: MaintenanceStatus;
  body: string;
  published_at: string;
};

type MaintenanceRecord = {
  id: string;
  status_page_id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  impact: string;
  scheduled_start: string;
  scheduled_end: string;
  started_at: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
  status_page: StatusPageRecord;
  components: ComponentRecord[];
  updates: MaintenanceUpdateRecord[];
};

type LoadState = 'loading' | 'ready' | 'empty';

const primaryButton = 'min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 ease-out';
const secondaryButton = 'min-h-11 rounded-full bg-[#FFFFFF] border border-[#D8E0EE] px-5 py-2.5 text-sm font-semibold text-[#0B1220] hover:bg-[#F9FBFF] hover:border-[#B8C4D8] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 transition-all duration-200 ease-out';
const navIdle = 'rounded-full px-4 py-2 text-sm font-semibold text-[#526071] hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 outline-none transition-all duration-200 ease-out';
const cardClass = 'rounded-2xl bg-[#FFFFFF] border border-[#D8E0EE] shadow-sm p-4 sm:p-6 text-[#0B1220]';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asKey(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function normalizeArray<T>(value: unknown, mapper: (item: Record<string, unknown>, index: number) => T): T[] {
  const source = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.items)
      ? value.items
      : isRecord(value) && Array.isArray(value.rows)
        ? value.rows
        : isRecord(value) && Array.isArray(value.data)
          ? value.data
          : [];

  return source.filter(isRecord).map(mapper);
}

function firstRecordFrom(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value;
  if (Array.isArray(value) && isRecord(value[0])) return value[0];
  return null;
}

function readStatusPage(value: unknown): StatusPageRecord {
  const row = isRecord(value) ? value : {};
  return {
    id: asKey(row.id, 'statura'),
    title: asString(row.title, 'Statura'),
    slug: asString(row.slug, 'statura'),
    logo_text: asString(row.logo_text, 'ST'),
    timezone: asString(row.timezone, 'UTC'),
  };
}

function readComponent(row: Record<string, unknown>, index: number): ComponentRecord {
  return {
    id: asKey(row.id, `component-${index}`),
    name: asString(row.name, 'Unnamed component'),
    description: asString(row.description, ''),
    current_status: asString(row.current_status, 'operational'),
  };
}

function readUpdate(row: Record<string, unknown>, index: number): MaintenanceUpdateRecord {
  return {
    id: asKey(row.id, `update-${index}`),
    status: asString(row.status, 'scheduled'),
    body: asString(row.body, 'A maintenance update was published.'),
    published_at: asString(row.published_at, asString(row.created_at, '')),
  };
}

function readMaintenance(raw: unknown): MaintenanceRecord | null {
  const root = firstRecordFrom(raw);
  if (!root) return null;

  const dataObject = isRecord(root.data) ? root.data : null;
  const maintenanceObject = isRecord(root.maintenance) ? root.maintenance : null;
  const source = maintenanceObject ?? dataObject ?? root;

  if (!isRecord(source)) return null;

  const statusPageSource = isRecord(source.status_page)
    ? source.status_page
    : isRecord(root.status_page)
      ? root.status_page
      : isRecord(source.page)
        ? source.page
        : isRecord(root.page)
          ? root.page
          : {};

  const componentsSource = source.components ?? source.affected_components ?? root.components ?? root.affected_components ?? [];
  const updatesSource = source.updates ?? source.maintenance_updates ?? root.updates ?? root.maintenance_updates ?? [];

  const title = asString(source.title, 'Scheduled maintenance');
  if (title.trim().length === 0 && asString(source.id, '').trim().length === 0) return null;

  return {
    id: asKey(source.id, 'maintenance'),
    status_page_id: asKey(source.status_page_id, 'status-page'),
    title,
    description: asString(source.description, 'Maintenance details are being prepared by the operations team.'),
    status: asString(source.status, 'scheduled'),
    impact: asString(source.impact, 'maintenance'),
    scheduled_start: asString(source.scheduled_start, ''),
    scheduled_end: asString(source.scheduled_end, ''),
    started_at: asString(source.started_at, ''),
    completed_at: asString(source.completed_at, ''),
    created_at: asString(source.created_at, ''),
    updated_at: asString(source.updated_at, ''),
    status_page: readStatusPage(statusPageSource),
    components: normalizeArray(componentsSource, readComponent),
    updates: normalizeArray(updatesSource, readUpdate),
  };
}

function statusLabel(status: MaintenanceStatus): string {
  const labels: Record<string, string> = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    verifying: 'Verifying',
    completed: 'Completed',
  };
  return labels[String(status)] ?? 'Scheduled';
}

function statusChipClass(status: MaintenanceStatus): string {
  if (status === 'completed') return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
  if (status === 'in_progress' || status === 'verifying') return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
  return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
}

function updateDotClass(status: MaintenanceStatus): string {
  if (status === 'completed') return 'bg-[#10B981] ring-[#D1FAE5]';
  if (status === 'in_progress' || status === 'verifying') return 'bg-[#F59E0B] ring-[#FEF3C7]';
  return 'bg-[#2563EB] ring-[#DBEAFE]';
}

function formatDateTime(value: string, timezone: string): string {
  if (!value) return 'Not available yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available yet';
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone || 'UTC',
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(date);
  }
}

function formatDuration(startValue: string, endValue: string): string {
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 'Window pending';
  const totalMinutes = Math.round((end - start) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function initials(text: string): string {
  const letters = text.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
  return letters || 'ST';
}

function ErrorBanner({ message, onRetry, onDismiss }: { message: string; onRetry: () => void; onDismiss: () => void }) {
  return (
    <div className={'rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-[#0B1220] shadow-sm'} role={'alert'}>
      <div className={'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'}>
        <div className={'flex gap-3'}>
          <div className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EF4444] text-sm font-extrabold text-[#FFFFFF]'}>!</div>
          <div>
            <p className={'text-sm font-bold text-[#991B1B]'}>We could not load this maintenance window</p>
            <p className={'mt-1 text-sm leading-6 text-[#7F1D1D]'}>{message}</p>
          </div>
        </div>
        <div className={'flex gap-2'}>
          <button type={'button'} onClick={onRetry} className={'min-h-11 rounded-full bg-[#FFFFFF] border border-[#FECACA] px-4 py-2 text-sm font-semibold text-[#991B1B] hover:bg-[#FFF7F7] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2 transition-all duration-200'}>
            Retry
          </button>
          <button type={'button'} onClick={onDismiss} aria-label={'Dismiss error'} className={'min-h-11 rounded-full bg-[#FFFFFF] border border-[#FECACA] px-4 py-2 text-sm font-semibold text-[#991B1B] hover:bg-[#FFF7F7] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2 transition-all duration-200'}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function TopBar({ maintenance }: { maintenance: MaintenanceRecord | null }) {
  const page = maintenance?.status_page;
  const title = page?.title ?? 'Statura';
  const logoText = page?.logo_text ?? initials(title);
  return (
    <header className={'sticky top-0 z-50 border-b border-[#D8E0EE] bg-[#F6F8FC]/90 backdrop-blur-xl'}>
      <div className={'mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8'}>
        <Link href={'/'} className={'flex min-h-11 items-center gap-3 rounded-full pr-3 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 outline-none transition-all duration-200'}>
          <span className={'flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-[#FFFFFF] shadow-sm'}>{logoText.slice(0, 3).toUpperCase()}</span>
          <span className={'hidden text-sm font-extrabold tracking-tight text-[#0B1220] sm:block'}>{title}</span>
        </Link>
        <nav className={'hidden items-center gap-1 rounded-full border border-[#D8E0EE] bg-[#F9FBFF] p-1 md:flex'} aria-label={'Primary navigation'}>
          <Link href={'/'} className={navIdle}>Estado</Link>
          <Link href={'/uptime'} className={navIdle}>Uptime histórico</Link>
          <Link href={'/history'} className={navIdle}>Historial de incidentes</Link>
          <Link href={'/api/public/status-pages/[slug]'} className={navIdle}>RSS</Link>
        </nav>
        <div className={'flex items-center gap-2'}>
          <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold sm:inline-flex ${statusChipClass(maintenance?.status ?? 'scheduled')}`}>
            <span className={'h-1.5 w-1.5 rounded-full bg-current'} />
            {statusLabel(maintenance?.status ?? 'scheduled')}
          </span>
          <Link href={'/#subscribe'} className={primaryButton}>Subscribe</Link>
        </div>
      </div>
    </header>
  );
}

function LoadingState() {
  return (
    <div className={'space-y-6'} aria-label={'Loading maintenance details'}>
      <section className={'overflow-hidden rounded-3xl bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] p-5 shadow-xl sm:p-8'}>
        <div className={'animate-pulse space-y-5'}>
          <div className={'h-7 w-32 rounded-full bg-[#FFFFFF]/20'} />
          <div className={'h-10 w-4/5 max-w-2xl rounded-2xl bg-[#FFFFFF]/25'} />
          <div className={'h-5 w-full max-w-3xl rounded-xl bg-[#FFFFFF]/15'} />
          <div className={'grid gap-3 sm:grid-cols-3'}>
            <div className={'h-24 rounded-2xl bg-[#FFFFFF] opacity-90'} />
            <div className={'h-24 rounded-2xl bg-[#FFFFFF] opacity-90'} />
            <div className={'h-24 rounded-2xl bg-[#FFFFFF] opacity-90'} />
          </div>
        </div>
      </section>
      <div className={'grid gap-4 lg:grid-cols-[1fr_320px]'}>
        <div className={'space-y-4'}>
          {[0, 1, 2].map((item) => (
            <div key={item} className={`${cardClass} animate-pulse`}>
              <div className={'h-4 w-28 rounded bg-black/5'} />
              <div className={'mt-4 h-5 w-3/4 rounded bg-black/5'} />
              <div className={'mt-3 h-4 w-full rounded bg-black/5'} />
            </div>
          ))}
        </div>
        <div className={`${cardClass} animate-pulse`}>
          <div className={'h-5 w-36 rounded bg-black/5'} />
          <div className={'mt-4 space-y-3'}>
            <div className={'h-11 rounded-xl bg-black/5'} />
            <div className={'h-11 rounded-xl bg-black/5'} />
            <div className={'h-11 rounded-xl bg-black/5'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className={'mx-auto max-w-2xl rounded-3xl border border-[#D8E0EE] bg-[#FFFFFF] p-6 text-center text-[#0B1220] shadow-sm sm:p-10'}>
      <div className={'mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF] text-3xl text-[#1D4ED8]'} aria-hidden={true}>🛠️</div>
      <h1 className={'mt-5 text-2xl font-extrabold tracking-tight text-[#0B1220] sm:text-3xl'}>Maintenance window not found</h1>
      <p className={'mx-auto mt-3 max-w-lg text-sm leading-6 text-[#526071] sm:text-base'}>This public maintenance link may have expired, or the scheduled window is no longer visible on this status page.</p>
      <div className={'mt-6 flex flex-col justify-center gap-3 sm:flex-row'}>
        <Link href={'/history'} className={primaryButton}>Back to history</Link>
        <Link href={'/'} className={secondaryButton}>View system status</Link>
      </div>
    </section>
  );
}

function Hero({ maintenance }: { maintenance: MaintenanceRecord }) {
  const timezone = maintenance.status_page.timezone;
  return (
    <section className={'overflow-hidden rounded-3xl bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] p-5 text-[#FFFFFF] shadow-xl sm:p-8'}>
      <div className={'flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'}>
        <div className={'max-w-3xl'}>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusChipClass(maintenance.status)} bg-[#FFFFFF]`}>
            <span className={'h-1.5 w-1.5 rounded-full bg-current'} />
            {statusLabel(maintenance.status)} maintenance
          </span>
          <h1 className={'mt-5 text-3xl font-extrabold tracking-tight text-[#FFFFFF] sm:text-4xl'}>{maintenance.title}</h1>
          <p className={'mt-4 max-w-2xl text-sm leading-6 text-[#DBEAFE] sm:text-base'}>{maintenance.description}</p>
        </div>
        <div className={'flex flex-col gap-3 sm:flex-row lg:flex-col'}>
          <Link href={'/'} className={'min-h-11 rounded-full bg-[#FFFFFF] px-5 py-2.5 text-center text-sm font-semibold text-[#0B1220] shadow-sm hover:bg-[#F9FBFF] hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D4ED8] transition-all duration-200'}>
            Return to status
          </Link>
          <Link href={'/history'} className={'min-h-11 rounded-full border border-[#FFFFFF]/25 bg-[#FFFFFF]/10 px-5 py-2.5 text-center text-sm font-semibold text-[#FFFFFF] hover:bg-[#FFFFFF]/15 hover:shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D4ED8] transition-all duration-200'}>
            Incident history
          </Link>
        </div>
      </div>
      <div className={'mt-6 grid gap-3 sm:grid-cols-3'}>
        <div className={'rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm'}>
          <p className={'text-xs font-medium text-[#7A8799]'}>Scheduled start</p>
          <p className={'mt-2 text-sm font-bold leading-6 text-[#0B1220]'}>{formatDateTime(maintenance.scheduled_start, timezone)}</p>
        </div>
        <div className={'rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm'}>
          <p className={'text-xs font-medium text-[#7A8799]'}>Scheduled end</p>
          <p className={'mt-2 text-sm font-bold leading-6 text-[#0B1220]'}>{formatDateTime(maintenance.scheduled_end, timezone)}</p>
        </div>
        <div className={'rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm'}>
          <p className={'text-xs font-medium text-[#7A8799]'}>Expected duration</p>
          <p className={'mt-2 text-sm font-bold leading-6 text-[#0B1220]'}>{formatDuration(maintenance.scheduled_start, maintenance.scheduled_end)}</p>
        </div>
      </div>
    </section>
  );
}

function Timeline({ updates, timezone }: { updates: MaintenanceUpdateRecord[]; timezone: string }) {
  if (updates.length === 0) {
    return (
      <section className={cardClass}>
        <div className={'flex items-start gap-4'}>
          <div className={'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-xl text-[#1D4ED8]'} aria-hidden={true}>↻</div>
          <div>
            <h2 className={'text-lg font-bold text-[#0B1220] sm:text-xl'}>No timeline updates yet</h2>
            <p className={'mt-2 text-sm leading-6 text-[#526071]'}>The operations team will publish progress here as the maintenance window approaches or begins.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cardClass}>
      <div className={'mb-6 flex items-center justify-between gap-3'}>
        <div>
          <p className={'text-xs font-bold uppercase tracking-wide text-[#1D4ED8]'}>Chronological updates</p>
          <h2 className={'mt-1 text-lg font-bold text-[#0B1220] sm:text-xl'}>Maintenance timeline</h2>
        </div>
        <span className={'rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#1D4ED8]'}>{updates.length} updates</span>
      </div>
      <ol className={'relative space-y-5 border-l border-[#D8E0EE] pl-5'}>
        {updates.map((update) => (
          <li key={update.id} className={'relative'}>
            <span className={`absolute -left-[29px] top-1 h-4 w-4 rounded-full ring-4 ${updateDotClass(update.status)}`} aria-hidden={true} />
            <article className={'rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4 text-[#0B1220] shadow-sm'}>
              <div className={'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'}>
                <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusChipClass(update.status)}`}>
                  {statusLabel(update.status)}
                </span>
                <time className={'text-xs font-medium text-[#7A8799]'} dateTime={update.published_at}>{formatDateTime(update.published_at, timezone)}</time>
              </div>
              <p className={'mt-3 text-sm leading-6 text-[#526071]'}>{update.body}</p>
              <p className={'mt-3 text-xs font-medium text-[#7A8799]'}>Published by Statura operations</p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SidePanel({ maintenance }: { maintenance: MaintenanceRecord }) {
  const components = maintenance.components;
  return (
    <aside className={'space-y-4'}>
      <section className={cardClass}>
        <p className={'text-xs font-bold uppercase tracking-wide text-[#1D4ED8]'}>Impact</p>
        <h2 className={'mt-1 text-lg font-bold text-[#0B1220]'}>Affected services</h2>
        <div className={'mt-4 space-y-3'}>
          {components.length > 0 ? components.map((component) => (
            <div key={component.id} className={'rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-3 text-[#0B1220]'}>
              <div className={'flex items-start justify-between gap-3'}>
                <div>
                  <p className={'text-sm font-semibold text-[#0B1220]'}>{component.name}</p>
                  {component.description ? <p className={'mt-1 text-xs leading-5 text-[#526071]'}>{component.description}</p> : null}
                </div>
                <span className={'mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#2563EB]'} aria-label={'Affected'} />
              </div>
            </div>
          )) : (
            <div className={'rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4 text-sm leading-6 text-[#526071]'}>
              No specific components have been attached to this maintenance window yet.
            </div>
          )}
        </div>
      </section>
      <section className={cardClass}>
        <p className={'text-xs font-bold uppercase tracking-wide text-[#1D4ED8]'}>Return links</p>
        <div className={'mt-4 grid gap-3'}>
          <Link href={'/'} className={secondaryButton}>System overview</Link>
          <Link href={'/uptime'} className={secondaryButton}>Historical uptime</Link>
          <Link href={'/history'} className={secondaryButton}>Incident history</Link>
          <Link href={'/#subscribe'} className={primaryButton}>Subscribe to updates</Link>
        </div>
      </section>
    </aside>
  );
}

export default function MaintenanceDetailPage() {
  const { maintenanceId } = useParams<{ maintenanceId: string }>();
  const [maintenance, setMaintenance] = useState<MaintenanceRecord | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);

  const loadMaintenance = useCallback(async () => {
    const controller = new AbortController();
    setState('loading');
    setError(null);

    try {
      const response = await fetch(`/api/public/maintenances/[maintenanceId]${encodeURIComponent(maintenanceId)}`, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`The maintenance API responded with ${response.status}.`);
      }

      const payload: unknown = await response.json();
      const parsed = readMaintenance(payload);
      setMaintenance(parsed);
      setState(parsed ? 'ready' : 'empty');
    } catch (caught: any) {
      const message = caught instanceof Error ? caught.message : 'Unexpected network error.';
      setError(message);
      setState(maintenance ? 'ready' : 'empty');
    }

    return () => controller.abort();
  }, [maintenanceId, maintenance]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function run() {
      setState('loading');
      setError(null);
      try {
        const response = await fetch(`/api/public/maintenances/[maintenanceId]${encodeURIComponent(maintenanceId)}`, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`The maintenance API responded with ${response.status}.`);
        const payload: unknown = await response.json();
        const parsed = readMaintenance(payload);
        if (!active) return;
        setMaintenance(parsed);
        setState(parsed ? 'ready' : 'empty');
      } catch (caught: any) {
        if (!active || controller.signal.aborted) return;
        const message = caught instanceof Error ? caught.message : 'Unexpected network error.';
        setError(message);
        setState('empty');
      }
    }

    run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [maintenanceId]);

  const sortedUpdates = useMemo(() => {
    const list = maintenance?.updates ?? [];
    return [...list].sort((a, b) => {
      const left = new Date(a.published_at).getTime();
      const right = new Date(b.published_at).getTime();
      return (Number.isNaN(left) ? 0 : left) - (Number.isNaN(right) ? 0 : right);
    });
  }, [maintenance]);

  return (
    <div className={'min-h-screen bg-[#F6F8FC] text-[#0B1220]'}>
      <TopBar maintenance={maintenance} />
      <main className={'mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8'}>
        <div className={'mb-5 flex overflow-x-auto pb-1 md:hidden'}>
          <nav className={'flex min-w-max gap-1 rounded-full border border-[#D8E0EE] bg-[#F9FBFF] p-1'} aria-label={'Mobile navigation'}>
            <Link href={'/'} className={navIdle}>Estado</Link>
            <Link href={'/uptime'} className={navIdle}>Uptime histórico</Link>
            <Link href={'/history'} className={navIdle}>Historial</Link>
            <Link href={'/api/public/status-pages/[slug]'} className={navIdle}>RSS</Link>
          </nav>
        </div>

        {error ? (
          <div className={'mb-5'}>
            <ErrorBanner message={error} onRetry={() => { void loadMaintenance(); }} onDismiss={() => setError(null)} />
          </div>
        ) : null}

        {state === 'loading' ? <LoadingState /> : null}

        {state === 'empty' && !maintenance ? <EmptyState /> : null}

        {state === 'ready' && maintenance ? (
          <div className={'space-y-6'}>
            <Hero maintenance={maintenance} />
            <div className={'grid gap-4 lg:grid-cols-[1fr_320px]'}>
              <div className={'space-y-4'}>
                <section className={cardClass}>
                  <div className={'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'}>
                    <div>
                      <p className={'text-xs font-bold uppercase tracking-wide text-[#1D4ED8]'}>Scheduled window</p>
                      <h2 className={'mt-1 text-lg font-bold text-[#0B1220] sm:text-xl'}>What to expect</h2>
                      <p className={'mt-3 text-sm leading-6 text-[#526071]'}>{maintenance.description}</p>
                    </div>
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusChipClass(maintenance.status)}`}>
                      <span className={'h-1.5 w-1.5 rounded-full bg-current'} />
                      {statusLabel(maintenance.status)}
                    </span>
                  </div>
                  <div className={'mt-5 grid gap-3 sm:grid-cols-2'}>
                    <div className={'rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4'}>
                      <p className={'text-xs font-medium text-[#7A8799]'}>Started at</p>
                      <p className={'mt-2 text-sm font-semibold text-[#0B1220]'}>{formatDateTime(maintenance.started_at || maintenance.scheduled_start, maintenance.status_page.timezone)}</p>
                    </div>
                    <div className={'rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4'}>
                      <p className={'text-xs font-medium text-[#7A8799]'}>Completed at</p>
                      <p className={'mt-2 text-sm font-semibold text-[#0B1220]'}>{formatDateTime(maintenance.completed_at || maintenance.scheduled_end, maintenance.status_page.timezone)}</p>
                    </div>
                  </div>
                </section>
                <Timeline updates={sortedUpdates} timezone={maintenance.status_page.timezone} />
              </div>
              <SidePanel maintenance={maintenance} />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
