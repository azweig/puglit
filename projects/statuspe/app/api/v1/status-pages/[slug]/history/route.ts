import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const sslMode = process.env.PGSSLMODE?.toLowerCase();
const useDatabaseSsl =
  process.env.DATABASE_SSL === "true" ||
  sslMode === "require" ||
  sslMode === "no-verify" ||
  (databaseUrl ? /[?&](?:sslmode=require|sslmode=no-verify|ssl=true)(?:&|$)/i.test(databaseUrl) : false);

const globalForPg = globalThis as unknown as {
  statusPagesHistoryPool?: Pool;
};

const pool =
  globalForPg.statusPagesHistoryPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: useDatabaseSsl ? { rejectUnauthorized: false } : false,
  });

globalForPg.statusPagesHistoryPool = pool;

type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";
type MaintenanceStatus = "scheduled" | "in_progress" | "verifying" | "completed" | "cancelled";
type Impact = "none" | "minor" | "major" | "critical";
type DbTimestamp = Date | string;

type PageRow = {
  id: string;
  timezone: string;
};

type IncidentRow = {
  id: string;
  title: string;
  status: IncidentStatus;
  impact: Impact;
  started_at: DbTimestamp;
  resolved_at: DbTimestamp | null;
};

type MaintenanceRow = {
  id: string;
  title: string;
  status: MaintenanceStatus;
  impact: Impact;
  scheduled_start_at: DbTimestamp;
  scheduled_end_at: DbTimestamp;
  completed_at: DbTimestamp | null;
};

type HistoryDay = {
  date: string;
  incidents: IncidentRow[];
  maintenances: MaintenanceRow[];
  no_incidents_reported: boolean;
};

const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~-]{0,127}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function extractSlugFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const statusPagesIndex = segments.findIndex(
    (segment, index) => segment === "status-pages" && segments[index + 2] === "history",
  );

  if (statusPagesIndex < 0) {
    return null;
  }

  const encodedSlug = segments[statusPagesIndex + 1];
  if (!encodedSlug) {
    return null;
  }

  try {
    return decodeURIComponent(encodedSlug);
  } catch {
    return null;
  }
}

function isValidSlug(slug: string | null): slug is string {
  return typeof slug === "string" && SLUG_PATTERN.test(slug);
}

function parseMonth(value: string): { year: number; month: number } | null {
  if (!MONTH_PATTERN.test(value)) {
    return null;
  }

  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return null;
  }

  if (year < 1970 || year > 9999 || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatMonth(year: number, month: number): string {
  return `${String(year).padStart(4, "0")}-${pad2(month)}`;
}

function addMonths(monthValue: string, delta: number): string {
  const parsed = parseMonth(monthValue);
  if (!parsed) {
    return monthValue;
  }

  const absoluteMonth = parsed.year * 12 + (parsed.month - 1) + delta;
  const nextYear = Math.floor(absoluteMonth / 12);
  const nextMonth = ((absoluteMonth % 12) + 12) % 12 + 1;

  return formatMonth(nextYear, nextMonth);
}

function currentMonthInTimezone(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;

    if (year && month && parseMonth(`${year}-${month}`)) {
      return `${year}-${month}`;
    }
  } catch {
    // Fall back to UTC if stored timezone data is not accepted by Intl.
  }

  const now = new Date();
  return formatMonth(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

function utcDateKey(value: DbTimestamp): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const slug = extractSlugFromPath(url.pathname);

    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
    }

    const monthParam = url.searchParams.get("month");
    if (monthParam !== null && !parseMonth(monthParam)) {
      return NextResponse.json({ error: "invalid_month" }, { status: 400 });
    }

    const pageResult = await pool.query<PageRow>(
      "SELECT id::text AS id, timezone FROM status_pages WHERE slug = $1 AND is_public = TRUE LIMIT 1",
      [slug],
    );

    const page = pageResult.rows[0];
    if (!page) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const month = monthParam ?? currentMonthInTimezone(page.timezone);
    const parsedMonth = parseMonth(month);
    if (!parsedMonth) {
      return NextResponse.json({ error: "invalid_month" }, { status: 400 });
    }

    const start = new Date(Date.UTC(parsedMonth.year, parsedMonth.month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(parsedMonth.year, parsedMonth.month, 1, 0, 0, 0, 0));

    const [incidentsResult, maintenancesResult] = await Promise.all([
      pool.query<IncidentRow>(
        "SELECT id::text AS id, title, status, impact, started_at, resolved_at FROM incidents WHERE status_page_id = $1 AND started_at >= $2 AND started_at < $3 ORDER BY started_at DESC",
        [page.id, start.toISOString(), end.toISOString()],
      ),
      pool.query<MaintenanceRow>(
        "SELECT id::text AS id, title, status, impact, scheduled_start_at, scheduled_end_at, completed_at FROM scheduled_maintenances WHERE status_page_id = $1 AND scheduled_start_at >= $2 AND scheduled_start_at < $3 ORDER BY scheduled_start_at DESC",
        [page.id, start.toISOString(), end.toISOString()],
      ),
    ]);

    const daysByDate = new Map<string, HistoryDay>();
    const cursor = new Date(start.getTime());

    while (cursor.getTime() < end.getTime()) {
      const date = cursor.toISOString().slice(0, 10);
      daysByDate.set(date, {
        date,
        incidents: [],
        maintenances: [],
        no_incidents_reported: true,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    for (const incident of incidentsResult.rows) {
      const day = daysByDate.get(utcDateKey(incident.started_at));
      if (day) {
        day.incidents.push(incident);
      }
    }

    for (const maintenance of maintenancesResult.rows) {
      const day = daysByDate.get(utcDateKey(maintenance.scheduled_start_at));
      if (day) {
        day.maintenances.push(maintenance);
      }
    }

    const days = Array.from(daysByDate.values()).map((day) => ({
      ...day,
      no_incidents_reported: day.incidents.length === 0 && day.maintenances.length === 0,
    }));

    return NextResponse.json(days);
  } catch (error: unknown) {
    console.error("GET /api/v1/status-pages/[slug]/history failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
