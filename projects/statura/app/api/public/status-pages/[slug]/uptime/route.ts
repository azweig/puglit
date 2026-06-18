import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type ComponentStatus =
  | "operational"
  | "degraded_performance"
  | "partial_outage"
  | "major_outage"
  | "under_maintenance";

type UptimeDayStatus = ComponentStatus | "no_data";

type PgDate = string | Date;

interface PageRow {
  id: string;
  title: string;
  slug: string;
  logo_text: string | null;
  custom_domain: string | null;
  timezone: string;
}

interface BoundsRow {
  start_day: PgDate;
  end_day: PgDate;
}

interface UptimeSqlRow {
  id: string;
  name: string;
  current_status: ComponentStatus;
  group_name: string | null;
  day: PgDate;
  uptime_percentage: string | number;
  status: UptimeDayStatus;
  down_minutes: number | null;
}

interface ComponentDay {
  day: string;
  uptime_percentage: number;
  status: UptimeDayStatus;
  down_minutes: number | null;
}

interface ComponentUptime {
  id: string;
  name: string;
  current_status: ComponentStatus;
  group_name: string | null;
  days: ComponentDay[];
}

interface ParsedIntegerParam {
  value: number;
  error: string | null;
}

const LEGEND: Array<{ status: UptimeDayStatus; label: string }> = [
  { status: "operational", label: "Operational" },
  { status: "degraded_performance", label: "Degraded performance" },
  { status: "partial_outage", label: "Partial outage" },
  { status: "major_outage", label: "Major outage" },
  { status: "under_maintenance", label: "Under maintenance" },
  { status: "no_data", label: "No data" },
];

function extractSlug(pathname: string): string | null {
  const marker = "/api/public/status-pages/";
  const markerIndex = pathname.indexOf(marker);

  if (markerIndex < 0) {
    return null;
  }

  const remainder = pathname.slice(markerIndex + marker.length);
  const parts = remainder.split("/");

  if (parts.length < 2 || parts[0] === "" || parts[1] !== "uptime") {
    return null;
  }

  try {
    const decoded = decodeURIComponent(parts[0]);
    if (decoded.length < 1 || decoded.length > 200 || decoded.includes("/") || /[\u0000-\u001F\u007F]/.test(decoded)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function parseIntegerParam(
  searchParams: URLSearchParams,
  name: string,
  defaultValue: number,
  min: number,
  max: number,
): ParsedIntegerParam {
  const raw = searchParams.get(name);

  if (raw === null || raw.trim() === "") {
    return { value: defaultValue, error: null };
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return { value: defaultValue, error: `${name} must be an integer` };
  }

  if (value < min || value > max) {
    return { value: defaultValue, error: `${name} must be between ${min} and ${max}` };
  }

  return { value, error: null };
}

function dateOnly(value: PgDate): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function numericValue(value: string | number): number {
  return typeof value === "number" ? value : Number(value);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const slug = extractSlug(url.pathname);

    if (slug === null) {
      return NextResponse.json({ error: "invalid slug" }, { status: 400 });
    }

    const daysParam = parseIntegerParam(url.searchParams, "days", 90, 1, 180);
    if (daysParam.error !== null) {
      return NextResponse.json({ error: daysParam.error }, { status: 400 });
    }

    const offsetDaysParam = parseIntegerParam(url.searchParams, "offset_days", 0, 0, 3650);
    if (offsetDaysParam.error !== null) {
      return NextResponse.json({ error: offsetDaysParam.error }, { status: 400 });
    }

    const pageResult = await pool.query<PageRow>(
      `SELECT id, title, slug, logo_text, custom_domain, timezone
       FROM status_pages
       WHERE slug = $1 AND is_public = TRUE
       LIMIT 1`,
      [slug],
    );

    const page = pageResult.rows[0];
    if (page === undefined) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const boundsResult = await pool.query<BoundsRow>(
      `SELECT
         (CURRENT_DATE - $1::int - $2::int + 1)::date AS start_day,
         (CURRENT_DATE - $1::int)::date AS end_day`,
      [offsetDaysParam.value, daysParam.value],
    );

    const bounds = boundsResult.rows[0];
    if (bounds === undefined) {
      throw new Error("failed to calculate uptime date bounds");
    }

    const startDay = dateOnly(bounds.start_day);
    const endDay = dateOnly(bounds.end_day);

    const uptimeResult = await pool.query<UptimeSqlRow>(
      `SELECT
         c.id,
         c.name,
         c.current_status,
         cg.name AS group_name,
         d.day,
         COALESCE(ud.uptime_percentage, 100) AS uptime_percentage,
         COALESCE(ud.status, 'no_data') AS status,
         ud.down_minutes
       FROM components c
       LEFT JOIN component_groups cg ON cg.id = c.group_id
       CROSS JOIN generate_series($2::date, $3::date, '1 day') d(day)
       LEFT JOIN uptime_days ud ON ud.component_id = c.id AND ud.day = d.day
       WHERE c.status_page_id = $1 AND c.is_visible = TRUE
       ORDER BY cg.position NULLS LAST, c.position, d.day`,
      [page.id, startDay, endDay],
    );

    const componentsById = new Map<string, ComponentUptime>();

    for (const row of uptimeResult.rows) {
      const componentId = String(row.id);
      const existing = componentsById.get(componentId);
      const component = existing ?? {
        id: componentId,
        name: row.name,
        current_status: row.current_status,
        group_name: row.group_name,
        days: [],
      };

      component.days.push({
        day: dateOnly(row.day),
        uptime_percentage: numericValue(row.uptime_percentage),
        status: row.status,
        down_minutes: row.down_minutes,
      });

      if (existing === undefined) {
        componentsById.set(componentId, component);
      }
    }

    return NextResponse.json(
      {
        page: {
          id: page.id,
          title: page.title,
          slug: page.slug,
          logo_text: page.logo_text,
          custom_domain: page.custom_domain,
          timezone: page.timezone,
        },
        period: {
          days: daysParam.value,
          offset_days: offsetDaysParam.value,
          start_day: startDay,
          end_day: endDay,
        },
        legend: LEGEND,
        components: Array.from(componentsById.values()),
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("GET /api/public/status-pages/[slug]/uptime failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
