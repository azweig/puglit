import { NextRequest, NextResponse } from "next/server";
import { createPool } from "@/lib/database";

const pool = createPool();

type RouteParams = {
  slug: string;
  maintenanceId: string;
};

type RouteContext = {
  params: Promise<RouteParams>;
};

type DbTimestamp = string | Date;

type StatusPageRow = {
  id: string;
};

type MaintenanceStatus = "scheduled" | "in_progress" | "verifying" | "completed" | "cancelled";
type MaintenanceImpact = "none" | "minor" | "major" | "critical";
type ComponentExpectedStatus = "operational" | "degraded" | "outage" | "maintenance";

type MaintenanceRow = {
  id: string;
  status_page_id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  impact: MaintenanceImpact;
  scheduled_start_at: DbTimestamp;
  scheduled_end_at: DbTimestamp;
  started_at: DbTimestamp | null;
  completed_at: DbTimestamp | null;
  created_at: DbTimestamp;
  updated_at: DbTimestamp;
};

type MaintenanceUpdateRow = {
  id: string;
  status: MaintenanceStatus;
  message: string;
  author_label: string;
  published_at: DbTimestamp;
};

type MaintenanceComponentRow = {
  id: string;
  name: string;
  expected_status: ComponentExpectedStatus;
};

function timestampToMillis(value: DbTimestamp): number | null {
  const millis = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(millis) ? millis : null;
}

function validateSlug(slug: string): string | null {
  const trimmed = slug.trim();
  if (trimmed.length < 1 || trimmed.length > 120) return null;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(trimmed)) return null;
  return trimmed;
}

function validatePositiveId(rawId: string): number | null {
  const trimmed = rawId.trim();
  if (trimmed.length < 1 || trimmed.length > 15) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  return value;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  void request;

  try {
    const params = await context.params;
    const slug = validateSlug(params.slug);
    if (!slug) {
      return NextResponse.json({ error: "invalid slug" }, { status: 400 });
    }

    const maintenanceId = validatePositiveId(params.maintenanceId);
    if (maintenanceId === null) {
      return NextResponse.json({ error: "invalid maintenanceId" }, { status: 400 });
    }

    const pageResult = await pool.query<StatusPageRow>(
      "SELECT id FROM status_pages WHERE slug = $1 AND is_public = TRUE",
      [slug],
    );

    const page = pageResult.rows[0];
    if (!page) {
      return NextResponse.json({ error: "status page not found" }, { status: 404 });
    }

    const maintenanceResult = await pool.query<MaintenanceRow>(
      `SELECT
         id,
         status_page_id,
         title,
         description,
         status,
         impact,
         scheduled_start_at,
         scheduled_end_at,
         started_at,
         completed_at,
         created_at,
         updated_at
       FROM scheduled_maintenances
       WHERE id = $1 AND status_page_id = $2`,
      [maintenanceId, page.id],
    );

    const maintenance = maintenanceResult.rows[0];
    if (!maintenance) {
      return NextResponse.json({ error: "maintenance not found" }, { status: 404 });
    }

    const updatesResult = await pool.query<MaintenanceUpdateRow>(
      `SELECT id, status, message, author_label, published_at
       FROM maintenance_updates
       WHERE maintenance_id = $1
       ORDER BY published_at DESC`,
      [maintenanceId],
    );

    const componentsResult = await pool.query<MaintenanceComponentRow>(
      `SELECT c.id, c.name, mc.expected_status
       FROM maintenance_components mc
       JOIN components c ON c.id = mc.component_id
       WHERE mc.maintenance_id = $1 AND c.is_public = TRUE
       ORDER BY c.position, c.name`,
      [maintenanceId],
    );

    const startMillis = timestampToMillis(maintenance.scheduled_start_at);
    const endMillis = timestampToMillis(maintenance.scheduled_end_at);
    const estimatedDurationMinutes =
      startMillis === null || endMillis === null
        ? null
        : Math.max(0, Math.round((endMillis - startMillis) / 60000));

    return NextResponse.json(
      {
        id: maintenance.id,
        status_page_id: maintenance.status_page_id,
        title: maintenance.title,
        description: maintenance.description,
        status: maintenance.status,
        impact: maintenance.impact,
        scheduled_start_at: maintenance.scheduled_start_at,
        scheduled_end_at: maintenance.scheduled_end_at,
        estimated_duration_minutes: estimatedDurationMinutes,
        started_at: maintenance.started_at,
        completed_at: maintenance.completed_at,
        created_at: maintenance.created_at,
        updated_at: maintenance.updated_at,
        updates: updatesResult.rows,
        components: componentsResult.rows,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("GET /api/v1/status-pages/[slug]/maintenances/[maintenanceId] failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
