import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';

type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
type Impact = 'none' | 'minor' | 'major' | 'critical';
type ComponentStatus = 'operational' | 'degraded' | 'outage' | 'maintenance' | 'paused';

type StatusTone = {
  label: string;
  chip: string;
  dot: string;
  rail: string;
};

type PublicPage = {
  name: string;
  slug: string;
  logo_url: string;
  timezone: string;
};

type AffectedComponent = {
  id: string;
  name: string;
  description: string;
  affected_status: ComponentStatus;
};

type IncidentUpdate = {
  id: string;
  status: IncidentStatus;
  message: string;
  author_label: string;
  published_at: string;
};

type IncidentDetail = {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  impact: Impact;
  started_at: string;
  resolved_at: string;
  page: PublicPage;
  components: AffectedComponent[];
  updates: IncidentUpdate[];
};

type PageProps = {
  params: Promise<{ slug: string; incidentId: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRecord(record: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = record[key];
  return isRecord(value) ? value : null;
}

function readString(record: Record<string, unknown> | null, key: string, fallback = ''): string {
  if (!record) return fallback;
  const value = record[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function readId(record: Record<string, unknown> | null, key: string, fallback: string): string {
  const value = record?.[key];
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return fallback;
}

function normalizeList(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (isRecord(value)) {
    const nested = value.items ?? value.rows ?? value.data;
    if (Array.isArray(nested)) return nested.filter(isRecord);
  }
  return [];
}

function firstDefined(values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null);
}

function normalizeStatus(value: string): IncidentStatus {
  if (value === 'identified' || value === 'monitoring' || value === 'resolved') return value;
  return 'investigating';
}

function normalizeImpact(value: string): Impact {
  if (value === 'minor' || value === 'major' || value === 'critical') return value;
  return 'none';
}

function normalizeComponentStatus(value: string): ComponentStatus {
  if (value === 'degraded' || value === 'outage' || value === 'maintenance' || value === 'paused') return value;
  return 'operational';
}

function normalizeComponent(record: Record<string, unknown>, index: number): AffectedComponent {
  const nested = readRecord(record, 'component');
  const affected = readString(record, 'affected_status') || readString(record, 'expected_status') || readString(record, 'current_status') || readString(nested, 'current_status');
  return {
    id: readId(record, 'component_id', readId(nested, 'id', String(index))),
    name: readString(record, 'name') || readString(nested, 'name') || 'Componente afectado',
    description: readString(record, 'description') || readString(nested, 'description'),
    affected_status: normalizeComponentStatus(affected),
  };
}

function normalizeUpdate(record: Record<string, unknown>, index: number): IncidentUpdate {
  return {
    id: readId(record, 'id', String(index)),
    status: normalizeStatus(readString(record, 'status')),
    message: readString(record, 'message', 'Actualización publicada por el equipo de estado.'),
    author_label: readString(record, 'author_label', 'StatusPe'),
    published_at: readString(record, 'published_at') || readString(record, 'created_at'),
  };
}

function normalizeIncidentResponse(payload: unknown): IncidentDetail | null {
  if (!isRecord(payload)) return null;
  const root = isRecord(payload.data) ? payload.data : payload;
  if (!isRecord(root)) return null;

  const incident = readRecord(root, 'incident') ?? readRecord(root, 'item') ?? readRecord(root, 'row') ?? (readString(root, 'title') || readString(root, 'id') ? root : null);
  if (!incident) return null;

  const pageRecord = readRecord(incident, 'status_page') ?? readRecord(root, 'status_page') ?? readRecord(root, 'page');
  const updatesRaw = firstDefined([incident.updates, incident.incident_updates, incident.timeline, root.updates, root.incident_updates, root.timeline]);
  const componentsRaw = firstDefined([incident.affected_components, incident.components, incident.incident_components, root.affected_components, root.components, root.incident_components]);

  const updates = normalizeList(updatesRaw)
    .map(normalizeUpdate)
    .sort((a, b) => parseTime(a.published_at) - parseTime(b.published_at));

  return {
    id: readId(incident, 'id', ''),
    title: readString(incident, 'title', 'Incidente sin título'),
    description: readString(incident, 'description'),
    status: normalizeStatus(readString(incident, 'status')),
    impact: normalizeImpact(readString(incident, 'impact')),
    started_at: readString(incident, 'started_at'),
    resolved_at: readString(incident, 'resolved_at'),
    page: {
      name: readString(pageRecord, 'name', 'StatusPe'),
      slug: readString(pageRecord, 'slug', 'statuspe'),
      logo_url: readString(pageRecord, 'logo_url'),
      timezone: readString(pageRecord, 'timezone', 'America/Lima'),
    },
    components: normalizeList(componentsRaw).map(normalizeComponent),
    updates,
  };
}

function parseTime(value: string): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatDateTime(value: string, timezone = 'America/Lima'): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(date);
}

function formatDuration(startedAt: string, resolvedAt: string): string {
  const start = parseTime(startedAt);
  if (start === 0) return '—';
  const end = resolvedAt ? parseTime(resolvedAt) : Date.now();
  const diff = Math.max(0, end - start);
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} d`);
  if (hours > 0) parts.push(`${hours} h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins} min`);
  return resolvedAt ? parts.join(' ') : `En curso · ${parts.join(' ')}`;
}

function incidentTone(status: IncidentStatus): StatusTone {
  const tones: Record<IncidentStatus, StatusTone> = {
    investigating: { label: 'Investigating', chip: 'bg-[#FEE2E2] text-[#991B1B]', dot: 'bg-[#DC2626]', rail: 'border-[#FCA5A5]' },
    identified: { label: 'Identified', chip: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#F59E0B]', rail: 'border-[#FCD34D]' },
    monitoring: { label: 'Monitoring', chip: 'bg-[#DBEAFE] text-[#1E40AF]', dot: 'bg-[#2563EB]', rail: 'border-[#93C5FD]' },
    resolved: { label: 'Resolved', chip: 'bg-[#DCFCE7] text-[#166534]', dot: 'bg-[#16A34A]', rail: 'border-[#86EFAC]' },
  };
  return tones[status];
}

function impactTone(impact: Impact): StatusTone {
  const tones: Record<Impact, StatusTone> = {
    none: { label: 'None', chip: 'bg-[#F1F5F9] text-[#334155]', dot: 'bg-[#64748B]', rail: 'border-[#CBD5E1]' },
    minor: { label: 'Minor', chip: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#F59E0B]', rail: 'border-[#FCD34D]' },
    major: { label: 'Major', chip: 'bg-[#FEE2E2] text-[#991B1B]', dot: 'bg-[#DC2626]', rail: 'border-[#FCA5A5]' },
    critical: { label: 'Critical', chip: 'bg-[#DC2626] text-white', dot: 'bg-[#DC2626]', rail: 'border-[#DC2626]' },
  };
  return tones[impact];
}

function componentTone(status: ComponentStatus): StatusTone {
  const tones: Record<ComponentStatus, StatusTone> = {
    operational: { label: 'Operativo', chip: 'bg-[#DCFCE7] text-[#166534]', dot: 'bg-[#16A34A]', rail: 'border-[#86EFAC]' },
    degraded: { label: 'Degradado', chip: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#F59E0B]', rail: 'border-[#FCD34D]' },
    outage: { label: 'Interrupción', chip: 'bg-[#FEE2E2] text-[#991B1B]', dot: 'bg-[#DC2626]', rail: 'border-[#FCA5A5]' },
    maintenance: { label: 'Mantenimiento', chip: 'bg-[#DBEAFE] text-[#1E40AF]', dot: 'bg-[#2563EB]', rail: 'border-[#93C5FD]' },
    paused: { label: 'Pausado', chip: 'bg-[#F1F5F9] text-[#334155]', dot: 'bg-[#64748B]', rail: 'border-[#CBD5E1]' },
  };
  return tones[status];
}

async function getRequestBaseUrl(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https';

  if (host) return `${protocol}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

async function fetchIncident(slug: string, incidentId: string): Promise<IncidentDetail | null> {
  if (!slug || !incidentId) return null;

  const baseUrl = await getRequestBaseUrl();
  const url = new URL(`/api/v1/status-pages/${encodeURIComponent(slug)}/incidents/${encodeURIComponent(incidentId)}`, baseUrl);
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    next: { revalidate: 60 },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`El servidor respondió con ${response.status}.`);

  const json: unknown = await response.json();
  return normalizeIncidentResponse(json);
}

