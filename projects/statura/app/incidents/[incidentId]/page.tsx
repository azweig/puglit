"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type JsonObject = Record<string, unknown>;

type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";
type IncidentImpact = "minor" | "major" | "critical" | "maintenance";

type StatusPageSummary = {
  title: string;
  slug: string;
  logo_text: string;
  timezone: string;
};

type AffectedComponent = {
  id: string;
  name: string;
  description: string;
  current_status: string;
};

type IncidentUpdate = {
  id: string;
  status: IncidentStatus;
  body: string;
  published_at: string;
  created_at: string;
};

type IncidentDetail = {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  impact: IncidentImpact;
  started_at: string;
  resolved_at: string;
  created_at: string;
  updated_at: string;
  status_page: StatusPageSummary | null;
  components: AffectedComponent[];
  updates: IncidentUpdate[];
};

type LoadState = "loading" | "ready" | "empty" | "error";
type TimeMode = "page" | "local";

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asId(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function normalizeArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isRecord(value)) {
    const items = value.items;
    if (Array.isArray(items)) return items;
    const rows = value.rows;
    if (Array.isArray(rows)) return rows;
    const data = value.data;
    if (Array.isArray(data)) return data;
  }
  return [];
}

function normalizeStatus(value: unknown): IncidentStatus {
  const raw = asString(value, "investigating");
  if (raw === "identified" || raw === "monitoring" || raw === "resolved") return raw;
  return "investigating";
}

function normalizeImpact(value: unknown): IncidentImpact {
  const raw = asString(value, "minor");
  if (raw === "major" || raw === "critical" || raw === "maintenance") return raw;
  return "minor";
}

function parseStatusPage(value: unknown): StatusPageSummary | null {
  if (!isRecord(value)) return null;
  return {
    title: asString(value.title, "Statura"),
    slug: asString(value.slug, ""),
    logo_text: asString(value.logo_text, asString(value.title, "S").slice(0, 1).toUpperCase()),
    timezone: asString(value.timezone, "UTC"),
  };
}

function parseComponent(value: unknown): AffectedComponent | null {
  if (!isRecord(value)) return null;
  const source = isRecord(value.component) ? value.component : value;
  const name = asString(source.name, "");
  if (!name) return null;
  return {
    id: asId(source.id, name),
    name,
    description: asString(source.description, "Public component"),
    current_status: asString(source.current_status, "operational"),
  };
}

function parseUpdate(value: unknown): IncidentUpdate | null {
  if (!isRecord(value)) return null;
  const body = asString(value.body, "");
  if (!body) return null;
  return {
    id: asId(value.id, `${asString(value.published_at, "update")}-${body.slice(0, 12)}`),
    status: normalizeStatus(value.status),
    body,
    published_at: asString(value.published_at, asString(value.created_at, "")),
    created_at: asString(value.created_at, ""),
  };
}

function parseIncidentPayload(payload: unknown): IncidentDetail | null {
  if (!isRecord(payload)) return null;
  const source = isRecord(payload.incident) ? payload.incident : payload;
  const title = asString(source.title, "");
  if (!title) return null;

  const updateCandidates = [payload.updates, payload.incident_updates, source.updates, source.incident_updates];
  const componentCandidates = [payload.components, payload.affected_components, source.components, source.affected_components, source.incident_components];

  const updates = updateCandidates
    .flatMap((candidate) => normalizeArray(candidate))
    .map(parseUpdate)
    .filter((update): update is IncidentUpdate => update !== null)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  const seenComponents = new Set<string>();
  const components = componentCandidates
    .flatMap((candidate) => normalizeArray(candidate))
    .map(parseComponent)
    .filter((component): component is AffectedComponent => component !== null)
    .filter((component) => {
      if (seenComponents.has(component.id)) return false;
      seenComponents.add(component.id);
      return true;
    });

  return {
    id: asId(source.id, asId(payload.id, "")),
    title,
    description: asString(source.description, "No public description has been published for this incident yet."),
    status: normalizeStatus(source.status),
    impact: normalizeImpact(source.impact),
    started_at: asString(source.started_at, ""),
    resolved_at: asString(source.resolved_at, ""),
    created_at: asString(source.created_at, ""),
    updated_at: asString(source.updated_at, ""),
    status_page: parseStatusPage(source.status_page) ?? parseStatusPage(payload.status_page),
    components,
    updates,
  };
}

