import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type TimestampValue = string | Date;

type StatusPageRow = {
  id: string;
  title: string;
  slug: string;
  logo_text: string | null;
  custom_domain: string | null;
  is_public: boolean;
  sms_enabled: boolean;
  slack_enabled: boolean;
  webhook_enabled: boolean;
  timezone: string;
  created_at: TimestampValue;
  updated_at: TimestampValue;
  generated_at: TimestampValue;
};

type ComponentGroupRow = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  collapsed_by_default: boolean;
  created_at: TimestampValue;
};

type ComponentStatus =
  | "operational"
  | "degraded_performance"
  | "partial_outage"
  | "major_outage"
  | "under_maintenance";

type ComponentRow = {
  id: string;
  group_id: string | null;
  name: string;
  description: string | null;
  current_status: ComponentStatus;
  position: number;
  is_visible: boolean;
  created_at: TimestampValue;
  updated_at: TimestampValue;
};

type EndpointStatus = "operational" | "degraded" | "down" | "unknown";

type RecentCheck = {
  checked_at: TimestampValue;
  is_up: boolean;
  response_time_ms: number;
  status_code: number | null;
};

type EndpointRow = {
  id: string;
  component_id: string;
  name: string;
  url: string;
  method: "GET" | "HEAD";
  current_status: EndpointStatus;
  degraded_threshold_ms: number;
  is_public: boolean;
  created_at: TimestampValue;
  updated_at: TimestampValue;
  last_checked_at: TimestampValue | null;
  recent_checks: RecentCheck[];
  uptime_percentage_90d: number;
};

type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";
type IncidentImpact = "minor" | "major" | "critical" | "maintenance";

type AffectedComponent = {
  id: string;
  name: string;
  current_status: ComponentStatus;
};

type IncidentUpdateSummary = {
  id: string;
  status: IncidentStatus;
  body: string;
  published_at: TimestampValue;
} | null;

type IncidentRow = {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  impact: IncidentImpact;
  started_at: TimestampValue;
  resolved_at: TimestampValue | null;
  created_at: TimestampValue;
  updated_at: TimestampValue;
  affected_components: AffectedComponent[];
  latest_update: IncidentUpdateSummary;
};

type MaintenanceStatus = "scheduled" | "in_progress" | "verifying" | "completed";

type MaintenanceUpdateSummary = {
  id: string;
  status: MaintenanceStatus;
  body: string;
  published_at: TimestampValue;
} | null;

type MaintenanceRow = {
  id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  impact: IncidentImpact;
  scheduled_start: TimestampValue;
  scheduled_end: TimestampValue;
  started_at: TimestampValue | null;
  completed_at: TimestampValue | null;
  created_at: TimestampValue;
  updated_at: TimestampValue;
  affected_components: AffectedComponent[];
  latest_update: MaintenanceUpdateSummary;
};

type GroupWithComponents = ComponentGroupRow & {
  components: ComponentRow[];
};

type OverallStatus =
  | "operational"
  | "degraded_performance"
  | "partial_outage"
  | "major_outage"
  | "under_maintenance";

function parseBoundedInteger(
  value: string | null,
  defaultValue: number,
  maxValue: number,
  name: string,
): { ok: true; value: number } | { ok: false; error: string } {
  if (value === null || value.trim() === "") {
    return { ok: true, value: defaultValue };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return { ok: false, error: `${name} must be a positive integer` };
  }

  return { ok: true, value: Math.min(parsed, maxValue) };
}

function getSlugFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const rawSlug = segments[segments.length - 1];
  if (!rawSlug) {
    return null;
  }

  try {
    return decodeURIComponent(rawSlug);
  } catch {
    return null;
  }
}

function getNormalizedHost(request: NextRequest): string | null {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = forwardedHost ?? request.headers.get("host");
  if (!hostHeader) {
    return null;
  }

  const firstHost = hostHeader.split(",")[0]?.trim().toLowerCase();
  if (!firstHost) {
    return null;
  }

  const withoutPort = firstHost.startsWith("[")
    ? firstHost
    : firstHost.replace(/:\d+$/, "");

  if (
    withoutPort.length < 1 ||
    withoutPort.length > 253 ||
    withoutPort.includes("/") ||
    withoutPort.includes("\\") ||
    withoutPort.includes(" ")
  ) {
    return null;
  }

  return withoutPort;
}

