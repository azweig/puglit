"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Channel = "email" | "sms" | "slack" | "webhook" | "rss";
type LoadState = "loading" | "ready" | "empty" | "error";

type PageInfo = {
  id: string;
  title: string;
  slug: string;
  logo_text: string;
  sms_enabled: boolean;
  slack_enabled: boolean;
  webhook_enabled: boolean;
  subscriptions_enabled: boolean;
};

type ComponentView = {
  id: string;
  name: string;
  description: string;
  current_status: string;
  group_id: string;
  group_name: string;
};

type Notice = {
  kind: "success" | "info";
  title: string;
  body: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function getRecord(source: unknown, key: string): Record<string, unknown> | null {
  const record = asRecord(source);
  if (!record) return null;
  return asRecord(record[key]);
}

function getArray(source: unknown, key: string): unknown[] {
  const record = asRecord(source);
  if (!record) return [];
  const value = record[key];
  if (Array.isArray(value)) return value;
  const nested = asRecord(value);
  if (nested) {
    if (Array.isArray(nested.items)) return nested.items;
    if (Array.isArray(nested.rows)) return nested.rows;
  }
  return [];
}

function getString(source: unknown, key: string, fallback = ""): string {
  const record = asRecord(source);
  const value = record?.[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return fallback;
}

function getBoolean(source: unknown, key: string, fallback = false): boolean {
  const record = asRecord(source);
  const value = record?.[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return fallback;
}

function normalizeList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  if (!record) return [];
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.rows)) return record.rows;
  if (Array.isArray(record.data)) return record.data;
  return [];
}

function parseStatusPage(data: unknown, fallbackSlug: string): { page: PageInfo | null; components: ComponentView[] } {
  const root = asRecord(data);
  const pageRecord = getRecord(data, "status_page") ?? getRecord(data, "page") ?? getRecord(data, "data") ?? root;
  if (!pageRecord) return { page: null, components: [] };

  const groupRows = [
    ...getArray(data, "component_groups"),
    ...getArray(data, "groups"),
    ...getArray(pageRecord, "component_groups"),
  ];
  const groupNames = new Map<string, string>();
  groupRows.forEach((row) => {
    const id = getString(row, "id");
    if (id) groupNames.set(id, getString(row, "name", "Core services"));
  });

  let componentRows = [
    ...getArray(data, "components"),
    ...getArray(data, "services"),
    ...getArray(pageRecord, "components"),
  ];
  if (componentRows.length === 0) componentRows = normalizeList(getRecord(data, "components"));

  const components = componentRows
    .map((row): ComponentView | null => {
      const id = getString(row, "id");
      if (!id || getBoolean(row, "is_visible", true) === false) return null;
      const groupId = getString(row, "group_id");
      const group = getRecord(row, "group");
      const groupName = getString(row, "group_name", getString(group, "name", groupNames.get(groupId) ?? "Core services"));
      return {
        id,
        name: getString(row, "name", "Untitled component"),
        description: getString(row, "description", "Public component monitored by Statura."),
        current_status: getString(row, "current_status", "operational"),
        group_id: groupId,
        group_name: groupName,
      };
    })
    .filter((row): row is ComponentView => row !== null);

  const title = getString(pageRecord, "title", "Statura");
  const page: PageInfo = {
    id: getString(pageRecord, "id"),
    title,
    slug: getString(pageRecord, "slug", fallbackSlug),
    logo_text: getString(pageRecord, "logo_text", title.slice(0, 1).toUpperCase()),
    sms_enabled: getBoolean(pageRecord, "sms_enabled", false),
    slack_enabled: getBoolean(pageRecord, "slack_enabled", false),
    webhook_enabled: getBoolean(pageRecord, "webhook_enabled", false),
    subscriptions_enabled: getBoolean(pageRecord, "subscriptions_enabled", true),
  };

  return { page, components };
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    operational: "Operational",
    degraded_performance: "Degraded",
    partial_outage: "Partial outage",
    major_outage: "Major outage",
    under_maintenance: "Maintenance",
  };
  return labels[status] ?? "Operational";
}

function statusChipClass(status: string): string {
  if (status === "operational") return "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]";
  if (status === "degraded_performance" || status === "under_maintenance") return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
  return "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
}

function channelLabel(channel: Channel): string {
  const labels: Record<Channel, string> = {
    email: "Email",
    sms: "SMS",
    slack: "Slack",
    webhook: "Webhook",
    rss: "RSS feed",
  };
  return labels[channel];
}

function destinationPlaceholder(channel: Channel): string {
  if (channel === "sms") return "+1 415 555 0198";
  if (channel === "slack") return "https://hooks.slack.com/services/...";
  if (channel === "webhook") return "https://example.com/statura-webhook";
  return "you@company.com";
}

