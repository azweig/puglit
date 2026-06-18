import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type MaintenanceStatus = "scheduled" | "in_progress" | "verifying" | "completed";
type MaintenanceImpact = "minor" | "major" | "critical" | "maintenance";
type ComponentStatus =
  | "operational"
  | "degraded_performance"
  | "partial_outage"
  | "major_outage"
  | "under_maintenance";

interface MaintenanceRow {
  id: string;
  status_page_id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  impact: MaintenanceImpact;
  scheduled_start: Date | string;
  scheduled_end: Date | string;
  started_at: Date | string | null;
  completed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  status_page_slug: string;
  status_page_title: string;
}

interface MaintenanceComponentRow {
  id: string;
  status_page_id: string;
  group_id: string | null;
  name: string;
  description: string | null;
  current_status: ComponentStatus;
  position: number;
  is_visible: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

interface MaintenanceUpdateRow {
  id: string;
  maintenance_id: string;
  status: MaintenanceStatus;
  body: string;
  published_at: Date | string;
  created_at: Date | string;
}

interface MaintenanceDetailResponse extends MaintenanceRow {
  components: MaintenanceComponentRow[];
  updates: MaintenanceUpdateRow[];
}

function getMaintenanceIdFromPath(request: NextRequest): number | null {
  const pathname = new URL(request.url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const rawId = segments[segments.length - 1];

  if (!rawId) {
    return null;
  }

  const decodedId = decodeURIComponent(rawId);
  if (!/^\d+$/.test(decodedId)) {
    return null;
  }

  const maintenanceId = Number(decodedId);
  if (!Number.isSafeInteger(maintenanceId) || maintenanceId <= 0) {
    return null;
  }

  return maintenanceId;
}

export async function GET(request: NextRequest) {
  try {
    const maintenanceId = getMaintenanceIdFromPath(request);
    if (maintenanceId === null) {
      return NextResponse.json({ error: "invalid maintenanceId" }, { status: 400 });
    }

    const maintenanceResult = await pool.query<MaintenanceRow>(
      `
        SELECT
          m.id,
          m.status_page_id,
          m.title,
          m.description,
          m.status,
          m.impact,
          m.scheduled_start,
          m.scheduled_end,
          m.started_at,
          m.completed_at,
          m.created_at,
          m.updated_at,
          sp.slug AS status_page_slug,
          sp.title AS status_page_title
        FROM maintenances m
        JOIN status_pages sp ON sp.id = m.status_page_id
        WHERE m.id = $1
          AND sp.is_public = TRUE
        LIMIT 1
      `,
      [maintenanceId],
    );

    const maintenance = maintenanceResult.rows[0];
    if (!maintenance) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const componentsResult = await pool.query<MaintenanceComponentRow>(
      `
        SELECT
          c.id,
          c.status_page_id,
          c.group_id,
          c.name,
          c.description,
          c.current_status,
          c.position,
          c.is_visible,
          c.created_at,
          c.updated_at
        FROM maintenance_components mc
        JOIN components c ON c.id = mc.component_id
        WHERE mc.maintenance_id = $1
          AND c.status_page_id = $2
          AND c.is_visible = TRUE
        ORDER BY c.position ASC, c.name ASC, c.id ASC
      `,
      [maintenanceId, maintenance.status_page_id],
    );

    const updatesResult = await pool.query<MaintenanceUpdateRow>(
      `
        SELECT
          id,
          maintenance_id,
          status,
          body,
          published_at,
          created_at
        FROM maintenance_updates
        WHERE maintenance_id = $1
        ORDER BY published_at ASC, id ASC
      `,
      [maintenanceId],
    );

    const response: MaintenanceDetailResponse = {
      ...maintenance,
      components: componentsResult.rows,
      updates: updatesResult.rows,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/public/maintenances/[maintenanceId] failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