function isValidSlug(slug: string): boolean {
  return slug.length >= 1 && slug.length <= 200 && !slug.includes("/") && !slug.includes("\\");
}

function isMaintenanceCurrentlyActive(maintenance: MaintenanceRow, now: Date): boolean {
  if (maintenance.status === "in_progress" || maintenance.status === "verifying") {
    return true;
  }

  if (maintenance.status !== "scheduled") {
    return false;
  }

  const start = new Date(maintenance.scheduled_start);
  const end = new Date(maintenance.scheduled_end);
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= now && end >= now;
}

function deriveOverallStatus(
  components: ComponentRow[],
  endpoints: EndpointRow[],
  maintenances: MaintenanceRow[],
): OverallStatus {
  const componentStatuses = components.map((component) => component.current_status);
  const endpointStatuses = endpoints.map((endpoint) => endpoint.current_status);
  const now = new Date();

  if (componentStatuses.includes("major_outage") || endpointStatuses.includes("down")) {
    return "major_outage";
  }

  if (componentStatuses.includes("partial_outage")) {
    return "partial_outage";
  }

  if (componentStatuses.includes("degraded_performance") || endpointStatuses.includes("degraded")) {
    return "degraded_performance";
  }

  if (
    componentStatuses.includes("under_maintenance") ||
    maintenances.some((maintenance) => isMaintenanceCurrentlyActive(maintenance, now))
  ) {
    return "under_maintenance";
  }

  return "operational";
}

function attachComponentsToGroups(
  groups: ComponentGroupRow[],
  components: ComponentRow[],
): { groups: GroupWithComponents[]; ungrouped_components: ComponentRow[] } {
  const grouped = new Map<string, ComponentRow[]>();
  const ungrouped: ComponentRow[] = [];

  for (const component of components) {
    if (component.group_id === null) {
      ungrouped.push(component);
      continue;
    }

    const existing = grouped.get(component.group_id) ?? [];
    existing.push(component);
    grouped.set(component.group_id, existing);
  }

  return {
    groups: groups.map((group) => ({
      ...group,
      components: grouped.get(group.id) ?? [],
    })),
    ungrouped_components: ungrouped,
  };
}

