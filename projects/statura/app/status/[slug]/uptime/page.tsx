"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type JsonObject = Record<string, unknown>;

type UptimeStatus =
  | "operational"
  | "degraded_performance"
  | "partial_outage"
  | "major_outage"
  | "under_maintenance"
  | "degraded"
  | "down"
  | "unknown"
  | "no_data";

type StatusPage = {
  id: string;
  title: string;
  slug: string;
  logo_text: string;
  timezone: string;
  updated_at: string;
};

type UptimeDay = {
  day: string;
  uptime_percentage: number;
  status: UptimeStatus;
  checks_count: number;
  down_minutes: number;
};

type UptimeComponent = {
  id: string;
  name: string;
  description: string;
  current_status: UptimeStatus;
  group_name: string;
  uptime_days: UptimeDay[];
  avg_response_time_ms: number;
};

type UptimePayload = {
  status_page: StatusPage;
  components: UptimeComponent[];
  summary: {
    overall_uptime: number;
    incidents_count: number;
    avg_response_time_ms: number;
  };
};

type LoadState = "loading" | "ready" | "error";

const DAY_COUNT = 90;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];
  const items = value.items;
  const rows = value.rows;
  const data = value.data;
  const components = value.components;
  if (Array.isArray(items)) return items;
  if (Array.isArray(rows)) return rows;
  if (Array.isArray(components)) return components;
  if (Array.isArray(data)) return data;
  return [];
}

function getNestedRecord(source: JsonObject, key: string): JsonObject | null {
  const value = source[key];
  return isRecord(value) ? value : null;
}

function getNestedArray(source: JsonObject, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function parseStatus(value: unknown): UptimeStatus {
  const status = asString(value, "unknown");
  if (
    status === "operational" ||
    status === "degraded_performance" ||
    status === "partial_outage" ||
    status === "major_outage" ||
    status === "under_maintenance" ||
    status === "degraded" ||
    status === "down" ||
    status === "no_data" ||
    status === "unknown"
  ) {
    return status;
  }
  return "unknown";
}

function parseStatusPage(data: unknown, slug: string): StatusPage {
  const root = isRecord(data) ? data : {};
  const nested = getNestedRecord(root, "status_page") ?? getNestedRecord(root, "page") ?? root;
  return {
    id: asString(nested.id, ""),
    title: asString(nested.title, "Statura"),
    slug: asString(nested.slug, slug),
    logo_text: asString(nested.logo_text, asString(nested.title, "S").slice(0, 2).toUpperCase()),
    timezone: asString(nested.timezone, "UTC"),
    updated_at: asString(nested.updated_at, new Date().toISOString()),
  };
}

function parseUptimeDay(value: unknown): UptimeDay | null {
  if (!isRecord(value)) return null;
  const day = asString(value.day);
  if (!day) return null;
  return {
    day: day.slice(0, 10),
    uptime_percentage: Math.max(0, Math.min(100, asNumber(value.uptime_percentage, 100))),
    status: parseStatus(value.status),
    checks_count: Math.max(0, Math.round(asNumber(value.checks_count, 0))),
    down_minutes: Math.max(0, Math.round(asNumber(value.down_minutes, 0))),
  };
}

function parseComponent(value: unknown): UptimeComponent | null {
  if (!isRecord(value)) return null;
  const componentRecord = getNestedRecord(value, "component") ?? value;
  const name = asString(componentRecord.name);
  if (!name) return null;
  const groupRecord = getNestedRecord(value, "group") ?? getNestedRecord(componentRecord, "group");
  const rawDays = getNestedArray(componentRecord, ["uptime_days", "days", "daily_uptime", "history"]);
  const fallbackDays = getNestedArray(value, ["uptime_days", "days", "daily_uptime", "history"]);
  const uptime_days = (rawDays.length > 0 ? rawDays : fallbackDays)
    .map(parseUptimeDay)
    .filter((day): day is UptimeDay => day !== null);

  return {
    id: asString(componentRecord.id, name),
    name,
    description: asString(componentRecord.description),
    current_status: parseStatus(componentRecord.current_status ?? value.current_status),
    group_name: asString(value.group_name, asString(groupRecord?.name, "Core services")),
    uptime_days,
    avg_response_time_ms: Math.max(
      0,
      Math.round(asNumber(value.avg_response_time_ms ?? componentRecord.avg_response_time_ms, 0)),
    ),
  };
}

function parsePayload(data: unknown, slug: string): UptimePayload {
  const root = isRecord(data) ? data : {};
  const componentSource = normalizeArray(data).length > 0 ? normalizeArray(data) : normalizeArray(root.components);
  const components = componentSource
    .map(parseComponent)
    .filter((component): component is UptimeComponent => component !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  const allDays = components.flatMap((component) => component.uptime_days).filter((day) => day.status !== "no_data");
  const calculatedUptime =
    allDays.length > 0
      ? allDays.reduce((sum, day) => sum + day.uptime_percentage, 0) / allDays.length
      : 100;
  const calculatedIncidents = allDays.filter(
    (day) => day.status === "partial_outage" || day.status === "major_outage" || day.status === "down",
  ).length;
  const responseSamples = components.filter((component) => component.avg_response_time_ms > 0);
  const calculatedResponse =
    responseSamples.length > 0
      ? responseSamples.reduce((sum, component) => sum + component.avg_response_time_ms, 0) / responseSamples.length
      : 0;

  const summaryRecord = getNestedRecord(root, "summary") ?? root;

  return {
    status_page: parseStatusPage(data, slug),
    components,
    summary: {
      overall_uptime: asNumber(summaryRecord.overall_uptime, calculatedUptime),
      incidents_count: Math.round(asNumber(summaryRecord.incidents_count, calculatedIncidents)),
      avg_response_time_ms: Math.round(asNumber(summaryRecord.avg_response_time_ms, calculatedResponse)),
    },
  };
}

function formatDateTime(value: string, timezone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone || "UTC",
  }).format(date);
}

