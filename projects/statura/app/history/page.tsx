"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const STATUS_PAGE_SLUG = "statura";

type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";
type IncidentImpact = "minor" | "major" | "critical" | "maintenance";

interface ComponentSummary {
  id: string;
  name: string;
  current_status: string;
}

interface IncidentUpdate {
  id: string;
  status: IncidentStatus;
  body: string;
  published_at: string;
}

interface PublicIncident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  impact: IncidentImpact;
  started_at: string;
  resolved_at: string | null;
  components: ComponentSummary[];
  updates: IncidentUpdate[];
}

interface DayGroup {
  day_key: string;
  incidents: PublicIncident[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string, fallback = ""): string {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
}

function readId(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function normalizeStatus(value: string): IncidentStatus {
  if (value === "investigating" || value === "identified" || value === "monitoring" || value === "resolved") {
    return value;
  }
  return "resolved";
}

function normalizeImpact(value: string): IncidentImpact {
  if (value === "minor" || value === "major" || value === "critical" || value === "maintenance") {
    return value;
  }
  return "minor";
}

function flattenIncidentCandidates(values: unknown[]): unknown[] {
  const result: unknown[] = [];

  for (const value of values) {
    if (isRecord(value)) {
      const incidents = value.incidents;
      const days = value.days;
      if (Array.isArray(incidents)) {
        result.push(...flattenIncidentCandidates(incidents));
        continue;
      }
      if (Array.isArray(days)) {
        result.push(...flattenIncidentCandidates(days));
        continue;
      }
    }
    result.push(value);
  }

  return result;
}

function incidentCandidatesFromResponse(data: unknown): unknown[] {
  if (Array.isArray(data)) return flattenIncidentCandidates(data);

  if (isRecord(data)) {
    const preferredKeys = ["items", "rows", "incidents", "data", "days"];
    for (const key of preferredKeys) {
      const value = data[key];
      if (Array.isArray(value)) return flattenIncidentCandidates(value);
    }
  }

  return [];
}

function componentFromUnknown(value: unknown): ComponentSummary | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return { id: value, name: value, current_status: "unknown" };
  }

  if (!isRecord(value)) return null;

  const nestedComponent = isRecord(value.component) ? value.component : null;
  const id = readId(value, "id") || (nestedComponent ? readId(nestedComponent, "id") : "");
  const name = readString(value, "name") || (nestedComponent ? readString(nestedComponent, "name") : "");
  const currentStatus = readString(value, "current_status") || (nestedComponent ? readString(nestedComponent, "current_status") : "unknown");

  if (!name) return null;

  return {
    id: id || name,
    name,
    current_status: currentStatus || "unknown",
  };
}

function updateFromUnknown(value: unknown, fallbackIndex: number): IncidentUpdate | null {
  if (!isRecord(value)) return null;

  const body = readString(value, "body") || readString(value, "message") || readString(value, "description");
  const publishedAt = readString(value, "published_at") || readString(value, "created_at") || readString(value, "updated_at");
  if (!body || !publishedAt) return null;

  return {
    id: readId(value, "id") || `${publishedAt}-${fallbackIndex}`,
    status: normalizeStatus(readString(value, "status")),
    body,
    published_at: publishedAt,
  };
}

function incidentFromUnknown(value: unknown, fallbackIndex: number): PublicIncident | null {
  if (!isRecord(value)) return null;

  const title = readString(value, "title");
  const startedAt = readString(value, "started_at") || readString(value, "created_at");
  if (!title || !startedAt) return null;

  const componentSources = [value.components, value.affected_components, value.incident_components];
  const components = componentSources
    .flatMap((source) => (Array.isArray(source) ? source : []))
    .map(componentFromUnknown)
    .filter((component): component is ComponentSummary => component !== null);

  const updateSources = [value.updates, value.incident_updates, value.timeline];
  const updates = updateSources
    .flatMap((source) => (Array.isArray(source) ? source : []))
    .map((update, index) => updateFromUnknown(update, index))
    .filter((update): update is IncidentUpdate => update !== null)
    .sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());

  const description = readString(value, "description");
  const fallbackUpdate: IncidentUpdate = {
    id: `${startedAt}-summary`,
    status: normalizeStatus(readString(value, "status")),
    body: description || "Public status update recorded for this incident.",
    published_at: startedAt,
  };

  return {
    id: readId(value, "id") || `${startedAt}-${fallbackIndex}`,
    title,
    description,
    status: normalizeStatus(readString(value, "status")),
    impact: normalizeImpact(readString(value, "impact")),
    started_at: startedAt,
    resolved_at: readString(value, "resolved_at") || null,
    components,
    updates: updates.length > 0 ? updates : [fallbackUpdate],
  };
}

function currentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function shiftMonth(monthKey: string, delta: number): string {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const date = new Date(year, monthIndex + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateKeyFromTimestamp(timestamp: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(timestamp)) return timestamp.slice(0, 10);
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysForMonth(monthKey: string): string[] {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const todayKey = currentMonthKey();
  const today = new Date();
  const limit = monthKey === todayKey ? Math.min(lastDay, today.getDate()) : lastDay;

  return Array.from({ length: limit }, (_, index) => `${monthKey}-${String(index + 1).padStart(2, "0")}`).reverse();
}

function groupIncidentsByDay(incidents: PublicIncident[], monthKey: string): DayGroup[] {
  const grouped = new Map<string, PublicIncident[]>();

  for (const incident of incidents) {
    const key = dateKeyFromTimestamp(incident.started_at);
    if (!key.startsWith(monthKey)) continue;
    const current = grouped.get(key) ?? [];
    current.push(incident);
    grouped.set(key, current);
  }

  return daysForMonth(monthKey).map((dayKey) => ({
    day_key: dayKey,
    incidents: (grouped.get(dayKey) ?? []).sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()),
  }));
}

function formatMonth(monthKey: string): string {
  const [yearText, monthText] = monthKey.split("-");
  const date = new Date(Number(yearText), Number(monthText) - 1, 1);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

function formatDay(dayKey: string): string {
  const [yearText, monthText, dayText] = dayKey.split("-");
  const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(date);
}

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function durationLabel(startedAt: string, resolvedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "Duration unavailable";

  const totalMinutes = Math.max(1, Math.round((end - start) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
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
    minor: "Minor",
    major: "Major",
    critical: "Critical",
    maintenance: "Maintenance",
  };
  return labels[impact];
}

function impactChipClass(impact: IncidentImpact): string {
  if (impact === "critical") return "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
  if (impact === "major") return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
  if (impact === "maintenance") return "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]";
  return "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]";
}

function statusChipClass(status: IncidentStatus): string {
  if (status === "resolved") return "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]";
  if (status === "monitoring") return "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]";
  return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
}

function LoadingSkeleton(): JSX.Element {
  return (
    <div className="space-y-6" aria-label="Loading incident history">
      <section className="rounded-[2rem] bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] p-5 shadow-xl sm:p-8">
        <div className="animate-pulse space-y-5">
          <div className="h-7 w-40 rounded-full bg-white/20" />
          <div className="h-11 w-full max-w-xl rounded-2xl bg-white/20" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-2xl bg-white" />
            <div className="h-24 rounded-2xl bg-white" />
            <div className="h-24 rounded-2xl bg-white" />
          </div>
        </div>
      </section>
      <div className="grid gap-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 shadow-sm sm:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-44 rounded bg-black/5" />
              <div className="h-24 rounded-xl bg-black/5" />
              <div className="h-16 rounded-xl bg-black/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ monthLabel }: { monthLabel: string }): JSX.Element {
  return (
    <section className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-6 text-center text-[#0B1220] shadow-sm sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#A7F3D0] bg-[#ECFDF5] text-3xl" aria-hidden="true">
        ✓
      </div>
      <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-[#0B1220]">No incidents reported</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#526071] sm:text-base">
        System history is clean for {monthLabel}. Every public component stayed quiet during this period.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-95"
        >
          View current status
        </Link>
        <Link
          href="/#subscribe"
          className="min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-5 py-2.5 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D8] hover:bg-[#F9FBFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-95"
        >
          Subscribe to updates
        </Link>
      </div>
    </section>
  );
}

function ErrorBanner({ message, onRetry, onDismiss }: { message: string; onRetry: () => void; onDismiss: () => void }): JSX.Element {
  return (
    <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-[#0B1220] shadow-sm" role="alert">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#B91C1C]">We couldn’t load incident history.</p>
          <p className="mt-1 text-sm leading-6 text-[#7F1D1D]">{message}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-full bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#B91C1C] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2 active:scale-95"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="min-h-11 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-4 py-2 text-sm font-semibold text-[#7F1D1D] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFFFFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2 active:scale-95"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function IncidentCard({ incident, expanded, onToggle }: { incident: PublicIncident; expanded: boolean; onToggle: () => void }): JSX.Element {
  const updatesToShow = expanded ? incident.updates : incident.updates.slice(-2);
  const affected = incident.components.length > 0 ? incident.components : [{ id: "all", name: "Public components", current_status: "not specified" }];

  return (
    <article className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${impactChipClass(incident.impact)}`}>
              {impactLabel(incident.impact)} impact
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusChipClass(incident.status)}`}>
              {statusLabel(incident.status)}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold text-[#0B1220] sm:text-lg">{incident.title}</h3>
          {incident.description ? <p className="mt-2 text-sm leading-6 text-[#526071]">{incident.description}</p> : null}
        </div>
        <div className="rounded-xl border border-[#D8E0EE] bg-[#F9FBFF] px-3 py-2 text-left sm:min-w-40 sm:text-right">
          <p className="text-xs font-medium text-[#7A8799]">Duration</p>
          <p className="mt-1 text-sm font-bold text-[#0B1220]">{durationLabel(incident.started_at, incident.resolved_at)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.4fr]">
        <div className="rounded-xl border border-[#D8E0EE] bg-[#F9FBFF] p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A8799]">Affected components</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {affected.map((component) => (
              <span key={component.id} className="inline-flex items-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#1D4ED8]">
                {component.name}
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="font-medium text-[#7A8799]">Started</p>
              <p className="mt-1 font-semibold text-[#0B1220]">{formatDateTime(incident.started_at)}</p>
            </div>
            <div>
              <p className="font-medium text-[#7A8799]">Resolved</p>
              <p className="mt-1 font-semibold text-[#0B1220]">{incident.resolved_at ? formatDateTime(incident.resolved_at) : "Still active"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#D8E0EE] bg-[#FFFFFF] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7A8799]">Summary timeline</p>
            {incident.updates.length > 2 ? (
              <button
                type="button"
                onClick={onToggle}
                className="min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-3 py-2 text-xs font-bold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D8] hover:bg-[#F9FBFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-95"
              >
                {expanded ? "Show less" : `Show all ${incident.updates.length}`}
              </button>
            ) : null}
          </div>
          <ol className="mt-3 space-y-3 border-l border-[#D8E0EE] pl-4">
            {updatesToShow.map((update) => (
              <li key={update.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#FFFFFF] bg-[#2563EB] shadow-sm" aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-[#1D4ED8]">{statusLabel(update.status)}</span>
                  <span className="text-xs font-medium text-[#7A8799]">{formatDateTime(update.published_at)}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[#526071]">{update.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}

export default function IncidentHistoryPage(): JSX.Element {
  const [monthKey, setMonthKey] = useState<string>(currentMonthKey());
  const [incidents, setIncidents] = useState<PublicIncident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorVisible, setErrorVisible] = useState<boolean>(true);
  const [expandedIncidents, setExpandedIncidents] = useState<Set<string>>(() => new Set<string>());

  const fetchIncidents = useCallback(async (selectedMonth: string, signal?: AbortSignal): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setErrorVisible(true);

    try {
      const response = await fetch(`/api/public/status-pages/[slug]${STATUS_PAGE_SLUG}/incidents?month=${encodeURIComponent(selectedMonth)}`, {
        method: "GET",
        signal,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`The status API returned ${response.status}.`);
      }

      const data: unknown = await response.json();
      const normalized = incidentCandidatesFromResponse(data)
        .map((incident, index) => incidentFromUnknown(incident, index))
        .filter((incident): incident is PublicIncident => incident !== null);

      setIncidents(normalized);
    } catch (fetchError: any) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
      setError(fetchError instanceof Error ? fetchError.message : "Unexpected network error.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchIncidents(monthKey, controller.signal);
    return () => controller.abort();
  }, [fetchIncidents, monthKey]);

  const monthLabel = useMemo(() => formatMonth(monthKey), [monthKey]);
  const dayGroups = useMemo(() => groupIncidentsByDay(incidents, monthKey), [incidents, monthKey]);
  const totalIncidents = incidents.filter((incident) => dateKeyFromTimestamp(incident.started_at).startsWith(monthKey)).length;
  const resolvedIncidents = incidents.filter((incident) => incident.status === "resolved" && dateKeyFromTimestamp(incident.started_at).startsWith(monthKey)).length;
  const majorIncidents = incidents.filter((incident) => (incident.impact === "major" || incident.impact === "critical") && dateKeyFromTimestamp(incident.started_at).startsWith(monthKey)).length;
  const quietDays = dayGroups.filter((group) => group.incidents.length === 0).length;
  const hasCachedContent = incidents.length > 0;

  const toggleIncident = (incidentId: string): void => {
    setExpandedIncidents((current) => {
      const next = new Set(current);
      if (next.has(incidentId)) next.delete(incidentId);
      else next.add(incidentId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#0B1220]">
      <header className="sticky top-0 z-40 border-b border-[#D8E0EE] bg-[#F6F8FC]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-[#FFFFFF]">S</span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold tracking-tight text-[#0B1220]">Statura</span>
                <span className="block text-xs font-medium text-[#7A8799]">Public status</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-xs font-bold text-[#047857] sm:inline-flex">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" aria-hidden="true" />
                History available
              </span>
              <Link
                href="/#subscribe"
                className="min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-95"
              >
                Subscribe
              </Link>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Status navigation">
            <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
              Estado
            </Link>
            <Link href="/uptime" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
              Uptime histórico
            </Link>
            <Link href="/history" className="rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
              Historial de incidentes
            </Link>
            <Link href={`/api/public/status-pages/[slug]${STATUS_PAGE_SLUG}/rss`} className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
              RSS
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {isLoading && !hasCachedContent ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] p-5 text-[#FFFFFF] shadow-xl sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#DBEAFE]">
                    Incident History
                  </span>
                  <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#FFFFFF] sm:text-4xl">Operational record for {monthLabel}</h1>
                  <p className="mt-3 text-sm leading-6 text-[#DBEAFE] sm:text-base">
                    A public, day-by-day record of incidents, final states, affected components, and the summarized timeline customers need to trust the system.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 text-[#FFFFFF] backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#DBEAFE]">Month navigation</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMonthKey((current) => shiftMonth(current, -1))}
                      className="min-h-11 rounded-full border border-white/20 bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F9FBFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D4ED8] active:scale-95"
                    >
                      Previous
                    </button>
                    <label className="sr-only" htmlFor="incident-month">Select month</label>
                    <input
                      id="incident-month"
                      type="month"
                      value={monthKey}
                      max={currentMonthKey()}
                      onChange={(event) => setMonthKey(event.target.value || currentMonthKey())}
                      className="min-h-11 rounded-full border border-white/20 bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#0B1220] shadow-sm outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D4ED8]"
                    />
                    <button
                      type="button"
                      onClick={() => setMonthKey((current) => shiftMonth(current, 1))}
                      disabled={monthKey >= currentMonthKey()}
                      className="min-h-11 rounded-full border border-white/20 bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F9FBFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFFFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D4ED8] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm">
                  <p className="text-xs font-medium text-[#7A8799]">Incidents</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1220]">{totalIncidents}</p>
                  <p className="mt-1 text-xs font-medium text-[#526071]">Recorded this month</p>
                </div>
                <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm">
                  <p className="text-xs font-medium text-[#7A8799]">Resolved</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1220]">{resolvedIncidents}</p>
                  <p className="mt-1 text-xs font-medium text-[#526071]">Closed this month</p>
                </div>
                <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm">
                  <p className="text-xs font-medium text-[#7A8799]">Major impact</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1220]">{majorIncidents}</p>
                  <p className="mt-1 text-xs font-medium text-[#526071]">Major or critical incidents</p>
                </div>
                <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 text-[#0B1220] shadow-sm">
                  <p className="text-xs font-medium text-[#7A8799]">Quiet days</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1220]">{quietDays}</p>
                  <p className="mt-1 text-xs font-medium text-[#526071]">Days without incidents</p>
                </div>
              </div>
            </section>

            {error && errorVisible ? (
              <ErrorBanner message={error} onRetry={() => void fetchIncidents(monthKey)} onDismiss={() => setErrorVisible(false)} />
            ) : null}

            {totalIncidents === 0 ? (
              <EmptyState monthLabel={monthLabel} />
            ) : (
              <div className="space-y-6">
                {dayGroups.map((group) => (
                  <section key={group.day_key} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-[#526071]">{formatDay(group.day_key)}</h2>
                      <span className="rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-3 py-1 text-xs font-semibold text-[#7A8799]">
                        {group.incidents.length} {group.incidents.length === 1 ? "incident" : "incidents"}
                      </span>
                    </div>

                    {group.incidents.length > 0 ? (
                      <div className="grid gap-4">
                        {group.incidents.map((incident) => (
                          <IncidentCard
                            key={incident.id}
                            incident={incident}
                            expanded={expandedIncidents.has(incident.id)}
                            onToggle={() => toggleIncident(incident.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#D8E0EE] bg-[#FFFFFF] p-4 text-sm text-[#7A8799] shadow-sm">
                        No public incidents recorded.
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
"}