async function resolveStatusPage(host: string | null, slug: string): Promise<StatusPageRow | null> {
  if (host !== null) {
    const byHost = await pool.query<StatusPageRow>(
      `
        SELECT
          id::text,
          title,
          slug,
          logo_text,
          custom_domain,
          is_public,
          sms_enabled,
          slack_enabled,
          webhook_enabled,
          timezone,
          created_at,
          updated_at,
          NOW() AS generated_at
        FROM status_pages
        WHERE is_public = TRUE AND custom_domain = $1
        LIMIT 1
      `,
      [host],
    );

    if (byHost.rows[0]) {
      return byHost.rows[0];
    }
  }

  const bySlug = await pool.query<StatusPageRow>(
    `
      SELECT
        id::text,
        title,
        slug,
        logo_text,
        custom_domain,
        is_public,
        sms_enabled,
        slack_enabled,
        webhook_enabled,
        timezone,
        created_at,
        updated_at,
        NOW() AS generated_at
      FROM status_pages
      WHERE slug = $1
      LIMIT 1
    `,
    [slug],
  );

  return bySlug.rows[0] ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const slug = getSlugFromPath(request.nextUrl.pathname);
    if (slug === null || !isValidSlug(slug)) {
      return NextResponse.json({ error: "invalid slug" }, { status: 400 });
    }

    const checksLimitResult = parseBoundedInteger(
      request.nextUrl.searchParams.get("checks_limit"),
      20,
      100,
      "checks_limit",
    );
    if (!checksLimitResult.ok) {
      return NextResponse.json({ error: checksLimitResult.error }, { status: 400 });
    }

    const incidentLimitResult = parseBoundedInteger(
      request.nextUrl.searchParams.get("incident_limit"),
      10,
      50,
      "incident_limit",
    );
    if (!incidentLimitResult.ok) {
      return NextResponse.json({ error: incidentLimitResult.error }, { status: 400 });
    }

    const host = getNormalizedHost(request);
    const page = await resolveStatusPage(host, slug);

    if (page === null) {
      return NextResponse.json(
        { error: "status page not found", code: "STATUS_PAGE_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (!page.is_public) {
      return NextResponse.json(
        { error: "status page is not public", code: "STATUS_PAGE_NOT_PUBLIC" },
        { status: 404 },
      );
    }

    const pageId = page.id;

    const groupsResult = await pool.query<ComponentGroupRow>(
      `
        SELECT
          id::text,
          name,
          description,
          position,
          collapsed_by_default,
          created_at
        FROM component_groups
        WHERE status_page_id = $1
        ORDER BY position ASC, id ASC
      `,
      [pageId],
    );

    const componentsResult = await pool.query<ComponentRow>(
      `
        SELECT
          id::text,
          group_id::text AS group_id,
          name,
          description,
          current_status,
          position,
          is_visible,
          created_at,
          updated_at
        FROM components
        WHERE status_page_id = $1 AND is_visible = TRUE
        ORDER BY group_id ASC NULLS LAST, position ASC, id ASC
      `,
      [pageId],
    );

    const endpointsResult = await pool.query<EndpointRow>(
      `
        SELECT
          e.id::text,
          e.component_id::text,
          e.name,
          e.url,
          e.method,
          e.current_status,
          e.degraded_threshold_ms,
          e.is_public,
          e.created_at,
          e.updated_at,
          latest.last_checked_at,
          COALESCE(checks.recent_checks, '[]'::json) AS recent_checks,
          COALESCE(uptime.uptime_percentage_90d, 100.000)::float8 AS uptime_percentage_90d
        FROM endpoints e
        INNER JOIN components c ON c.id = e.component_id AND c.is_visible = TRUE
        LEFT JOIN LATERAL (
          SELECT uc.checked_at AS last_checked_at
          FROM uptime_checks uc
          WHERE uc.endpoint_id = e.id
          ORDER BY uc.checked_at DESC
          LIMIT 1
        ) latest ON TRUE
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'checked_at', recent.checked_at,
              'is_up', recent.is_up,
              'response_time_ms', recent.response_time_ms,
              'status_code', recent.status_code
            )
            ORDER BY recent.checked_at DESC
          ) AS recent_checks
          FROM (
            SELECT
              uc.checked_at,
              uc.is_up,
              uc.response_time_ms,
              uc.status_code
            FROM uptime_checks uc
            WHERE uc.endpoint_id = e.id
            ORDER BY uc.checked_at DESC
            LIMIT $2
          ) recent
        ) checks ON TRUE
        LEFT JOIN LATERAL (
          SELECT ROUND(AVG(ud.uptime_percentage), 3) AS uptime_percentage_90d
          FROM uptime_days ud
          WHERE ud.component_id = e.component_id
            AND ud.day >= CURRENT_DATE - INTERVAL '89 days'
        ) uptime ON TRUE
        WHERE e.status_page_id = $1 AND e.is_public = TRUE
        ORDER BY c.position ASC, e.id ASC
      `,
      [pageId, checksLimitResult.value],
    );

    const activeIncidentsResult = await pool.query<IncidentRow>(
      `
        SELECT
          i.id::text,
          i.title,
          i.description,
          i.status,
          i.impact,
          i.started_at,
          i.resolved_at,
          i.created_at,
          i.updated_at,
          COALESCE(affected.components, '[]'::json) AS affected_components,
          latest.latest_update
        FROM incidents i
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'id', c.id::text,
              'name', c.name,
              'current_status', c.current_status
            )
            ORDER BY c.position ASC, c.id ASC
          ) AS components
          FROM incident_components ic
          INNER JOIN components c ON c.id = ic.component_id AND c.is_visible = TRUE
          WHERE ic.incident_id = i.id
        ) affected ON TRUE
        LEFT JOIN LATERAL (
          SELECT json_build_object(
            'id', iu.id::text,
            'status', iu.status,
            'body', iu.body,
            'published_at', iu.published_at
          ) AS latest_update
          FROM incident_updates iu
          WHERE iu.incident_id = i.id
          ORDER BY iu.published_at DESC, iu.id DESC
          LIMIT 1
        ) latest ON TRUE
        WHERE i.status_page_id = $1 AND i.status <> 'resolved'
        ORDER BY i.started_at DESC, i.id DESC
        LIMIT 50
      `,
      [pageId],
    );

    const resolvedIncidentsResult = await pool.query<IncidentRow>(
      `
        SELECT
          i.id::text,
          i.title,
          i.description,
          i.status,
          i.impact,
          i.started_at,
          i.resolved_at,
          i.created_at,
          i.updated_at,
          COALESCE(affected.components, '[]'::json) AS affected_components,
          latest.latest_update
        FROM incidents i
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'id', c.id::text,
              'name', c.name,
              'current_status', c.current_status
            )
            ORDER BY c.position ASC, c.id ASC
          ) AS components
          FROM incident_components ic
          INNER JOIN components c ON c.id = ic.component_id AND c.is_visible = TRUE
          WHERE ic.incident_id = i.id
        ) affected ON TRUE
        LEFT JOIN LATERAL (
          SELECT json_build_object(
            'id', iu.id::text,
            'status', iu.status,
            'body', iu.body,
            'published_at', iu.published_at
          ) AS latest_update
          FROM incident_updates iu
          WHERE iu.incident_id = i.id
          ORDER BY iu.published_at DESC, iu.id DESC
          LIMIT 1
        ) latest ON TRUE
        WHERE i.status_page_id = $1 AND i.status = 'resolved'
        ORDER BY i.started_at DESC, i.id DESC
        LIMIT $2
      `,
      [pageId, incidentLimitResult.value],
    );

    const maintenancesResult = await pool.query<MaintenanceRow>(
      `
        SELECT
          m.id::text,
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
          COALESCE(affected.components, '[]'::json) AS affected_components,
          latest.latest_update
        FROM maintenances m
        LEFT JOIN LATERAL (
          SELECT json_agg(
            json_build_object(
              'id', c.id::text,
              'name', c.name,
              'current_status', c.current_status
            )
            ORDER BY c.position ASC, c.id ASC
          ) AS components
          FROM maintenance_components mc
          INNER JOIN components c ON c.id = mc.component_id AND c.is_visible = TRUE
          WHERE mc.maintenance_id = m.id
        ) affected ON TRUE
        LEFT JOIN LATERAL (
          SELECT json_build_object(
            'id', mu.id::text,
            'status', mu.status,
            'body', mu.body,
            'published_at', mu.published_at
          ) AS latest_update
          FROM maintenance_updates mu
          WHERE mu.maintenance_id = m.id
          ORDER BY mu.published_at DESC, mu.id DESC
          LIMIT 1
        ) latest ON TRUE
        WHERE m.status_page_id = $1
          AND m.status <> 'completed'
          AND m.scheduled_end >= NOW() - INTERVAL '1 hour'
        ORDER BY m.scheduled_start ASC, m.id ASC
        LIMIT 50
      `,
      [pageId],
    );

    const groupedComponents = attachComponentsToGroups(groupsResult.rows, componentsResult.rows);
    const overallStatus = deriveOverallStatus(
      componentsResult.rows,
      endpointsResult.rows,
      maintenancesResult.rows,
    );

    return NextResponse.json({
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        logo_text: page.logo_text,
        custom_domain: page.custom_domain,
        is_public: page.is_public,
        sms_enabled: page.sms_enabled,
        slack_enabled: page.slack_enabled,
        webhook_enabled: page.webhook_enabled,
        timezone: page.timezone,
        created_at: page.created_at,
        updated_at: page.updated_at,
      },
      overall_status: overallStatus,
      generated_at: page.generated_at,
      groups: groupedComponents.groups,
      ungrouped_components: groupedComponents.ungrouped_components,
      components: componentsResult.rows,
      endpoints: endpointsResult.rows,
      active_incidents: activeIncidentsResult.rows,
      resolved_incidents: resolvedIncidentsResult.rows,
      maintenances: maintenancesResult.rows,
    });
  } catch (error: any) {
    console.error("GET /api/public/status-pages/[slug] failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