function formatDayLabel(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildDateRange(offsetDays: number): string[] {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - offsetDays);
  return Array.from({ length: DAY_COUNT }, (_, index) => {
    const day = new Date(end);
    day.setUTCDate(end.getUTCDate() - (DAY_COUNT - 1 - index));
    return getDateKey(day);
  });
}

function statusCopy(status: UptimeStatus): { label: string; className: string; dot: string } {
  if (status === "operational") {
    return {
      label: "Operational",
      className: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
      dot: "bg-[#10B981]",
    };
  }
  if (status === "degraded" || status === "degraded_performance") {
    return {
      label: "Degraded",
      className: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
      dot: "bg-[#F59E0B]",
    };
  }
  if (status === "under_maintenance") {
    return {
      label: "Maintenance",
      className: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
      dot: "bg-[#2563EB]",
    };
  }
  if (status === "no_data" || status === "unknown") {
    return {
      label: "No data",
      className: "bg-[#F9FBFF] text-[#526071] border-[#D8E0EE]",
      dot: "bg-[#7A8799]",
    };
  }
  return {
    label: "Outage",
    className: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
    dot: "bg-[#EF4444]",
  };
}

function dayColor(status: UptimeStatus, uptime: number): string {
  if (status === "no_data" || status === "unknown") return "bg-[#D8E0EE] hover:bg-[#B8C4D8]";
  if (status === "under_maintenance") return "bg-[#2563EB] hover:bg-[#1D4ED8]";
  if (status === "major_outage" || status === "partial_outage" || status === "down" || uptime < 98) {
    return "bg-[#EF4444] hover:bg-[#DC2626]";
  }
  if (status === "degraded" || status === "degraded_performance" || uptime < 99.9) {
    return "bg-[#F59E0B] hover:bg-[#D97706]";
  }
  return "bg-[#10B981] hover:bg-[#059669]";
}

function componentUptime(component: UptimeComponent, dates: string[]): number {
  const byDay = new Map(component.uptime_days.map((day) => [day.day, day]));
  const samples = dates.map((date) => byDay.get(date)).filter((day): day is UptimeDay => Boolean(day));
  if (samples.length === 0) return 100;
  return samples.reduce((sum, day) => sum + day.uptime_percentage, 0) / samples.length;
}

function globalStatus(components: UptimeComponent[]): UptimeStatus {
  if (components.some((component) => component.current_status === "major_outage" || component.current_status === "down")) {
    return "major_outage";
  }
  if (components.some((component) => component.current_status === "partial_outage")) return "partial_outage";
  if (components.some((component) => component.current_status === "degraded" || component.current_status === "degraded_performance")) {
    return "degraded_performance";
  }
  if (components.some((component) => component.current_status === "under_maintenance")) return "under_maintenance";
  return "operational";
}

function groupComponents(components: UptimeComponent[]): Array<{ name: string; components: UptimeComponent[] }> {
  const groups = new Map<string, UptimeComponent[]>();
  for (const component of components) {
    const name = component.group_name || "Core services";
    groups.set(name, [...(groups.get(name) ?? []), component]);
  }
  return Array.from(groups.entries()).map(([name, groupedComponents]) => ({ name, components: groupedComponents }));
}

