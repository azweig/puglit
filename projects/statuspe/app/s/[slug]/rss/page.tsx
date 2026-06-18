"use client";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type LoadState = 'loading' | 'ready' | 'error';

type RssEntry = {
  title: string;
  link: string;
  summary: string;
  published_at: string;
  kind: 'incident' | 'maintenance' | 'update';
};

type Tone = 'success' | 'warning' | 'error' | 'info';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function textOf(element: Element, selectors: string): string {
  const found = element.querySelector(selectors);
  return found?.textContent?.trim() ?? '';
}

function inferKind(title: string, summary: string): RssEntry['kind'] {
  const haystack = `${title} ${summary}`.toLowerCase();
  if (haystack.includes('maintenance') || haystack.includes('mantenimiento')) return 'maintenance';
  if (haystack.includes('incident') || haystack.includes('incidente')) return 'incident';
  return 'update';
}

function normalizeJsonEntries(data: unknown): RssEntry[] {
  const list: unknown[] = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data['items'])
      ? data['items']
      : isRecord(data) && Array.isArray(data['rows'])
        ? data['rows']
        : isRecord(data) && Array.isArray(data['entries'])
          ? data['entries']
          : [];

  return list
    .filter(isRecord)
    .map((entry) => {
      const title = asString(entry['title']) || 'Actualización de estado';
      const summary = asString(entry['summary']) || asString(entry['description']) || '';
      return {
        title,
        link: asString(entry['link']) || asString(entry['url']) || '',
        summary,
        published_at: asString(entry['published_at']) || asString(entry['published']) || asString(entry['updated_at']) || '',
        kind: inferKind(title, summary),
      };
    });
}

function parseFeedText(raw: string): RssEntry[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return normalizeJsonEntries(JSON.parse(trimmed) as unknown);
    } catch {
      return [];
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, 'application/xml');
  if (doc.querySelector('parsererror')) return [];

  const nodes = Array.from(doc.querySelectorAll('item, entry'));
  return nodes.map((node) => {
    const title = textOf(node, 'title') || 'Actualización de estado';
    const summary = textOf(node, 'description, summary, content') || '';
    const atomLink = node.querySelector('link[href]')?.getAttribute('href') ?? '';
    const rssLink = textOf(node, 'link');
    return {
      title,
      link: atomLink || rssLink,
      summary,
      published_at: textOf(node, 'pubDate, published, updated'),
      kind: inferKind(title, summary),
    };
  });
}

function formatDate(value: string): string {
  if (!value) return 'Fecha pendiente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function chipClasses(tone: Tone): string {
  if (tone === 'success') return 'bg-[#DCFCE7] text-[#166534]';
  if (tone === 'warning') return 'bg-[#FEF3C7] text-[#92400E]';
  if (tone === 'error') return 'bg-[#FEE2E2] text-[#991B1B]';
  return 'bg-[#DBEAFE] text-[#1D4ED8]';
}

function entryTone(kind: RssEntry['kind']): Tone {
  if (kind === 'incident') return 'error';
  if (kind === 'maintenance') return 'warning';
  return 'info';
}

function entryLabel(kind: RssEntry['kind']): string {
  if (kind === 'incident') return 'Incidente';
  if (kind === 'maintenance') return 'Mantenimiento';
  return 'Update';
}

