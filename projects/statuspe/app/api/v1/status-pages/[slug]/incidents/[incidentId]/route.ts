import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type ParsedParams =
  | { ok: true; slug: string; incidentId: number }
  | { ok: false; error: string };

type StatusPageRow = {
  id: string;
  is_public: boolean;
  name: string;
  slug: string;
  timezone: string;
};

type IncidentRow = {
  id: string;
  status_page_id: string;
  endpoint_id: string | null;
  title: string;
  description: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  impact: "none" | "minor" | "major" | "critical";
  started_at: Date | string;
  resolved_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  duration_seconds: string | number | null;
};

type IncidentUpdateRow = {
  id: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  message: string;
  author_label: string;
  published_at: Date | string;
};

type AffectedComponentRow = {
  id: string;
  name: string;
  affected_status: "operational" | "degraded" | "outage" | "maintenance";
};

function parseRouteParams(request: NextRequest): ParsedParams {
  const pathname = new URL(request.url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const statusPagesIndex = segments.indexOf("status-pages");
  const incidentsIndex = segments.indexOf("incidents");

  if (statusPagesIndex < 0 || incidentsIndex < 0) {
    return { ok: false, error: "invalid route" };
  }

  const rawSlug = segments[statusPagesIndex + 1];
  const rawIncidentId = segments[incidentsIndex + 1];

  if (typeof rawSlug !== "string" || rawSlug.length === 0) {
    return { ok: false, error: "slug is required" };
  }

  if (typeof rawIncidentId !== "string" || rawIncidentId.length === 0) {
    return { ok: false, error: "incidentId is required" };
  }

  let slug: string;
  let incidentIdText: string;
  try {
    slug = decodeURIComponent(rawSlug);
    incidentIdText = decodeURIComponent(rawIncidentId);
  } catch {
    return { ok: false, error: "invalid encoded parameters" };
  }

  if (slug.length === 0 || slug.length > 200 || /[\u0000-\u001F\u007F]/.test(slug)) {
    return { ok: false, error: "invalid slug" };
  }

  if (!/^\d+$/.test(incidentIdText)) {
    return { ok: false, error: "invalid incidentId" };
  }

  const incidentId = Number(incidentIdText);
  if (!Number.isFinite(incidentId) || !Number.isInteger(incidentId) || incidentId <= 0 || incidentId > Number.MAX_SAFE_INTEGER) {
    return { ok: false, error: "invalid incidentId" };
  }

  return { ok: true, slug, incidentId };
}

function durationToNumber(value: string | number | null): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.floor(parsed);
}

export async function GET(request: NextRequest) {
  try {
    const parsed = parseRouteParams(request);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pageResult = await pool.query<StatusPageRow>(
      "SELECT id, is_public, name, slug, timezone FROM status_pages WHERE slug = $1",
      [parsed.slug]
    );

    const page = pageResult.rows[0];
    if (!page) {
      return NextResponse.json({ error: "status page not found" }, { status: 404 });
    }

    if (!page.is_public) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const incidentResult = await pool.query<IncidentRow>(
      `SELECT
        i.id,
        i.status_page_id,
        i.endpoint_id,
        i.title,
        i.description,
        i.status,
        i.impact,
        i.started_at,
        i.resolved_at,
        i.created_at,
        i.updated_at,
        EXTRACT(EPOCH FROM (COALESCE(i.resolved_at, NOW()) - i.started_at))::BIGINT AS duration_seconds
       FROM incidents i
       WHERE i.id = $1 AND i.status_page_id = $2`,
      [parsed.incidentId, page.id]
    );

    const incident = incidentResult.rows[0];
    if (!incident) {
      return NextResponse.json({ error: "incident not found" }, { status: 404 });
    }

    const updatesResult = await pool.query<IncidentUpdateRow>(
      `SELECT id, status, message, author_label, published_at
       FROM incident_updates
       WHERE incident_id = $1
       ORDER BY published_at DESC`,
      [incident.id]
    );

    const componentsResult = await pool.query<AffectedComponentRow>(
      `SELECT c.id, c.name, ic.affected_status
       FROM incident_components ic
       JOIN components c ON c.id = ic.component_id
       WHERE ic.incident_id = $1 AND c.is_public = TRUE
       ORDER BY c.position, c.name`,
      [incident.id]
    );

    return NextResponse.json(
      {
        page: {
          id: page.id,
          name: page.name,
          slug: page.slug,
          timezone: page.timezone,
        },
        incident: {
          id: incident.id,
          status_page_id: incident.status_page_id,
          endpoint_id: incident.endpoint_id,
          title: incident.title,
          description: incident.description,
          status: incident.status,
          impact: incident.impact,
          started_at: incident.started_at,
          resolved_at: incident.resolved_at,
          created_at: incident.created_at,
          updated_at: incident.updated_at,
          duration_seconds: durationToNumber(incident.duration_seconds),
        },
        updates: updatesResult.rows,
        components: componentsResult.rows,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET /api/v1/status-pages/[slug]/incidents/[incidentId] failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