function ErrorBanner({ message, onRetry, onDismiss }: { message: string; onRetry: () => void; onDismiss: () => void }) {
  return (
    <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-[#0B1220] shadow-sm" role="alert">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EF4444] text-sm font-extrabold text-[#FFFFFF]">
            !
          </div>
          <div>
            <p className="text-sm font-bold text-[#B91C1C]">We couldn’t load this status page uptime.</p>
            <p className="mt-1 text-sm leading-6 text-[#526071]">{message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-full bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#B91C1C] shadow-sm ring-1 ring-[#FECACA] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="min-h-11 rounded-full bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#0B1220] shadow-sm ring-1 ring-[#FECACA] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ statusPage, slug, components }: { statusPage: StatusPage | null; slug: string; components: UptimeComponent[] }) {
  const status = statusCopy(components.length > 0 ? globalStatus(components) : "unknown");
  const title = statusPage?.title ?? "Statura";
  const logo = (statusPage?.logo_text || title.slice(0, 2)).slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-[#D8E0EE] bg-[#F6F8FC]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-full pr-3 transition-all duration-200 hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-[#FFFFFF] shadow-sm">
              {logo}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold tracking-tight text-[#0B1220]">{title}</span>
              <span className="block text-xs font-medium text-[#7A8799]">Public status</span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}>
              <span className={`h-2 w-2 rounded-full ${status.dot}`} aria-hidden="true" />
              {status.label}
            </span>
            <Link
              href="/#subscribe"
              className="min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
            >
              Subscribe
            </Link>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Primary navigation">
          <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            Estado
          </Link>
          <Link href="/uptime" className="rounded-full bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8] transition-all duration-200 hover:bg-[#DBEAFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            Uptime histórico
          </Link>
          <Link href="/history" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            Historial de incidentes
          </Link>
          <Link href="/api/public/status-pages/[slug]" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
            RSS
          </Link>
          <Link href="/#subscribe" className="rounded-full px-4 py-2 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#FFFFFF] hover:text-[#0B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 md:hidden">
            Subscribe to updates
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Tabs({ slug }: { slug: string }) {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-full border border-[#D8E0EE] bg-[#FFFFFF] p-1 shadow-sm" aria-label="Status page sections">
      <Link href={`/status/${slug}`} className="min-h-11 rounded-full px-4 py-2.5 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#F9FBFF] hover:text-[#0B1220] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
        Overview
      </Link>
      <Link href={`/status/${slug}/uptime`} className="min-h-11 rounded-full bg-[#EFF6FF] px-4 py-2.5 text-sm font-semibold text-[#1D4ED8] transition-all duration-200 hover:bg-[#DBEAFE] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
        Uptime
      </Link>
      <Link href={`/status/${slug}/history`} className="min-h-11 rounded-full px-4 py-2.5 text-sm font-semibold text-[#526071] transition-all duration-200 hover:bg-[#F9FBFF] hover:text-[#0B1220] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
        History
      </Link>
    </nav>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0F172A] p-5 shadow-xl sm:p-8">
        <div className="animate-pulse space-y-5">
          <div className="h-6 w-40 rounded-full bg-[#FFFFFF]/20" />
          <div className="h-10 w-3/4 rounded-2xl bg-[#FFFFFF]/20 sm:w-1/2" />
          <div className="h-5 w-full max-w-xl rounded-full bg-[#FFFFFF]/15" />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-2xl bg-[#FFFFFF]/15" />
            <div className="h-24 rounded-2xl bg-[#FFFFFF]/15" />
            <div className="h-24 rounded-2xl bg-[#FFFFFF]/15" />
          </div>
        </div>
      </section>
      <div className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-4 shadow-sm sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-48 rounded-xl bg-black/5" />
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex gap-4 rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-4">
              <div className="h-14 w-44 shrink-0 rounded-xl bg-black/5" />
              <div className="grid flex-1 grid-cols-12 gap-1">
                {Array.from({ length: 36 }, (_, barIndex) => (
                  <div key={barIndex} className="h-9 rounded-md bg-black/5" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ slug }: { slug: string }) {
  return (
    <section className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-6 text-center text-[#0B1220] shadow-sm sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF] text-3xl" aria-hidden="true">
        ◷
      </div>
      <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-[#0B1220]">No historical checks recorded for this page yet</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#526071]">
        Once public monitors start reporting, Statura will build a calm 90-day uptime matrix for every visible service.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href={`/status/${slug}`} className="min-h-11 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
          Back to status overview
        </Link>
        <Link href="/#subscribe" className="min-h-11 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-5 py-2.5 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D8] hover:bg-[#F9FBFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2">
          Subscribe to updates
        </Link>
      </div>
    </section>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#FFFFFF] p-4 text-[#0B1220] shadow-lg sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-[#7A8799]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1220]">{value}</p>
      <p className="mt-1 text-sm leading-6 text-[#526071]">{hint}</p>
    </div>
  );
}

function PeriodControls({ offsetDays, onChange }: { offsetDays: number; onChange: (nextOffset: number) => void }) {
  const options = [
    { label: "Current 90 days", value: 0 },
    { label: "Previous 90", value: 90 },
    { label: "180 days ago", value: 180 },
    { label: "One year ago", value: 365 },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2 overflow-x-auto">
        {options.map((option) => {
          const active = option.value === offsetDays;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`min-h-11 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${
                active
                  ? "bg-[#EFF6FF] text-[#1D4ED8]"
                  : "bg-[#FFFFFF] text-[#526071] hover:bg-[#F9FBFF] hover:text-[#0B1220]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(offsetDays + DAY_COUNT)}
          className="min-h-11 flex-1 rounded-full border border-[#D8E0EE] bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#0B1220] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D8] hover:bg-[#F9FBFF] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:flex-none"
        >
          Earlier
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.max(0, offsetDays - DAY_COUNT))}
          disabled={offsetDays === 0}
          className="min-h-11 flex-1 rounded-full bg-[#2563EB] px-4 py-2 text-sm font-semibold text-[#FFFFFF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 sm:flex-none"
        >
          Newer
        </button>
      </div>
    </div>
  );
}

function UptimeMatrix({ components, dates }: { components: UptimeComponent[]; dates: string[] }) {
  const groups = groupComponents(components);
  const firstDate = dates[0] ?? "";
  const lastDate = dates[dates.length - 1] ?? "";

  return (
    <section className="rounded-2xl border border-[#D8E0EE] bg-[#FFFFFF] text-[#0B1220] shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#D8E0EE] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-[#0B1220] sm:text-xl">Service-by-service uptime</h2>
          <p className="mt-1 text-sm leading-6 text-[#526071]">
            {formatDayLabel(firstDate)} — {formatDayLabel(lastDate)} · 90 daily checks, oldest to newest.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-[#047857]"><span className="h-2 w-2 rounded-full bg-[#10B981]" />Operational</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1 text-[#B45309]"><span className="h-2 w-2 rounded-full bg-[#F59E0B]" />Degraded</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 py-1 text-[#B91C1C]"><span className="h-2 w-2 rounded-full bg-[#EF4444]" />Outage</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[980px] p-4 sm:p-6">
          <div className="mb-3 flex items-center gap-3 pl-[232px] text-xs font-medium text-[#7A8799]">
            <span className="w-24">{formatDayLabel(firstDate)}</span>
            <span className="flex-1 text-center">Daily uptime bars</span>
            <span className="w-24 text-right">{formatDayLabel(lastDate)}</span>
          </div>
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.name} className="space-y-3">
                <h3 className="sticky left-0 z-10 w-fit rounded-full border border-[#D8E0EE] bg-[#F9FBFF] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#526071]">
                  {group.name}
                </h3>
                <div className="space-y-2">
                  {group.components.map((component) => {
                    const byDay = new Map(component.uptime_days.map((day) => [day.day, day]));
                    const uptime = componentUptime(component, dates);
                    const status = statusCopy(component.current_status);
                    return (
                      <div key={component.id} className="group flex items-center gap-3 rounded-2xl border border-[#D8E0EE] bg-[#F9FBFF] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFFFFF] hover:shadow-lg">
                        <div className="sticky left-0 z-20 w-[220px] shrink-0 rounded-xl bg-[#FFFFFF] p-3 text-[#0B1220] shadow-sm ring-1 ring-[#D8E0EE]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-[#0B1220]">{component.name}</p>
                              <p className="mt-1 truncate text-xs font-medium text-[#7A8799]">{component.description || "Public component"}</p>
                            </div>
                            <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${status.dot}`} aria-label={status.label} />
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
                              {status.label}
                            </span>
                            <span className="text-xs font-extrabold text-[#0B1220]">{uptime.toFixed(3)}%</span>
                          </div>
                        </div>
                        <div className="grid flex-1 grid-cols-[repeat(90,minmax(6px,1fr))] gap-1" role="list" aria-label={`${component.name} 90-day uptime history`}>
                          {dates.map((date) => {
                            const day = byDay.get(date) ?? {
                              day: date,
                              uptime_percentage: 0,
                              status: "no_data" as UptimeStatus,
                              checks_count: 0,
                              down_minutes: 0,
                            };
                            const label = `${component.name} on ${formatDayLabel(date)}: ${day.status.replaceAll("_", " ")}, ${day.uptime_percentage.toFixed(3)}% uptime, ${day.down_minutes} down minutes`;
                            return (
                              <div
                                key={date}
                                role="listitem"
                                aria-label={label}
                                title={label}
                                className={`h-10 rounded-md shadow-sm transition-all duration-200 hover:scale-[1.8] hover:ring-2 hover:ring-[#0B1220]/20 ${dayColor(day.status, day.uptime_percentage)}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function StatusPageUptime() {
  const { slug } = useParams<{ slug: string }>();
  const safeSlug = slug || "statura";
  const [payload, setPayload] = useState<UptimePayload | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string>("");
  const [offsetDays, setOffsetDays] = useStat