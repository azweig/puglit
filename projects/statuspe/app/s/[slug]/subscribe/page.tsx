"use client";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

type Channel = 'email' | 'webhook';

type StatusPageSummary = {
  name: string;
  slug: string;
  logo_url: string;
  subscribe_email_enabled: boolean;
  subscribe_webhook_enabled: boolean;
  subscribe_rss_enabled: boolean;
  footer_text: string;
};

type ComponentRow = {
  id: string;
  name: string;
  description: string;
  current_status: string;
  position: number;
};

type SuccessState = {
  channel: Channel;
  destination: string;
};

type TrackProps = Record<string, string | number | boolean | null | undefined>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRIVACY_URL = process.env.NEXT_PUBLIC_PRIVACY_URL || '';
const TERMS_URL = process.env.NEXT_PUBLIC_TERMS_URL || '';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string, fallback = ''): string {
  const value = record[key];
  return typeof value === 'string' ? value : fallback;
}

function readBoolean(record: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = record[key];
  return typeof value === 'boolean' ? value : fallback;
}

function readNumber(record: Record<string, unknown>, key: string, fallback: number): number {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readRecord(record: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = record[key];
  return isRecord(value) ? value : null;
}

function normalizeList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];

  const items = data.items;
  if (Array.isArray(items)) return items;

  const rows = data.rows;
  if (Array.isArray(rows)) return rows;

  const nestedData = data.data;
  if (Array.isArray(nestedData)) return nestedData;

  return [];
}

function parseChannels(record: Record<string, unknown>): Channel[] {
  const raw = record.channels ?? record.available_channels;
  if (!Array.isArray(raw)) return [];

  const channels: Channel[] = [];
  raw.forEach((value: unknown) => {
    if (value === 'email' || value === 'webhook') channels.push(value);
  });
  return Array.from(new Set(channels));
}

function parseSubscribePayload(payload: unknown): { page: StatusPageSummary; components: ComponentRow[] } {
  const root = isRecord(payload) ? payload : {};
  const source = readRecord(root, 'data') ?? root;
  const pageRecord = readRecord(source, 'status_page') ?? readRecord(source, 'page') ?? source;

  const explicitChannels = Array.from(new Set([...parseChannels(source), ...parseChannels(pageRecord)]));
  const hasExplicitChannels = explicitChannels.length > 0;

  const page: StatusPageSummary = {
    name: readString(pageRecord, 'name', 'StatusPe'),
    slug: readString(pageRecord, 'slug', readString(source, 'slug', 'statuspe')),
    logo_url: readString(pageRecord, 'logo_url', ''),
    subscribe_email_enabled: hasExplicitChannels
      ? explicitChannels.includes('email')
      : readBoolean(pageRecord, 'subscribe_email_enabled', readBoolean(source, 'subscribe_email_enabled', true)),
    subscribe_webhook_enabled: hasExplicitChannels
      ? explicitChannels.includes('webhook')
      : readBoolean(pageRecord, 'subscribe_webhook_enabled', readBoolean(source, 'subscribe_webhook_enabled', true)),
    subscribe_rss_enabled: readBoolean(pageRecord, 'subscribe_rss_enabled', readBoolean(source, 'subscribe_rss_enabled', true)),
    footer_text: readString(pageRecord, 'footer_text', 'Powered by StatusPe'),
  };

  const rawComponents = Array.isArray(source.components) ? source.components : normalizeList(source.components ?? payload);
  const components = rawComponents
    .filter(isRecord)
    .map((component: Record<string, unknown>): ComponentRow => ({
      id: String(component.id ?? ''),
      name: readString(component, 'name', 'Componente sin nombre'),
      description: readString(component, 'description', ''),
      current_status: readString(component, 'current_status', 'operational'),
      position: readNumber(component, 'position', 0),
    }))
    .filter((component: ComponentRow) => component.id.length > 0)
    .sort((a: ComponentRow, b: ComponentRow) => a.position - b.position || a.name.localeCompare(b.name));

  return { page, components };
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) return fallback;
  return readString(payload, 'message', readString(payload, 'error', fallback));
}

function getErrorCode(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) return fallback;
  return readString(payload, 'errorCode', readString(payload, 'error_code', readString(payload, 'code', fallback)));
}

function getStatusPillStyles(status: string): string {
  if (status === 'operational') return 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]';
  if (status === 'degraded' || status === 'maintenance') return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
  if (status === 'outage') return 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]';
  return 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]';
}