function buildMetadataDescription(incident: IncidentDetail): string {
  const status = incidentTone(incident.status).label;
  const impact = impactTone(incident.impact).label;
  const startedAt = formatDateTime(incident.started_at, incident.page.timezone);
  return `Estado ${status}, impacto ${impact}. Inicio: ${startedAt}. ${incident.description || 'Consulta el timeline público del incidente y sus actualizaciones operativas.'}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, incidentId } = await params;
  const safeSlug = slug || 'statuspe';
  const safeIncidentId = incidentId || '';
  const canonicalPath = `/s/${safeSlug}/incidents/${safeIncidentId}`;
  const baseUrl = await getRequestBaseUrl();
  const canonicalUrl = new URL(canonicalPath, baseUrl).toString();

  try {
    const incident = await fetchIncident(safeSlug, safeIncidentId);
    const title = incident ? `${incident.title} — ${incident.page.name} Status` : 'Incidente no encontrado — StatusPe Status';
    const description = incident ? buildMetadataDescription(incident) : 'El incidente solicitado no está disponible en la página de estado pública.';

    return {
      metadataBase: new URL(baseUrl),
      title,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: 'article',
        siteName: incident?.page.name ?? 'StatusPe',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    };
  } catch {
    return {
      metadataBase: new URL(baseUrl),
      title: 'Incidente — StatusPe Status',
      description: 'Consulta el detalle público del incidente y sus actualizaciones operativas.',
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: 'Incidente — StatusPe Status',
        description: 'Consulta el detalle público del incidente y sus actualizaciones operativas.',
        url: canonicalUrl,
        type: 'article',
        siteName: 'StatusPe',
      },
      twitter: {
        card: 'summary',
        title: 'Incidente — StatusPe Status',
        description: 'Consulta el detalle público del incidente y sus actualizaciones operativas.',
      },
    };
  }
}

function ErrorBanner({ message, retryHref }: { message: string; retryHref: string }) {
  return (
    <section className='rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-5 shadow-lg shadow-red-950/5 sm:p-6' role='alert' aria-labelledby='incident-error-title'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex gap-3'>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-sm font-extrabold text-[#991B1B]'>!</div>
          <div>
            <h1 id='incident-error-title' className='text-lg font-bold text-[#991B1B]'>No pudimos cargar este incidente</h1>
            <p className='mt-1 text-sm leading-6 text-[#7F1D1D]'>{message}</p>
            <p className='mt-2 text-sm leading-6 text-[#7F1D1D]'>Puede tratarse de una falla temporal de la API. Intenta nuevamente para recuperar el detalle público.</p>
          </div>
        </div>
        <Link href={retryHref} className='inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#DC2626] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#B91C1C] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2'>Reintentar</Link>
      </div>
    </section>
  );
}

function EmptyState({ slug }: { slug: string }) {
  return (
    <section className='rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-lg shadow-blue-950/5 sm:p-12' aria-labelledby='incident-not-found-title'>
      <div className='mx-auto inline-flex rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#2563EB]'>404</div>
      <div className='mx-auto mt-5 flex size-16 items-center justify-center rounded-full bg-[#EFF6FF] text-3xl' aria-hidden='true'>🧭</div>
      <h1 id='incident-not-found-title' className='mt-5 text-2xl font-bold tracking-tight text-[#0F172A]'>Incidente no encontrado</h1>
      <p className='mx-auto mt-3 max-w-xl text-sm leading-6 text-[#334155]'>El enlace puede haber expirado o el incidente ya no está publicado. Puedes volver al estado público para ver la información vigente.</p>
      <div className='mt-7 flex flex-col justify-center gap-3 sm:flex-row'>
        <Link href={`/s/${slug}`} className='inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Volver al estado</Link>
        <Link href={`/s/${slug}/history`} className='inline-flex min-h-11 items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-all duration-200 hover:bg-[#F8FAFC] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Ver historial</Link>
      </div>
    </section>
  );
}

function PageShell({ slug, pageName, currentHref, children }: { slug: string; pageName: string; currentHref: string; children: React.ReactNode }) {
  return (
    <div className='min-h-screen bg-[#F6F8FC] text-[#0F172A]'>
      <header className='sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur'>
        <nav className='mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8' aria-label='Navegación principal'>
          <Link href={`/s/${slug}`} className='flex min-h-11 items-center gap-3 rounded-full pr-3 transition-all duration-200 hover:bg-[#F8FAFC] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>
            <span className='flex size-9 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-extrabold text-[#1D4ED8]'>SP</span>
            <span className='hidden text-sm font-bold tracking-tight text-[#0F172A] sm:inline'>{pageName}</span>
          </Link>
          <div className='flex items-center gap-1 overflow-x-auto'>
            <Link href={`/s/${slug}`} className='min-h-11 rounded-full px-3 py-2 text-sm font-semibold text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Estado</Link>
            <Link href={`/s/${slug}/history`} className='min-h-11 rounded-full bg-[#EFF6FF] px-3 py-2 text-sm font-semibold text-[#2563EB] transition-all duration-200 hover:bg-[#DBEAFE] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Historial</Link>
            <Link href={`/s/${slug}/subscribe`} className='hidden min-h-11 rounded-full px-3 py-2 text-sm font-semibold text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:inline-flex sm:items-center'>Suscribirse</Link>
            <a href={`/api/v1/status-pages/${encodeURIComponent(slug)}`} className='min-h-11 rounded-full px-3 py-2 text-sm font-semibold text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>RSS</a>
          </div>
        </nav>
      </header>

      <main className='mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8'>
        <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2 text-sm font-medium text-[#64748B]'>
            <Link href={`/s/${slug}`} className='rounded-full px-2 py-1 text-[#2563EB] transition-all duration-200 hover:bg-[#EFF6FF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Página de estado</Link>
            <span aria-hidden='true'>/</span>
            <Link href={`/s/${slug}/history`} className='rounded-full px-2 py-1 text-[#2563EB] transition-all duration-200 hover:bg-[#EFF6FF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Historial</Link>
            <span aria-hidden='true'>/</span>
            <span className='text-[#64748B]'>Detalle del incidente</span>
          </div>
          <Link href={currentHref} className='inline-flex min-h-11 items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-all duration-200 hover:bg-[#F8FAFC] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Actualizar</Link>
        </div>

        {children}
      </main>
    </div>
  );
}

export default async function IncidentDetailPage({ params }: PageProps) {
  const { slug, incidentId } = await params;
  const safeSlug = slug || 'statuspe';
  const safeIncidentId = incidentId || '';
  const currentHref = `/s/${safeSlug}/incidents/${safeIncidentId}`;

  let detail: IncidentDetail | null = null;
  let error: string | null = null;

  try {
    detail = await fetchIncident(safeSlug, safeIncidentId);
  } catch (caught: unknown) {
    error = caught instanceof Error ? caught.message : 'Ocurrió un error inesperado.';
  }

  if (error) {
    return (
      <PageShell slug={safeSlug} pageName='StatusPe' currentHref={currentHref}>
        <ErrorBanner message={error} retryHref={currentHref} />
      </PageShell>
    );
  }

  if (!detail) {
    return (
      <PageShell slug={safeSlug} pageName='StatusPe' currentHref={currentHref}>
        <EmptyState slug={safeSlug} />
      </PageShell>
    );
  }

  const status = incidentTone(detail.status);
  const impact = impactTone(detail.impact);
  const pageName = detail.page.name;
  const timezone = detail.page.timezone;
  const duration = formatDuration(detail.started_at, detail.resolved_at);

  return (
    <PageShell slug={safeSlug} pageName={pageName} currentHref={currentHref}>
      <div className='space-y-6'>
        <section className='rounded-2xl border border-[#E2E8F0] bg-gradient-to-br from-[#EFF6FF] to-[#FFFFFF] p-4 shadow-lg shadow-blue-950/5 sm:p-6'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${status.chip}`}><span className={`size-2 rounded-full ${status.dot}`} />{status.label}</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${impact.chip}`}><span className={`size-2 rounded-full ${impact.dot}`} />Impacto {impact.label}</span>
          </div>
          <div className='mt-5 max-w-3xl'>
            <p className='text-xs font-medium uppercase tracking-[0.18em] text-[#64748B]'>Detalle del incidente</p>
            <h1 className='mt-2 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl'>{detail.title}</h1>
            <p className='mt-4 text-sm leading-6 text-[#334155] sm:text-base'>{detail.description || 'El equipo de estado publicó este incidente para mantener visibilidad sobre el servicio afectado y sus actualizaciones operativas.'}</p>
          </div>
          <div className='mt-6 grid gap-3 sm:grid-cols-3'>
            <div className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm'>
              <p className='text-xs font-medium text-[#64748B]'>Inicio</p>
              <p className='mt-1 text-sm font-bold text-[#0F172A]'>{formatDateTime(detail.started_at, timezone)}</p>
            </div>
            <div className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm'>
              <p className='text-xs font-medium text-[#64748B]'>Resolución</p>
              <p className='mt-1 text-sm font-bold text-[#0F172A]'>{formatDateTime(detail.resolved_at, timezone)}</p>
            </div>
            <div className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm'>
              <p className='text-xs font-medium text-[#64748B]'>Duración total</p>
              <p className='mt-1 text-sm font-bold text-[#0F172A]'>{duration}</p>
            </div>
          </div>
        </section>

        <div className='grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start'>
          <section className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <h2 className='text-lg font-semibold text-[#0F172A]'>Timeline de actualizaciones</h2>
                <p className='mt-1 text-sm text-[#64748B]'>Orden cronológico con estado, autor y mensaje público.</p>
              </div>
              <span className='rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#475569]'>{detail.updates.length} updates</span>
            </div>

            {detail.updates.length === 0 ? (
              <div className='mt-6 rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center'>
                <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm' aria-hidden='true'>🛰️</div>
                <h3 className='mt-3 text-sm font-bold text-[#0F172A]'>Aún no hay actualizaciones publicadas</h3>
                <p className='mt-1 text-sm leading-6 text-[#64748B]'>Cuando el equipo agregue novedades, aparecerán aquí en orden cronológico.</p>
              </div>
            ) : (
              <ol className='mt-6 space-y-6'>
                {detail.updates.map((update, index) => {
                  const tone = incidentTone(update.status);
                  const isLast = index === detail.updates.length - 1;
                  return (
                    <li key={`${update.id}-${index}`} className='relative flex gap-4'>
                      <div className='flex flex-col items-center'>
                        <span className={`relative z-10 flex size-10 items-center justify-center rounded-full border-4 border-white shadow-sm ${tone.dot}`} aria-hidden='true'><span className='size-2 rounded-full bg-white' /></span>
                        {!isLast ? <span className={`mt-2 min-h-16 flex-1 border-l-2 ${tone.rail}`} aria-hidden='true' /> : null}
                      </div>
                      <article className='min-w-0 flex-1 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg'>
                        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                          <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone.chip}`}><span className={`size-2 rounded-full ${tone.dot}`} />{tone.label}</span>
                          <time dateTime={update.published_at} className='text-xs font-medium text-[#64748B]'>{formatDateTime(update.published_at, timezone)}</time>
                        </div>
                        <p className='mt-3 text-sm leading-6 text-[#334155]'>{update.message}</p>
                        <div className='mt-4 flex items-center gap-2 border-t border-[#E2E8F0] pt-3'>
                          <span className='flex size-8 items-center justify-center rounded-full bg-[#DBEAFE] text-xs font-extrabold text-[#1D4ED8]'>{update.author_label.slice(0, 1).toUpperCase()}</span>
                          <span className='text-xs font-semibold text-[#475569]'>{update.author_label}</span>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <aside className='space-y-4 lg:sticky lg:top-24'>
            <section className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5'>
              <h2 className='text-lg font-semibold text-[#0F172A]'>Metadata</h2>
              <dl className='mt-4 space-y-3'>
                <div className='flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] p-3'>
                  <dt className='text-xs font-medium text-[#64748B]'>Estado actual</dt>
                  <dd className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${status.chip}`}><span className={`size-2 rounded-full ${status.dot}`} />{status.label}</dd>
                </div>
                <div className='flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] p-3'>
                  <dt className='text-xs font-medium text-[#64748B]'>Impacto</dt>
                  <dd className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${impact.chip}`}>{impact.label}</dd>
                </div>
                <div className='rounded-xl bg-[#F8FAFC] p-3'>
                  <dt className='text-xs font-medium text-[#64748B]'>Zona horaria</dt>
                  <dd className='mt-1 text-sm font-semibold text-[#0F172A]'>{timezone}</dd>
                </div>
              </dl>
            </section>

            <section className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5'>
              <div className='flex items-center justify-between gap-3'>
                <h2 className='text-lg font-semibold text-[#0F172A]'>Componentes afectados</h2>
                <span className='rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#1D4ED8]'>{detail.components.length}</span>
              </div>
              {detail.components.length === 0 ? (
                <p className='mt-4 rounded-xl bg-[#F8FAFC] p-4 text-sm leading-6 text-[#64748B]'>No se publicaron componentes específicos para este incidente.</p>
              ) : (
                <ul className='mt-4 space-y-3'>
                  {detail.components.map((component, index) => {
                    const tone = componentTone(component.affected_status);
                    return (
                      <li key={`${component.id}-${index}`} className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-bold text-[#0F172A]'>{component.name}</p>
                            {component.description ? <p className='mt-1 line-clamp-2 text-xs leading-5 text-[#64748B]'>{component.description}</p> : null}
                          </div>
                          <span className={`mt-0.5 size-3 shrink-0 rounded-full ${tone.dot}`} aria-label={tone.label} />
                        </div>
                        <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tone.chip}`}><span className={`size-2 rounded-full ${tone.dot}`} />{tone.label}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className='rounded-2xl border border-[#E2E8F0] bg-[#0F172A] p-4 shadow-lg shadow-blue-950/10 sm:p-5'>
              