function destinationType(channel: Channel): string {
  if (channel === "email") return "email";
  if (channel === "sms") return "tel";
  if (channel === "webhook" || channel === "slack") return "url";
  return "text";
}

function toPayloadId(id: string): string | number {
  const numeric = Number(id);
  if (Number.isSafeInteger(numeric) && String(numeric) === id) return numeric;
  return id;
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-black/5 ${className}`} />;
}

function ErrorBanner({ message, onDismiss, onRetry }: { message: string; onDismiss?: () => void; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-[#0B1220] shadow-sm" role="alert">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EF4444] text-sm font-bold text-[#FFFFFF]">!</span>
          <div>
            <p className="text-sm font-bold text-[#991B1B]">We could not complete the request</p>
            <p className="mt-1 text-sm leading-6 text-[#7F1D1D]">{message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onRetry ? (
            <button onClick={onRetry} className="min-h-11 rounded-full bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#991B1B] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2">
              Retry
            </button>
          ) : null}
          {onDismiss ? (
            <button onClick={onDismiss} aria-label="Dismiss error" className="min-h-11 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-4 py-2 text-sm font-semibold text-[#991B1B] transition-all duration-200 hover:bg-[#FFFFFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2">
              Dismiss
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function SubscribeToUpdatesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [page, setPage] = useState<PageInfo | null>(null);
  const [components, setComponents] = useState<ComponentView[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<Channel>("email");
  const [destination, setDestination] = useState("");
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [feedUrl, setFeedUrl] = useState("");

  const statusSlug = page?.slug || slug;
  const rssUrl = `/api/public/status-pages/[slug]${encodeURIComponent(statusSlug)}/rss`;

  const loadPage = async () => {
    setLoadState("loading");
    setLoadError("");
    setNotice(null);
    const controller = new AbortController();
    try {
      const response = await fetch(`/api/public/status-pages/[slug]${encodeURIComponent(slug)}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = getString(data, "message", getString(data, "error", "This status page is not available right now."));
        throw new Error(message);
      }
      const parsed = parseStatusPage(data, slug);
      setPage(parsed.page);
      setComponents(parsed.components);
      setSelectedIds(new Set(parsed.components.map((component) => component.id)));
      setFeedUrl(`/api/public/status-pages/[slug]${encodeURIComponent(parsed.page?.slug ?? slug)}/rss`);
      if (!parsed.page?.subscriptions_enabled) setLoadState("empty");
      else setLoadState("ready");
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "The public subscription form could not be loaded.");
      setLoadState("error");
    }
    return () => controller.abort();
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await loadPage();
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const channels = useMemo(() => {
    const next: Channel[] = ["email"];
    if (page?.sms_enabled) next.push("sms");
    if (page?.slack_enabled) next.push("slack");
    if (page?.webhook_enabled) next.push("webhook");
    next.push("rss");
    return next;
  }, [page]);

  const groupedComponents = useMemo(() => {
    const groups = new Map<string, ComponentView[]>();
    components.forEach((component) => {
      const key = component.group_name || "Core services";
      const existing = groups.get(key) ?? [];
      existing.push(component);
      groups.set(key, existing);
    });
    return Array.from(groups.entries());
  }, [components]);

  const allSelected = components.length > 0 && selectedIds.size === components.length;

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(components.map((component) => component.id)));
  };

  const toggleComponent = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setNotice(null);

    if (components.length > 0 && selectedIds.size === 0) {
      setSubmitError("Choose at least one component, or select all public components.");
      return;
    }
    if (channel !== "rss" && destination.trim().length === 0) {
      setSubmitError(`Enter a valid ${channelLabel(channel).toLowerCase()} destination.`);
      return;
    }

    setSubmitting(true);
    const componentIds = Array.from(selectedIds).map(toPayloadId);
    try {
      const response = await fetch(`/api/public/status-pages/[slug]${encodeURIComponent(statusSlug)}/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          destination: channel === "rss" ? rssUrl : destination.trim(),
          component_ids: componentIds,
        }),
      });
      const data: unknown = await response.json().catch(() => null);

      if (channel === "rss") {
        const returnedFeed = getString(data, "feed_url", getString(getRecord(data, "subscriber"), "feed_url", rssUrl));
        setFeedUrl(returnedFeed);
        setNotice({ kind: "info", title: "RSS feed is ready", body: "Copy this feed URL into your reader to follow incidents and maintenance updates." });
        setSubmitting(false);
        return;
      }

      if (!response.ok) {
        const message = getString(data, "message", getString(data, "error", "The subscription could not be created."));
        throw new Error(message);
      }

      const subscriber = getRecord(data, "subscriber");
      const token = getString(data, "verification_token", getString(data, "token", getString(subscriber, "verification_token")));
      const pending = getBoolean(data, "pending_verification", getString(data, "status") === "pending_verification" || token.length > 0);

      if (pending && token) {
        window.location.assign(`/subscribe/verify?token=${encodeURIComponent(token)}`);
        return;
      }

      setNotice({
        kind: "success",
        title: "Check your channel",
        body: `We created the subscription for ${destination.trim()}. Follow the verification instructions sent by Statura to activate updates.`,
      });
    } catch (error: unknown) {
      if (channel === "rss") {
        setFeedUrl(rssUrl);
        setNotice({ kind: "info", title: "RSS feed is ready", body: "Copy this feed URL into your reader to follow incidents and maintenance updates." });
      } else {
        setSubmitError(error instanceof Error ? error.message : "The subscription could not be created.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#0B1220]">
      <header className="sticky top-0 z-40 border-b border-[#D8E0EE] bg-[#F6F8FC]/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8" aria-label="Primary navigation">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-full pr-3 transition-all duration-200 hover:bg-[#FFFFFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-[#FFFFFF] shadow-sm">{page?.logo_text || "S"}</span>
            <span className="hidden text-sm font-extrabold tracking-tight text-[#0B1220] sm:inline">{page?.title || "Statura"}</span>
          </Link>
          <div className="hidden items-center gap-1 rounded-full border border-[#D8E0EE] bg-[#FFFFFF]/80 p-1 shadow-sm md:flex">
            <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#F9FBFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]">Estado</Link>
            <Link href="/uptime" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#F9FBFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]">Uptime histórico</Link>
            <Link href="/history" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#F9FBFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]">Historial de incidentes</Link>
            <Link href="/api/public/status-pages/[slug]" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-colors duration-200 hover:bg-[#F9FBFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]">RSS</Link>
          </div>
          <Link href="/#subscribe" className="min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            Subscribe
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {loadState === "loading" ? (
          <section className="space-y-6">
            <div className="rounded-[2rem] bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] p-5 shadow-xl sm:p-8">
              <SkeletonBlock className="h-7 w-36 bg-white/20" />
              <SkeletonBlock className="mt-6 h-12 w-4/5 bg-white/20" />
              <SkeletonBlock className="mt-4 h-5 w-2/3 bg-white/20" />
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <SkeletonBlock className="h-24 bg-white/90" />
                <SkeletonBlock className="h-24 bg-white/90" />
                <SkeletonBlock className="h-24 bg-white/90" />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <SkeletonBlock className="h-[520px]" />
              <SkeletonBlock className="h-[520px]" />
            </div>
          </section>
        ) : null}

        {loadState === "error" ? (
          <section className="space-y-6">
            <ErrorBanner message={loadError} onRetry={loadPage} />
            <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-6 text-[#0B1220] shadow-sm">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1220] sm:text-3xl">Subscribe to updates</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#526071] sm:text-base">Statura could not load this status page context. You can retry safely without losing your place.</p>
            </div>
          </section>
        ) : null}

        {loadState === "empty" ? (
          <section className="rounded-[2rem] border border-[#D8E0EE] bg-[#FFFFFF] p-8 text-center text-[#0B1220] shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF] text-3xl text-[#1D4ED8]">🔕</div>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#0B1220] sm:text-3xl">Subscriptions are not enabled for this status page</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#526071] sm:text-base">The public page is available, but Statura is not accepting notification subscriptions for it right now.</p>
            <Link href={`/status/${encodeURIComponent(statusSlug)}`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
              Back to status page
            </Link>
          </section>
        ) : null}

        {loadState === "ready" && page ? (
          <section className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] shadow-xl">
              <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_380px] lg:items-end">
                <div className="text-[#FFFFFF]">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#DBEAFE]">
                    <span className="h-2 w-2 rounded-full bg-[#10B981]" /> Public subscription
                  </div>
                  <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-[#FFFFFF] sm:text-4xl">Subscribe to updates from {page.title}</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-[#DBEAFE] sm:text-base">Choose the channel and components you care about. Statura will notify you when incidents, maintenance windows, and resolutions are published.</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-xs font-bold text-[#047857]">● Operationally focused</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#1D4ED8]">{components.length} public components</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-lg">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#7A8799]">Status page</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-[#FFFFFF]">{page.logo_text}</span>
                    <div>
                      <p className="text-base font-semibold text-[#0B1220]">{page.title}</p>
                      <p className="text-xs font-medium text-[#7A8799]">/{page.slug}</p>
                    </div>
                  </div>
                  <Link href={`/status/${encodeURIComponent(page.slug)}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-5 py-2.5 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D8] hover:bg-[#F9FBFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
                    View live status
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <form onSubmit={handleSubmit} className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#0B1220] sm:text-xl">Notification details</h2>
                    <p className="mt-1 text-sm leading-6 text-[#526071]">Select a channel, enter the destination, then confirm the components you want to follow.</p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#1D4ED8]">Secure opt-in</span>
                </div>

                <fieldset className="mt-6">
                  <legend className="text-sm font-semibold text-[#0B1220]">Channel</legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {channels.map((option) => (
                      <button key={option} type="button" onClick={() => { setChannel(option); setSubmitError(""); }} className={`min-h-11 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${channel === option ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]" : "border-[#D8E0EE] bg-[#FFFFFF] text-[#0B1220] hover:bg-[#F9FBFF]"}`} aria-pressed={channel === option}>
                        {channelLabel(option)}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {channel !== "rss" ? (
                  <label className="mt-5 block">
                    <span className="text-sm font-semibold text-[#0B1220]">Destination</span>
                    <input value={destination} onChange={(event) => setDestination(event.target.value)} type={destinationType(channel)} placeholder={destinationPlaceholder(channel)} className="mt-2 min-h-11 w-full rounded-xl border border-[#D8E0EE] bg-[#FFFFFF] px-4 text-sm text-[#0B1220] shadow-sm outline-none transition-all duration-200 placeholder:text-[#7A8799] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:opacity-60" />
                  </label>
                ) : (
                  <div className="mt-5 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-[#0B1220]">
                    <p className="text-sm font-bold text-[#1D4ED8]">RSS does not require personal data</p>
                    <p className="mt-1 text-sm leading-6 text-[#526071]">Submit once to reveal the feed URL for this status page.</p>
                  </div>
                )}

                {submitError ? <div className="mt-5"><ErrorBanner message={submitError} onDismiss={() => setSubmitError("")} /></div> : null}

                {notice ? (
                  <div className={`mt-5 rounded-2xl border p-4 text-[#0B1220] shadow-sm ${notice.kind === "success" ? "border-[#A7F3D0] bg-[#ECFDF5]" : "border-[#BFDBFE] bg-[#EFF6FF]"}`}>
                    <p className={`text-sm font-bold ${notice.kind === "success" ? "text-[#047857]" : "text-[#1D4ED8]"}`}>{notice.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#526071]">{notice.body}</p>
                    {feedUrl && channel === "rss" ? <code className="mt-3 block overflow-x-auto rounded-xl border border-[#D8E0EE] bg-[#FFFFFF] px-3 py-2 text-xs font-semibold text-[#0B1220]">{feedUrl}</code> : null}
                  </div>
                ) : null}

                <button type="submit" disabled={submitting} className="mt-6 min-h-11 w-full rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
                  {submitting ? "Creating subscription…" : channel === "rss" ? "Show RSS feed" : "Subscribe"}
                </button>

                <p className="mt-4 text-center text-xs font-medium leading-5 text-[#7A8799]">Statura only uses your destination for operational notifications. You can manage or unsubscribe from every message.</p>
              </form>

              <aside className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#0B1220] sm:text-xl">Components to follow</h2>
                    <p className="mt-1 text-sm leading-6 text-[#526071]">Receive updates only for the surfaces that matter to your team.</p>
                  </div>
                  <button type="button" onClick={toggleAll} className="min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D8] hover:bg-[#F9FBFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
                    {allSelected ? "Clear" : "All"}
                  </button>
                </div>

                {components.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-6 text-center text-[#0B1220]">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF] text-2xl text-[#1D4ED8]">◎</div>
                    <p className="mt-3 text-sm font-bold text-[#0B1220]">All public updates</p>
                    <p className="mt-1 text-sm leading-6 text-[#526071]">No component list is published yet, so this subscription follows the whole page.</p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-5">
                    {groupedComponents.map(([groupName, rows]) => (
                      <div key={groupName}>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#7A8799]">{groupName}</p>
                        <div className="mt-2 space-y-2">
                          {rows.map((component) => (
                            <label key={component.id} className="flex cursor-pointer gap-3 rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-3 text-[#0B1220] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F9FBFF] hover:shadow-lg">
                              <input type="checkbox" checked={selectedIds.has(component.id)} onChange={() => toggleComponent(component.id)} className="mt-1 h-5 w-5 rounded border-[#D8E0EE] accent-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2" />
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="text-base font-semibold text-[#0B1220]">{component.name}</span>
                                  <span className={`inline-flex items-center ga