function statusLabel(status: IncidentStatus): string {
  const labels: Record<IncidentStatus, string> = {
    investigating: "Investigating",
    identified: "Identified",
    monitoring: "Monitoring",
    resolved: "Resolved",
  };
  return labels[status];
}

function impactLabel(impact: IncidentImpact): string {
  const labels: Record<IncidentImpact, string> = {
    minor: "Minor impact",
    major: "Major impact",
    critical: "Critical impact",
    maintenance: "Maintenance",
  };
  return labels[impact];
}

function statusChipClass(status: IncidentStatus): string {
  if (status === "resolved") return "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]";
  if (status === "monitoring") return "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]";
  if (status === "identified") return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
  return "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
}

function impactChipClass(impact: IncidentImpact): string {
  if (impact === "critical") return "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
  if (impact === "major") return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
  if (impact === "maintenance") return "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]";
  return "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]";
}

function componentStatusClass(status: string): string {
  if (status === "major_outage" || status === "partial_outage" || status === "down") return "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
  if (status === "degraded_performance" || status === "degraded") return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
  if (status === "under_maintenance") return "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]";
  return "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]";
}

function readableComponentStatus(status: string): string {
  return status.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function safeDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value: string, timezone: string): string {
  const date = safeDate(value);
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
      timeZoneName: "short",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZoneName: "short" }).format(date);
  }
}

