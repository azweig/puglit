import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type DbTimestamp = Date | string;

interface IncidentRow {
  id: string | number;
  status_page_id: string | number;
  title: string;
  description: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  impact: "minor" | "major" | "critical" | "maintenance";
  started_at: DbTimestamp;
  resolved_at: DbTimestamp | null;
  created_at: DbTimestamp;
  updated_at: DbTimestamp;
  status_page_slug: string;
  status_page_title: string;
  timezone: string;
  duration_seconds: string | number;
}

interface ComponentRow {
  id: string | number;
  group_id: string | number | null;
  name: string;
  description: string | null;
  current_status:
    | "operational"
    | "degraded_performance"
    | "partial_outage"
    | "major_outage"
    | "under_maintenance";
  position: number;
}

interface IncidentUpdateRow {
  id: string | number;
  incident_id: string | number;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  body: string;
  published_at: DbTimestamp;
  created_at: DbTimestamp;
}

interface PublicIncidentResponse {
  id: string | number;
  status_page_id: string | number;
  status_page_slug: string;
  status_page_title: string;
  timezone: string;
  title: string;
  description: string;
  status: IncidentRow["status"];
  impact: IncidentRow["impact"];
  started_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  duration_seconds: number;
  affected_components: ComponentRow[];
  timeline: Array<{
    id: string | number;
    incident_id: string | number;
    status: IncidentUpdateRow["status"];
    body: string;
    published_at: string;
    created_at: string;
  }>;
}

function parseIncidentIdFromPath(pathname: string): number | null {
  const segments = pathname.split("/").filter(Boolean);
  const rawIncidentId = segments[segments.length - 1];

  if (!rawIncidentId) {
    return null;
  }

  let decodedIncidentId: string;
  try {
    decodedIncidentId = decodeURIComponent(rawIncidentId);
  } catch {
    return null;
  }

  if (!/^\d+$/.test(decodedIncidentId)) {
    return null;
  }

  const incidentId = Number(decodedIncidentId);
  if (!Number.isSafeInteger(incidentId) || incidentId <= 0) {
    return null;
  }

  return incidentId;
}

function toIsoTimestamp(value: DbTimestamp): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toISOString();
}

function toNullableIsoTimestamp(value: DbTimestamp | null): string | null {
  if (value === null) {
    return null;
  }
  return toIsoTimestamp(value);
}

function normalizeDurationSeconds(value: string | number): number {
  const durationSeconds = Number(value);
  if (!Number.isFinite(durationSeconds)) {
    return 0;
  }
  return Math.max(0, Math.floor(durationSeconds));
}

export async function GET(request: NextRequest) {
  try {
    const incidentId = parseIncidentIdFromPath(new URL(request.url).pathname);
    if (incidentId === null) {
      return NextResponse.json({ error: "invalid incidentId" }, { status: 400 });
    }

    const incidentResult = await pool.query<IncidentRow>(
      `
        SELECT
          i.id,
          i.status_page_id,
          i.title,
          i.description,
          i.status,
          i.impact,
          i.started_at,
          i.resolved_at,
          i.created_at,
          i.updated_at,
          sp.slug AS status_page_slug,
          sp.title AS status_page_title,
          sp.timezone,
          FLOOR(EXTRACT(EPOCH FROM (COALESCE(i.resolved_at, NOW()) - i.started_at)))::INT AS duration_seconds
        FROM incidents i
        JOIN status_pages sp ON sp.id = i.status_page_id
        WHERE i.id = $1
          AND sp.is_public = TRUE
        LIMIT 1
      `,
      [incidentId],
    );

    const incident = incidentResult.rows[0];
    if (!incident) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const [componentsResult, updatesResult] = await Promise.all([
      pool.query<ComponentRow>(
        `
          SELECT
            c.id,
            c.group_id,
            c.name,
            c.description,
            c.current_status,
            c.position
          FROM incident_components ic
          JOIN components c ON c.id = ic.component_id
          WHERE ic.incident_id = $1
            AND c.status_page_id = $2
            AND c.is_visible = TRUE
          ORDER BY c.position ASC, c.name ASC, c.id ASC
        `,
        [incidentId, incident.status_page_id],
      ),
      pool.query<IncidentUpdateRow>(
        `
          SELECT
            id,
            incident_id,
            status,
            body,
            published_at,
            created_at
          FROM incident_updates
          WHERE incident_id = $1
          ORDER BY published_at ASC, id ASC
        `,
        [incidentId],
      ),
    ]);

    const response: PublicIncidentResponse = {
      id: incident.id,
      status_page_id: incident.status_page_id,
      status_page_slug: incident.status_page_slug,
      status_page_title: incident.status_page_title,
      timezone: incident.timezone,
      title: incident.title,
      description: incident.description,
      status: incident.status,
      impact: incident.impact,
      started_at: toIsoTimestamp(incident.started_at),
      resolved_at: toNullableIsoTimestamp(incident.resolved_at),
      created_at: toIsoTimestamp(incident.created_at),
      updated_at: toIsoTimestamp(incident.updated_at),
      duration_seconds: normalizeDurationSeconds(incident.duration_seconds),
      affected_components: componentsResult.rows,
      timeline: updatesResult.rows.map((update) => ({
        id: update.id,
        incident_id: update.incident_id,
        status: update.status,
        body: update.body,
        published_at: toIsoTimestamp(update.published_at),
        created_at: toIsoTimestamp(update.created_at),
      })),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/public/incidents/[incidentId] failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