function getStatusLabel(status: string): string {
  if (status === 'operational') return 'Operativo';
  if (status === 'degraded') return 'Degradado';
  if (status === 'maintenance') return 'Mantenimiento';
  if (status === 'outage') return 'Interrupción';
  if (status === 'paused') return 'Pausado';
  return 'Sin publicar';
}

function validateWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function track(event: string, props: TrackProps = {}): void {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify({ event, props, sent_at: new Date().toISOString() });

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      if (navigator.sendBeacon('/api/analytics', payload)) return;
    }
  } catch {
    // Analytics must never block the subscription funnel.
  }

  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

function ErrorBanner(props: { message: string; onDismiss: () => void; onRetry?: () => void }): JSX.Element {
  return (
    <div className='rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 shadow-sm' role='alert'>
      <div className='flex gap-3'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-sm font-extrabold text-[#991B1B]'>!</div>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-semibold text-[#991B1B]'>No pudimos completar la operación</p>
          <p className='mt-1 text-sm leading-6 text-[#7F1D1D]'>{props.message}</p>
          {props.onRetry ? (
            <button
              type='button'
              onClick={props.onRetry}
              className='mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-[#FECACA] bg-white px-4 py-2 text-sm font-semibold text-[#991B1B] transition-all duration-200 hover:bg-[#FFF7F7] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2'
            >
              Reintentar
            </button>
          ) : null}
        </div>
        <button
          type='button'
          aria-label='Cerrar alerta'
          onClick={props.onDismiss}
          className='flex size-10 shrink-0 items-center justify-center rounded-full text-[#991B1B] transition-all duration-200 hover:bg-[#FEE2E2] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2'
        >
          ×
        </button>
      </div>
    </div>
  );
}

function LoadingState(): JSX.Element {
  return (
    <main className='mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8'>
      <section className='overflow-hidden rounded-3xl border border-[#E2E8F0] bg-gradient-to-br from-[#EFF6FF] to-[#FFFFFF] p-5 shadow-lg shadow-blue-950/5 sm:p-8'>
        <div className='animate-pulse'>
          <div className='h-7 w-40 rounded-xl bg-black/5' />
          <div className='mt-5 h-11 w-full max-w-xl rounded-2xl bg-black/5' />
          <div className='mt-4 h-5 w-full max-w-2xl rounded-xl bg-black/5' />
          <div className='mt-2 h-5 w-3/4 max-w-xl rounded-xl bg-black/5' />
        </div>
      </section>
    </main>
  );
}

function EmptyChannels(props: { rssEnabled: boolean; slug: string; onRetry: () => void }): JSX.Element {
  return (
    <section className='rounded-3xl border border-[#E2E8F0] bg-white p-6 text-center shadow-lg shadow-blue-950/5 sm:p-10'>
      <div className='mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#EFF6FF] text-3xl' aria-hidden='true'>📡</div>
      <h2 className='mt-5 text-2xl font-bold tracking-tight text-[#0F172A]'>No hay canales de suscripción activos</h2>
      <p className='mx-auto mt-2 max-w-xl text-sm leading-6 text-[#334155]'>
        Esta página de estado todavía no publica suscripciones por email o webhook. Puedes volver a intentarlo más tarde o seguir el feed técnico si está disponible.
      </p>
      <div className='mt-6 flex flex-col justify-center gap-3 sm:flex-row'>
        <button
          type='button'
          onClick={props.onRetry}
          className='inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'
        >
          Buscar canales
        </button>
        {props.rssEnabled ? (
          <Link
            href={`/api/v1/status-pages/[slug]${props.slug}/rss`}
            className='inline-flex min-h-11 items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-all duration-200 hover:bg-[#F8FAFC] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'
          >
            Abrir RSS
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function LegalConfigurationError(props: { onRetry: () => void }): JSX.Element {
  return (
    <section className='rounded-3xl border border-[#FDE68A] bg-[#FFFBEB] p-6 shadow-lg shadow-amber-950/5 sm:p-8' role='alert'>
      <div className='flex flex-col gap-4 sm:flex-row'>
        <div className='flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#FEF3C7] text-xl font-extrabold text-[#92400E]'>!</div>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-semibold uppercase tracking-wide text-[#92400E]'>Configuración legal requerida</p>
          <h2 className='mt-2 text-2xl font-bold tracking-tight text-[#0F172A]'>Formulario de suscripción deshabilitado</h2>
          <p className='mt-2 text-sm leading-6 text-[#78350F]'>
            Operador: configura NEXT_PUBLIC_TERMS_URL y NEXT_PUBLIC_PRIVACY_URL con URLs públicas y no vacías antes de recoger correos electrónicos o URLs de webhook desde este funnel público.
          </p>
          <button
            type='button'
            onClick={props.onRetry}
            className='mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-[#FDE68A] bg-white px-5 py-2.5 text-sm font-semibold text-[#92400E] transition-all duration-200 hover:bg-[#FEF3C7] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2'
          >
            Revisar nuevamente
          </button>
        </div>
      </div>
    </section>
  );
}

function SuccessCard(props: { success: SuccessState; page: StatusPageSummary; slug: string }): JSX.Element {
  const isEmail = props.success.channel === 'email';

  return (
    <section className='overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-lg shadow-blue-950/5'>
      <div className='bg-gradient-to-br from-[#EFF6FF] to-[#FFFFFF] p-6 text-center sm:p-10'>
        <div className='mx-auto flex size-16 items-center justify-center rounded-full bg-[#DCFCE7] text-3xl font-extrabold text-[#166534]'>✓</div>
        <p className='mt-5 text-xs font-semibold uppercase tracking-wide text-[#2563EB]'>Suscripción pendiente de confirmación</p>
        <h1 className='mt-2 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl'>
          {isEmail ? 'Revisa tu correo para confirmar' : 'Revisa tu webhook para confirmar'}
        </h1>
        <p className='mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#334155] sm:text-base'>
          Recibimos la solicitud para <span className='font-semibold text-[#0F172A]'>{props.success.destination}</span>. Revisa tu correo/webhook para confirmar la suscripción a {props.page.name}.
        </p>
      </div>

      <div className='space-y-4 p-5 sm:p-6'>
        <div className='rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] p-4'>
          <p className='text-sm font-semibold text-[#1D4ED8]'>Verificación requerida</p>
          <p className='mt-1 text-sm leading-6 text-[#334155]'>
            Por seguridad, el enlace de verificación se envía únicamente al destino registrado. La suscripción quedará activa después de confirmar la solicitud desde ese canal.
          </p>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          <Link
            href={`/s/${props.slug}`}
            className='inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'
          >
            Volver al estado
          </Link>
          {props.page.subscribe_rss_enabled ? (
            <Link
              href={`/api/v1/status-pages/[slug]${props.slug}/rss`}
              className='inline-flex min-h-11 items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-all duration-200 hover:bg-[#F8FAFC] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'
            >
              Seguir RSS
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function SubscribePage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<StatusPageSummary | null>(null);
  const [components, setComponents] = useState<ComponentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [dismissedError, setDismissedError] = useState<boolean>(false);
  const [activeChannel, setActiveChannel] = useState<Channel>('email');
  const [email, setEmail] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [wantsAllComponents, setWantsAllComponents] = useState<boolean>(true);
  const [selectedComponentIds, setSelectedComponentIds] = useState<Set<string>>(() => new Set<string>());
  const [consent, setConsent] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const publicSlug = page?.slug || slug || 'statuspe';
  const legalLinksConfigured = PRIVACY_URL.length > 0 && TERMS_URL.length > 0;

  const availableChannels = useMemo<Channel[]>(() => {
    const channels: Channel[] = [];
    if (page?.subscribe_email_enabled) channels.push('email');
    if (page?.subscribe_webhook_enabled) channels.push('webhook');
    return channels;
  }, [page]);

  async function loadSubscribeOptions(): Promise<void> {
    setLoading(true);
    setError('');
    setDismissedError(false);

    try {
      const response = await fetch(`/api/v1/status-pages/[slug]${encodeURIComponent(slug)}/subscribe`, { cache: 'no-store' });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'No pudimos cargar las opciones de suscripción.'));
      }

      const parsed = parseSubscribePayload(payload);
      setPage(parsed.page);
      setComponents(parsed.components);

      const nextChannel: Channel = parsed.page.subscribe_email_enabled ? 'email' : 'webhook';
      setActiveChannel((previous: Channel) => {
        if (previous === 'email' && parsed.page.subscribe_email_enabled) return 'email';
        if (previous === 'webhook' && parsed.page.subscribe_webhook_enabled) return 'webhook';
        return nextChannel;
      });
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'No pudimos cargar este formulario.');
      setPage(null);
      setComponents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function run(): Promise<void> {
      setLoading(true);
      setError('');
      setDismissedError(false);

      try {
        const response = await fetch(`/api/v1/status-pages/[slug]${encodeURIComponent(slug)}/subscribe`, { cache: 'no-store' });
        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(getErrorMessage(payload, 'No pudimos cargar las opciones de suscripción.'));
        }

        if (!active) return;
        const parsed = parseSubscribePayload(payload);
        setPage(parsed.page);
        setComponents(parsed.components);
        setActiveChannel((previous: Channel) => {
          if (previous === 'email' && parsed.page.subscribe_email_enabled) return 'email';
          if (previous === 'webhook' && parsed.page.subscribe_webhook_enabled) return 'webhook';
          return parsed.page.subscribe_email_enabled ? 'email' : 'webhook';
        });
      } catch (loadError: unknown) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'No pudimos cargar este formulario.');
        setPage(null);
        setComponents([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [slug]);

  function selectChannel(channel: Channel): void {
    setActiveChannel(channel);
    track('statuspe_subscribe_channel_select', { slug: publicSlug, channel });
  }

  function toggleComponent(componentId: string): void {
    setSelectedComponentIds((previous: Set<string>) => {
      const next = new Set(previous);
      if (next.has(componentId)) next.delete(componentId);
      else next.add(componentId);
      return next;
    });
  }

  function handleWantsAllComponentsChange(event: ChangeEvent<HTMLInputElement>): void {
    const checked = event.target.checked;
    setWantsAllComponents(checked);
    if (checked) setSelectedComponentIds(new Set<string>());
  }

  function failValidation(message: string, errorCode: string): void {
    setError(message);
    track('statuspe_subscribe_error', { slug: publicSlug, channel: activeChannel, errorCode });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setDismissedError(false);

    const trimmedEmail = email.trim();
    const trimmedWebhookUrl = webhookUrl.trim();
    const selectedIds = Array.from(selectedComponentIds);
    const selectedComponentCount = wantsAllComponents ? components.length : selectedIds.length;

    track('statuspe_subscribe_submit', {
      slug: publicSlug,
      channel: activeChannel,
      selectedComponentCount,
      wantsAllComponents,
    });

    if (!legalLinksConfigured) {
      failValidation('Este formulario requiere configurar NEXT_PUBLIC_PRIVACY_URL y NEXT_PUBLIC_TERMS_URL antes de aceptar suscripciones.', 'legal_links_missing');
      return;
    }

    if (activeChannel === 'email' && !EMAIL_PATTERN.test(trimmedEmail)) {
      failValidation('Ingresa un correo válido para recibir actualizaciones.', 'invalid_email');
      return;
    }

    if (activeChannel === 'webhook' && !validateWebhookUrl(trimmedWebhookUrl)) {
      failValidation('Ingresa una URL HTTPS válida para el webhook.', 'invalid_webhook_url');
      return;
    }

    if (!wantsAllComponents && selectedIds.length === 0) {
      failValidation('Selecciona al menos un componente o activa la opción de todos los componentes.', 'missing_components');
      return;
    }

    if (!consent) {
      failValidation('Confirma que aceptas recibir actualizaciones operativas y la política de privacidad.', 'missing_consent');
      return;
    }

    const body = activeChannel === 'email'
      ? {
          channel: 'email',
          email: trimmedEmail,
          wants_all_components: wantsAllComponents,
          component_ids: wantsAllComponents ? [] : selectedIds,
        }
      : {
          channel: 'webhook',
          webhook_url: trimmedWebhookUrl,
          wants_all_components: wantsAllComponents,
          component_ids: wantsAllComponents ? [] : selectedIds,
        };

    setSubmitting(true);
    let submitErrorTracked = false;
    try {
      const response = await fetch(`/api/v1/status-pages/[slug]${encodeURIComponent(slug)}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const errorCode = getErrorCode(payload, `http_${response.status}`);
        submitErrorTracked = true;
        track('statuspe_subscribe_error', { slug: publicSlug, channel: activeChannel, errorCode });
        throw new Error(getErrorMessage(payload, 'No pudimos crear la suscripción.'));
      }

      track('statuspe_subscribe_success', { slug: publicSlug, channel: activeChannel });
      setSuccess({
        channel: activeChannel,
        destination: activeChannel === 'email' ? trimmedEmail : trimmedWebhookUrl,
      });
    } catch (submitError: unknown) {
      if (!submitErrorTracked) {
        track('statuspe_subscribe_error', { slug: publicSlug, channel: activeChannel, errorCode: 'network_error' });
      }
      setError(submitError instanceof Error ? submitError.message : 'No pudimos crear la suscripción.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className='min-h-screen bg-[#F6F8FC]'>
      <header className='sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur'>
        <div className='mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8'>
          <Link href='/' className='group flex min-w-0 items-center gap-3 rounded-full pr-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>
            {page?.logo_url ? (
              <img src={page.logo_url} alt={`Logo de ${page.name}`} className='size-9 rounded-full border border-[#E2E8F0] bg-white object-cover shadow-sm' />
            ) : (
              <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-bold text-[#1D4ED8]'>
                {(page?.name ?? 'S').slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className='truncate text-sm font-bold text-[#0F172A] transition-colors duration-200 group-hover:text-[#2563EB]'>{page?.name ?? 'StatusPe'}</span>
          </Link>

          <nav className='flex items-center gap-1 overflow-x-auto text-sm' aria-label='Navegación pública'>
            <Link href='/' className='whitespace-nowrap rounded-full px-3 py-2 font-semibold text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Estado</Link>
            <Link href={`/s/${publicSlug}/history`} className='hidden whitespace-nowrap rounded-full px-3 py-2 font-semibold text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:inline-flex'>Historial</Link>
            <Link href={`/s/${publicSlug}/subscribe`} className='whitespace-nowrap rounded-full bg-[#EFF6FF] px-3 py-2 font-semibold text-[#2563EB] transition-all duration-200 hover:bg-[#DBEAFE] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>Suscribirse</Link>
            {page?.subscribe_rss_enabled ? (
              <Link href={`/api/v1/status-pages/[slug]${publicSlug}/rss`} className='whitespace-nowrap rounded-full px-3 py-2 font-semibold text-[#475569] transition-all duration-200 hover:bg-[#F8FAFC] hover:text-[#0F172A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'>RSS</Link>
            ) : null}
          </nav>
        </div>
      </header>

      <main className='mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8'>
        <section className='overflow-hidden rounded-3xl border border-[#E2E8F0] bg-gradient-to-br from-[#EFF6FF] to-[#FFFFFF] p-5 shadow-lg shadow-blue-950/5 sm:p-8'>
          <div className='flex flex-col gap-6 md:flex-row md:items-end md:justify-between'>
            <div className='max-w-3xl'>
              <p className='inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#1D4ED8] shadow-sm'>
                <span className='size-2 rounded-full bg-[#16A34A]' aria-hidden='true' /> Actualizaciones operativas
              </p>
              <h1 className='mt-4 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl'>Suscribirse a actualizaciones</h1>
              <p className='mt-3 max-w-2xl text-sm leading-6 text-[#334155] sm:text-base'>
                Recibe avisos precisos de incidentes, mantenimientos programados y recuperaciones de {page?.name ?? 'esta página de estado'} sin ruido comercial.
              </p>
            </div>
            {page?.subscribe_rss_enabled ? (
              <Link
                href={`/api/v1/status-pages/[slug]${publicSlug}/rss`}
                className='inline-flex min-h-11 items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] shadow-sm transition-all duration-200 hover:bg-[#F8FAFC] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2'
              >
                Seguir por RSS
              </Link>
            ) : null}
          </div>
        </section>

        <div className='mt-5 space-y-5'>
          {error.length > 0 && !dismissedError ? (
            <ErrorBanner message={error} onDismiss={() => setDismissedError(true)} onRetry={!page ? loadSubscribeOptions : undefined} />
          ) : null}

          {success && page ? (
            <SuccessCard success={success} page={page} slug={publicSlug} />
          ) : availableChannels.length === 0 ? (
            <EmptyChannels rssEnabled={Boolean(page?.subscribe_rss_enabled)} slug={publicSlug} onRetry={loadSubscribeOptions} />
          ) : !legalLinksConfigured ? (
            <LegalConfigurationError onRetry={loadSubscribeOptions} />
          ) : (
            <section className='grid gap-5 lg:grid-cols-[1.15fr_0.85fr]'>
              <form onSubmit={handleSubmit} className='rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6'>
                <fieldset disabled={submitting} className='min-w-0'>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                      <h2 className='text-lg font-semibold text-[#0F172A]'>Elige cómo quieres recibir avisos</h2>
                      <p className='mt-1 text-sm leading-6 text-[#64748B]'>Solo enviamos eventos operativos publicados por el equipo.</p>
                    </div>
                    <span className='inline-flex w-fit items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#166534]'>Sin spam</span>
                  </div>

                  {availableChannels.length > 1 ? (
                    <div className='mt-5 grid grid-cols-2 gap-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] p-1'>
                      <button
                        type='button'
                        onClick={() => selectChannel('email')}
                        className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${activeChannel === 'email' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#475569] hover:bg-white hover:text-[#0F172A]'}`}
                      >
                        Email
                      </button>
                      <button
                        type='button'
                        onClick={() => selectChann