function formatDuration(start: string, end: string): string {
  const started = safeDate(start);
  if (!started) return "—";
  const finished = safeDate(end) ?? new Date();
  const totalMinutes = Math.max(1, Math.round((finished.getTime() - started.getTime()) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function initials(text: string): string {
  const letters = text.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return letters || "S";
}

function ErrorBanner({ message, onRetry, onDismiss }: { message: string; onRetry: () => void; onDismiss: () => void }) {
  return (
    <div className="mb-5 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-[#0B1220] shadow-sm" role="alert">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EF4444] text-sm font-extrabold text-[#FFFFFF]">!</div>
          <div>
            <p className="text-sm font-bold text-[#991B1B]">We couldn’t load this incident</p>
            <p className="mt-1 text-sm leading-6 text-[#7F1D1D]">{message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onRetry} className="min-h-11 rounded-full bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#991B1B] shadow-sm ring-1 ring-[#FECACA] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2">Retry</button>
          <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="min-h-11 rounded-full bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#526071] shadow-sm ring-1 ring-[#FECACA] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#0B1220] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2">Dismiss</button>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-[#D8E0EE] bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] p-5 shadow-xl sm:p-8">
        <div className="animate-pulse space-y-5">
          <div className="h-7 w-44 rounded-full bg-white/20" />
          <div className="h-10 w-full max-w-2xl rounded-2xl bg-white/20" />
          <div className="h-5 w-full max-w-xl rounded-full bg-white/15" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 rounded-2xl bg-white/90" />)}
          </div>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-5 shadow-sm sm:p-6">
          <div className="animate-pulse space-y-5">
            <div className="h-6 w-48 rounded-full bg-black/5" />
            {[0, 1, 2].map((item) => <div key={item} className="h-28 rounded-2xl bg-black/5" />)}
          </div>
        </div>
        <div className="space-y-4">
          {[0, 1].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] shadow-sm"><div className="m-5 h-5 w-32 rounded-full bg-black/5" /></div>)}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-[2rem] border border-[#D8E0EE] bg-[#FFFFFF] p-6 text-center text-[#0B1220] shadow-sm sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF] text-3xl" aria-hidden="true">🧭</div>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#0B1220] sm:text-3xl">Incident not found</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#526071] sm:text-base">This public incident may have been removed, archived, or the link is no longer valid.</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/history" className="min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">Back to incident history</Link>
        <Link href="/" className="min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-5 py-2.5 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D8] hover:bg-[#F9FBFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">View current status</Link>
      </div>
    </section>
  );
}

export default function IncidentDetailPage() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const [state, setState] = useState<LoadState>("loading");
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(true);
  const [timeMode, setTimeMode] = useState<TimeMode>("page");
  const [copied, setCopied] = useState(false);

  const fetchIncident = useCallback(async () => {
    if (!incidentId) {
      setState("empty");
      return;
    }
    setState((current) => (incident ? current : "loading"));
    setShowError(true);
    try {
      const response = await fetch(`/api/public/incidents/[incidentId]${encodeURIComponent(incidentId)}`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (response.status === 404) {
        setIncident(null);
        setState("empty");
        return;
      }
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      const data: unknown = await response.json();
      const parsed = parseIncidentPayload(data);
      if (!parsed) {
        setIncident(null);
        setState("empty");
        return;
      }
      setIncident(parsed);
      setState("ready");
      setErrorMessage("");
    } catch (error: any) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected network error");
      setState(incident ? "ready" : "error");
    }
  }, [incident, incidentId]);

  useEffect(() => {
    void fetchIncident();
  }, [fetchIncident]);

  const localTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const pageTimezone = incident?.status_page?.timezone || "UTC";
  const activeTimezone = timeMode === "page" ? pageTimezone : localTimezone;
  const statusSlug = incident?.status_page?.slug ?? "";
  const statusHref = statusSlug ? `/status/${statusSlug}` : "/";
  const historyHref = statusSlug ? `/status/${statusSlug}/history` : "/history";
  const pageTitle = incident?.status_page?.title || "Statura";
  const logoText = incident?.status_page?.logo_text || initials(pageTitle);

  async function copyIncidentLink(): Promise<void> {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#0B1220]">
      <header className="sticky top-0 z-40 border-b border-[#D8E0EE] bg-[#F6F8FC]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href={statusHref} className="flex min-h-11 items-center gap-3 rounded-full pr-3 transition-all duration-200 hover:bg-[#FFFFFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-[#FFFFFF]">{logoText.slice(0, 2).toUpperCase()}</span>
            <span className="hidden text-sm font-extrabold tracking-tight text-[#0B1220] sm:inline">{pageTitle}</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto" aria-label="Primary navigation">
            <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">Estado</Link>
            <Link href="/uptime" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">Uptime histórico</Link>
            <Link href="/history" className="rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8] transition-all duration-200 hover:bg-[#FFFFFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">Historial de incidentes</Link>
            <Link href="/api/public/status-pages/[slug]" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">RSS</Link>
          </nav>
          <Link href="/#subscribe" className="hidden min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:inline-flex sm:items-center">Subscribe</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {showError && errorMessage ? <ErrorBanner message={errorMessage} onRetry={fetchIncident} onDismiss={() => setShowError(false)} /> : null}
        {state === "loading" ? <LoadingState /> : null}
        {state === "error" ? <EmptyState /> : null}
        {state === "empty" ? <EmptyState /> : null}
        {state === "ready" && incident ? (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] shadow-xl">
              <div className="p-5 text-[#FFFFFF] sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusChipClass(incident.status)}`}>{statusLabel(incident.status)}</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${impactChipClass(incident.impact)}`}>{impactLabel(incident.impact)}</span>
                    </div>
                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#FFFFFF] sm:text-4xl">{incident.title}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#DBEAFE] sm:text-base">{incident.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <Link href={statusHref} className="min-h-11 rounded-full border border-white/20 bg-[#FFFFFF] px-5 py-2.5 text-center text-sm font-semibold text-[#0B1220] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D4ED8]">Volver al estado</Link>
                    <Link href={historyHref} className="min-h-11 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-center text-sm font-semibold text-[#FFFFFF] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D4ED8]">Ver historial</Link>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#7A8799]">Estado actual</p>
                    <p className="mt-2 text-base font-bold text-[#0B1220]">{statusLabel(incident.status)}</p>
                  </div>
                  <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#7A8799]">Duración</p>
                    <p className="mt-2 text-base font-bold text-[#0B1220]">{formatDuration(incident.started_at, incident.resolved_at)}</p>
                  </div>
                  <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#7A8799]">Inicio</p>
                    <p className="mt-2 text-sm font-bold leading-5 text-[#0B1220]">{formatDateTime(incident.started_at, activeTimezone)}</p>
                  </div>
                  <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#7A8799]">Resolución</p>
                    <p className="mt-2 text-sm font-bold leading-5 text-[#0B1220]">{incident.resolved_at ? formatDateTime(incident.resolved_at, activeTimezone) : "In progress"}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-3 rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#0B1220]">Timestamp timezone</p>
                <p className="text-xs font-medium text-[#7A8799]">Showing dates in {activeTimezone}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setTimeMode("page")} className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${timeMode === "page" ? "bg-[#EFF6FF] text-[#1D4ED8]" : "border border-[#D8E0EE] bg-[#FFFFFF] text-[#526071] hover:bg-[#F9FBFF] hover:text-[#0B1220]"}`}>Status page TZ</button>
                <button type="button" onClick={() => setTimeMode("local")} className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${timeMode === "local" ? "bg-[#EFF6FF] text-[#1D4ED8]" : "border border-[#D8E0EE] bg-[#FFFFFF] text-[#526071] hover:bg-[#F9FBFF] hover:text-[#0B1220]"}`}>My local TZ</button>
                <button type="button" onClick={copyIncidentLink} className="min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D8] hover:bg-[#F9FBFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">{copied ? "Copied" : "Copy link"}</button>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <section className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#0B1220] sm:text-xl">Incident updates</h2>
                    <p className="mt-1 text-sm leading-6 text-[#526071]">Chronological public communications from the response team.</p>
                  </div>
                  <span className="rounded-full bg-[#F9FBFF] px-3 py-1 text-xs font-bold text-[#526071] ring-1 ring-[#D8E0EE]">{incident.updates.length} updates</span>
                </div>
                {incident.updates.length > 0 ? (
                  <ol className="relative space-y-5 border-l border-[#D8E0EE] pl-5 sm:pl-6">
                    {incident.updates.map((update) => (
                      <li key={update.id} className="relative">
                        <span className="absolute -left-[31px] top-1 flex h-3.5 w-3.5 rounded-full border-2 border-[#FFFFFF] bg-[#2563EB] ring-4 ring-[#EFF6FF] sm:-left-[35px]" aria-hidden="true" />
                        <article className="rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4 text-[#0B1220] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusChipClass(update.status)}`}>{statusLabel(update.status)}</span>
                            <time className="text-xs font-medium text-[#7A8799]" dateTime={update.published_at}>{formatDateTime(update.published_at, activeTimezone)}</time>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#526071] sm:text-base">{update.body}</p>
                          <p className="mt-3 text-xs font-medium text-[#7A8799]">Published by Statura response team</p>
                        </article>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-6 text-center text-[#0B1220]">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF] text-2xl" aria-hidden="true">✦</div>
                    <h3 className="mt-4 text-base font-bold text-[#0B1220]">No timeline updates yet</h3>
                    <p className="mt-2 text-sm leading-6 text-[#526071]">The incident is public, but no detailed update has been published.</p>
                  </div>
                )}
              </section>

              <aside className="space-y-4">
                <section className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm sm:p-5">
                  <h2 className="text-lg font-bold text-[#0B1220]">Affected components</h2>
                  <div className="mt-4 space-y-3">
                    {incident.components.length > 0 ? incident.components.map((component) => (
                      <div key={component.id} className="rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4 text-[#0B1220]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-[#0B1220]">{component.name}</p>
                            <p className="mt-1 text-sm leading-5 text-[#526071]">{component.description}</p>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${componentStatusClass(component.current_status)}`}>{readableComponentStatus(component.current_status)}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4 text-sm leading-6 text-[#526071]">No affected components were attached to this public incident.</div>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm sm:p-5">
                  <h2 className="text-lg font-bold text-[#0B1220]">Incident summary</h2>
                  <dl className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 border-b border-[#D8E0EE] pb-3">
                      <dt className="text-sm font-medium text-[#526071]">Impact</dt>
                      <dd className="text-sm font-bold text-[#0B1220]">{impactLabel(incident.impact)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-[#D8E0EE] pb-3">
                      <dt className="text-sm font-medium text-[#526071]">Last updated</dt>
                      <dd className="text-right text-sm font-bold text-[#0B1220]">{formatDateTime(incident.updated_at || incident.created_at, activeTimezone)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-sm font-medium text-[#526071]">Status page</dt>
                      <dd className="text-sm font-bold