function Header({ slug }: { slug: string }) {
  return (
    <header className='sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur'>
      <div className='mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8'>
        <Link href='/' className='group inline-flex min-h-11 items-center gap-3 rounded-full pr-3 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>
          <span className='flex size-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-extrabold text-white shadow-sm shadow-blue-950/10 transition-transform duration-200 group-hover:scale-[1.03]'>SP</span>
          <span className='hidden text-sm font-bold tracking-tight text-[#0F172A] sm:inline'>StatusPe</span>
        </Link>

        <nav className='flex items-center gap-1 overflow-x-auto text-sm' aria-label='Navegación pública'>
          <Link href='/' className='min-h-11 whitespace-nowrap rounded-full px-3 py-2 font-semibold text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Estado</Link>
          <Link href={`/s/${encodeURIComponent(slug)}/history`} className='hidden min-h-11 whitespace-nowrap rounded-full px-3 py-2 font-semibold text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:inline-flex sm:items-center'>Historial</Link>
          <Link href={`/s/${encodeURIComponent(slug)}/subscribe`} className='hidden min-h-11 whitespace-nowrap rounded-full px-3 py-2 font-semibold text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:inline-flex sm:items-center'>Suscribirse</Link>
          <Link href={`/api/v1/status-pages/[slug]${encodeURIComponent(slug)}/rss`} className='inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-[#EFF6FF] px-3 py-2 font-semibold text-[#2563EB] transition-all duration-200 hover:bg-[#DBEAFE] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>RSS</Link>
        </nav>
      </div>
    </header>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className='rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 shadow-sm' role='alert'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex gap-3'>
          <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-[#991B1B]' aria-hidden='true'>!</span>
          <div>
            <p className='text-sm font-semibold text-[#991B1B]'>No pudimos cargar las últimas entradas RSS</p>
            <p className='mt-1 text-sm leading-6 text-[#7F1D1D]'>{message}</p>
          </div>
        </div>
        <button type='button' onClick={onDismiss} className='inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#991B1B] transition-all duration-200 hover:bg-[#FEE2E2] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2' aria-label='Cerrar alerta'>×</button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className='space-y-4' aria-label='Cargando información RSS'>
      <div className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6'>
        <div className='h-4 w-28 animate-pulse rounded-xl bg-black/5' />
        <div className='mt-4 h-12 w-full animate-pulse rounded-xl bg-black/5' />
        <div className='mt-4 grid gap-3 sm:grid-cols-2'>
          <div className='h-11 animate-pulse rounded-full bg-black/5' />
          <div className='h-11 animate-pulse rounded-full bg-black/5' />
        </div>
      </div>
      {[0, 1, 2].map((item) => (
        <div key={item} className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm'>
          <div className='h-3 w-24 animate-pulse rounded-xl bg-black/5' />
          <div className='mt-3 h-5 w-3/4 animate-pulse rounded-xl bg-black/5' />
          <div className='mt-3 h-4 w-full animate-pulse rounded-xl bg-black/5' />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ feedPath }: { feedPath: string }) {
  return (
    <section className='rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm sm:p-8'>
      <div className='mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-3xl' aria-hidden='true'>📡</div>
      <h2 className='mt-4 text-lg font-semibold text-[#0F172A]'>No hay entradas RSS todavía</h2>
      <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-[#334155]'>Cuando StatusPe publique incidentes o mantenimientos, aparecerán aquí y también en tu lector RSS.</p>
      <a href={feedPath} target='_blank' rel='noreferrer' className='mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] shadow-sm transition-all duration-200 hover:bg-[#F8FAFC] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Abrir feed real</a>
    </section>
  );
}

function FeedEntryCard({ entry }: { entry: RssEntry }) {
  const tone = entryTone(entry.kind);
  return (
    <article className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-950/5 sm:p-5'>
      <div className='flex flex-wrap items-center gap-2'>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${chipClasses(tone)}`}>{entryLabel(entry.kind)}</span>
        <time className='text-xs font-medium text-[#64748B]' dateTime={entry.published_at}>{formatDate(entry.published_at)}</time>
      </div>
      <h3 className='mt-3 text-base font-semibold leading-6 text-[#0F172A]'>{entry.title}</h3>
      {entry.summary ? <p className='mt-2 line-clamp-3 text-sm leading-6 text-[#334155]'>{entry.summary}</p> : null}
      {entry.link ? (
        <a href={entry.link} target='_blank' rel='noreferrer' className='mt-4 inline-flex min-h-11 items-center rounded-full px-1 text-sm font-semibold text-[#2563EB] transition-all duration-200 hover:text-[#1D4ED8] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Ver actualización <span aria-hidden='true' className='ml-1'>↗</span></a>
      ) : null}
    </article>
  );
}

export default function RssPage() {
  const params = useParams<{ slug: string }>();
  const rawSlug = params.slug ?? 'statuspe';
  const slug = useMemo(() => safeDecode(rawSlug), [rawSlug]);
  const encodedSlug = encodeURIComponent(slug);
  const feedPath = `/api/v1/status-pages/[slug]${encodedSlug}/rss`;

  const [origin, setOrigin] = useState('');
  const [state, setState] = useState<LoadState>('loading');
  const [entries, setEntries] = useState<RssEntry[]>([]);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(true);
  const [copied, setCopied] = useState(false);

  const feedUrl = origin ? `${origin}${feedPath}` : feedPath;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadFeed(): Promise<void> {
      setState('loading');
      setError('');
      setShowError(true);
      try {
        const response = await fetch(feedPath, {
          cache: 'no-store',
          signal: controller.signal,
          headers: { Accept: 'application/rss+xml, application/xml, text/xml, application/json, text/plain' },
        });

        if (!response.ok) {
          throw new Error(`El feed respondió con HTTP ${response.status}.`);
        }

        const raw = await response.text();
        const parsed = parseFeedText(raw);
        if (!active) return;
        setEntries(parsed);
        setState('ready');
      } catch (cause: any) {
        if (!active || controller.signal.aborted) return;
        const message = cause instanceof Error ? cause.message : 'Intenta nuevamente en unos segundos.';
        setEntries([]);
        setError(message);
        setState('error');
      }
    }

    void loadFeed();

    return () => {
      active = false;
      controller.abort();
    };
  }, [feedPath]);

  async function copyFeedUrl(): Promise<void> {
    const text = origin ? feedUrl : `${window.location.origin}${feedPath}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setError('No se pudo copiar automáticamente. Selecciona la URL y cópiala manualmente.');
      setShowError(true);
      setState((current) => (current === 'loading' ? 'error' : current));
    }
  }

  return (
    <div className='min-h-screen bg-[#F6F8FC]'>
      <Header slug={slug} />

      <main className='mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8'>
        <section className='overflow-hidden rounded-3xl border border-[#E2E8F0] bg-gradient-to-br from-[#EFF6FF] to-[#FFFFFF] p-5 shadow-lg shadow-blue-950/5 sm:p-8'>
          <div className='flex flex-col gap-6 md:flex-row md:items-end md:justify-between'>
            <div className='max-w-2xl'>
              <span className='inline-flex items-center gap-1.5 rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]'>RSS público</span>
              <h1 className='mt-4 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl'>Feed RSS de StatusPe</h1>
              <p className='mt-3 text-sm leading-6 text-[#334155] sm:text-base'>Conecta este endpoint a tu lector RSS o herramienta interna. Esta página solo informa la URL; el XML real lo sirve la API RSS.</p>
            </div>
            <div className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm'>
              <p className='text-xs font-medium uppercase tracking-wide text-[#64748B]'>Servicio</p>
              <p className='mt-1 text-lg font-bold text-[#0F172A]'>StatusPe</p>
            </div>
          </div>
        </section>

        <div className='mt-6 space-y-4'>
          {state === 'error' && showError ? <ErrorBanner message={error || 'El feed no está disponible en este momento.'} onDismiss={() => setShowError(false)} /> : null}

          {state === 'loading' ? (
            <LoadingSkeleton />
          ) : (
            <>
              <section className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6'>
                <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-[#64748B]'>URL del feed</p>
                    <div className='mt-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3'>
                      <code className='block overflow-x-auto whitespace-nowrap text-sm font-semibold text-[#0F172A]'>{feedUrl}</code>
                    </div>
                    <p className='mt-3 text-sm leading-6 text-[#334155]'>Usa esta URL en Slack, Feedly, cron interno o cualquier lector compatible con RSS.</p>
                  </div>

                  <div className='grid gap-3 sm:grid-cols-2 lg:w-72 lg:grid-cols-1'>
                    <button type='button' onClick={copyFeedUrl} className='inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2' aria-label={copied ? 'URL copiada' : 'Copiar URL RSS'}>
                      {copied ? '✓ Copiado' : 'Copiar URL'}
                    </button>
                    <a href={feedPath} target='_blank' rel='noreferrer' className='inline-flex min-h-11 items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] shadow-sm transition-all duration-200 hover:bg-[#F8FAFC] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Abrir feed directo</a>
                  </div>
                </div>
              </section>

              <section className='grid gap-4 lg:grid-cols-[1fr_320px]'>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between gap-3'>
                    <h2 className='text-lg font-semibold text-[#0F172A]'>Últimas entradas detectadas</h2>
                    <span className='inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#166534]'>{entries.length} items</span>
                  </div>

                  {entries.length > 0 ? (
                    <div className='grid gap-3'>
                      {entries.slice(0, 8).map((entry, index) => (
                        <FeedEntryCard key={`${entry.link}-${entry.published_at}-${index}`} entry={entry} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState feedPath={feedPath} />
                  )}
                </div>

                <aside className='h-fit rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm lg:sticky lg:top-24'>
                  <h2 className='text-lg font-semibold text-[#0F172A]'>Qué recibirás</h2>
                  <div className='mt-4 space-y-3'>
                    <div className='flex gap-3'>
                      <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-sm font-bold text-[#991B1B]'>I</span>
                      <div>
                        <p className='text-sm font-semibold text-[#0F172A]'>Incidentes</p>
                        <p className='text-sm leading-6 text-[#334155]'>Investigación, monitoreo y resolución con enlaces al detalle público.</p>
                      </div>
                    </div>
                    <div className='flex gap-3'>
                      <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-sm font-bold text-[#92400E]'>M</span>
                      <div>
                        <p className='text-sm font-semibold text-[#0F172A]'>Mantenimientos</p>
                        <p className='text-sm leading-6 text-[#334155]'>Ventanas programadas, progreso y cierre operacional.</p>
                      </div>
                    </div>
                    <div className='flex gap-3'>
                      <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-bold text-[#1D4ED8]'>U</span>
                      <div>
                        <p className='text-sm font-semibold text-[#0F172A]'>Actualizaciones</p>
                        <p className='text-sm leading-6 text-[#334155]'>Mensajes cronológicos publicados por el equipo de StatusPe.</p>
                      </div>
                    </div>
                  </div>
                </aside>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
