import { createRequire } from 'node:module';
import { NextRequest, NextResponse } from 'next/server';

type QueryResult<T> = {
  rows: T[];
};

type QueryablePool = {
  query<T = unknown>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
};

type PoolConstructor = new (config?: { connectionString?: string; ssl?: { rejectUnauthorized: boolean } }) => QueryablePool;

declare global {
  // eslint-disable-next-line no-var
  var __statusPagesApiPool: QueryablePool | undefined;
}

const require = createRequire(import.meta.url);

function createPool(): QueryablePool {
  const { Pool } = require('pg') as { Pool: PoolConstructor };
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  });
}

const pool = globalThis.__statusPagesApiPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__statusPagesApiPool = pool;
}

type DbId = string | number | bigint;
type DbDate = string | Date;
type DbNumeric = string | number | null;

type RouteContext = {
  params: Promise<{ slug?: string }>;
};

type PageRow = {
  id: DbId;
  name: string;
  slug: string;
  custom_domain: string | null;
  timezone: string;
  logo_url: string | null;
  main_site_url: string | null;
  footer_text: string;
  subscribe_email_enabled: boolean;
  subscribe_webhook_enabled: boolean;
  subscribe_rss_enabled: boolean;
  is_public: boolean;
};

type ComponentEndpointRow = {
  group_id: DbId | null;
  group_name: string | null;
  group_position: number | null;
  component_id: DbId;
  component_name: string;
  description: string | null;
  position: number;
  component_status: 'operational' | 'degraded' | 'outage' | 'paused' | 'maintenance';
  endpoint_id: DbId;
  endpoint_name: string;
  check_interval_minutes: number;
  current_status: 'operational' | 'degraded' | 'outage' | 'paused';
  last_checked_at: DbDate | null;
  last_response_time_ms: number | null;
  last_status_code: number | null;
};

type CheckRow = {
  id: DbId;
  endpoint_id: DbId;
  checked_at: DbDate;
  status: 'operational' | 'degraded' | 'outage' | 'paused';
  response_time_ms: number | null;
  status_code: number | null;
  error_message: string | null;
  region: string;
};

type Uptime24Row = {
  endpoint_id: DbId;
  uptime_percentage_24h: DbNumeric;
};

type UptimeDayRow = {
  endpoint_id: DbId;
  day: DbDate;
  uptime_percentage: DbNumeric;
  worst_status: 'operational' | 'degraded' | 'outage' | 'paused' | 'maintenance';
  total_checks: number;
};

type IncidentRow = {
  id: DbId;
  status_page_id: DbId;
  endpoint_id: DbId | null;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  impact: 'none' | 'minor' | 'major' | 'critical';
  started_at: DbDate;
  resolved_at: DbDate | null;
  created_at: DbDate;
  updated_at: DbDate;
};

type MaintenanceRow = {
  id: DbId;
  status_page_id: DbId;
  title: string;
  description: string;
  status: 'scheduled' | 'in_progress' | 'verifying' | 'completed' | 'cancelled';
  impact: 'none' | 'minor' | 'major' | 'critical';
  scheduled_start_at: DbDate;
  scheduled_end_at: DbDate;
  started_at: DbDate | null;
  completed_at: DbDate | null;
  created_at: DbDate;
  updated_at: DbDate;
};

type PublicCheck = Omit<CheckRow, 'id' | 'endpoint_id'> & {
  id: string;
  endpoint_id: string;
};

type PublicEndpoint = {
  endpoint_id: string;
  component_id: string;
  endpoint_name: string;
  check_interval_minutes: number;
  current_status: 'operational' | 'degraded' | 'outage' | 'paused';
  last_checked_at: DbDate | null;
  last_response_time_ms: number | null;
  last_status_code: number | null;
  uptime_24h_percentage: DbNumeric;
  recent_checks: PublicCheck[];
};

type PublicComponent = {
  component_id: string;
  component_name: string;
  description: string | null;
  position: number;
  component_status: 'operational' | 'degraded' | 'outage' | 'paused' | 'maintenance';
  endpoints: PublicEndpoint[];
};

type PublicComponentGroup = {
  group_id: string | null;
  group_name: string | null;
  group_position: number | null;
  components: PublicComponent[];
};

type ParseResult =
  | { ok: true; value: number }
  | { ok: false };

function validationError() {
  return NextResponse.json({ error: { code: 'validation_error' } }, { status: 422 });
}

function parsePositiveNumberParam(
  searchParams: URLSearchParams,
  name: string,
  defaultValue: number,
  maxValue: number,
  requireInteger: boolean,
): ParseResult {
  const raw = searchParams.get(name);
  if (raw === null || raw.trim() === '') {
    return { ok: true, value: defaultValue };
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false };
  }

  if (requireInteger && !Number.isInteger(value)) {
    return { ok: false };
  }

  return { ok: true, value: Math.min(value, maxValue) };
}

function publicIncident(row: IncidentRow) {
  return {
    id: String(row.id),
    status_page_id: String(row.status_page_id),
    endpoint_id: row.endpoint_id === null ? null : String(row.endpoint_id),
    title: row.title,
    description: row.description,
    status: row.status,
    impact: row.impact,
    started_at: row.started_at,
    resolved_at: row.resolved_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function publicMaintenance(row: MaintenanceRow) {
  return {
    id: String(row.id),
    status_page_id: String(row.status_page_id),
    title: row.title,
    description: row.description,
    status: row.status,
    impact: row.impact,
    scheduled_start_at: row.scheduled_start_at,
    scheduled_end_at: row.scheduled_end_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    if (typeof slug !== 'string' || slug.trim() === '' || slug.length > 200) {
      return NextResponse.json({ error: 'invalid_slug' }, { status: 400 });
    }

    const url = new URL(request.url);
    const historyHours = parsePositiveNumberParam(url.searchParams, 'history_hours', 24, 720, false);
    const checksPerEndpoint = parsePositiveNumberParam(url.searchParams, 'checks_per_endpoint', 50, 500, true);
    const incidentsLimit = parsePositiveNumberParam(url.searchParams, 'incidents_limit', 10, 100, true);

    if (!historyHours.ok || !checksPerEndpoint.ok || !incidentsLimit.ok) {
      return validationError();
    }

    const pageResult = await pool.query<PageRow>(
      `SELECT id,name,slug,custom_domain,timezone,logo_url,main_site_url,footer_text,subscribe_email_enabled,subscribe_webhook_enabled,subscribe_rss_enabled,is_public
       FROM status_pages
       WHERE slug=$1`,
      [slug],
    );

    const page = pageResult.rows[0];
    if (!page) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (!page.is_public) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const componentResult = await pool.query<ComponentEndpointRow>(
      `SELECT cg.id group_id,cg.name group_name,cg.position group_position,c.id component_id,c.name component_name,c.description,c.position,c.current_status component_status,e.id endpoint_id,e.name endpoint_name,e.check_interval_minutes,e.current_status,e.last_checked_at,e.last_response_time_ms,e.last_status_code
       FROM components c
       LEFT JOIN component_groups cg ON cg.id=c.group_id
       JOIN endpoints e ON e.component_id=c.id
       WHERE c.status_page_id=$1 AND c.is_public=TRUE AND e.is_active=TRUE
       ORDER BY cg.position NULLS LAST,c.position,e.name`,
      [page.id],
    );

    const componentGroups = new Map<string, PublicComponentGroup>();
    const components = new Map<string, PublicComponent>();
    const endpoints = new Map<string, PublicEndpoint>();

    for (const row of componentResult.rows) {
      const groupKey = row.group_id === null ? '__ungrouped__' : String(row.group_id);
      let group = componentGroups.get(groupKey);
      if (!group) {
        group = {
          group_id: row.group_id === null ? null : String(row.group_id),
          group_name: row.group_name,
          group_position: row.group_position,
          components: [],
        };
        componentGroups.set(groupKey, group);
      }

      const componentKey = String(row.component_id);
      let component = components.get(componentKey);
      if (!component) {
        component = {
          component_id: componentKey,
          component_name: row.component_name,
          description: row.description,
          position: row.position,
          component_status: row.component_status,
          endpoints: [],
        };
        components.set(componentKey, component);
        group.components.push(component);
      }

      const endpointKey = String(row.endpoint_id);
      if (!endpoints.has(endpointKey)) {
        const endpoint: PublicEndpoint = {
          endpoint_id: endpointKey,
          component_id: componentKey,
          endpoint_name: row.endpoint_name,
          check_interval_minutes: row.check_interval_minutes,
          current_status: row.current_status,
          last_checked_at: row.last_checked_at,
          last_response_time_ms: row.last_response_time_ms,
          last_status_code: row.last_status_code,
          uptime_24h_percentage: null,
          recent_checks: [],
        };
        endpoints.set(endpointKey, endpoint);
        component.endpoints.push(endpoint);
      }
    }

    const endpointIds = Array.from(endpoints.keys());
    let uptimeDays: Array<{
      endpoint_id: string;
      day: DbDate;
      uptime_percentage: DbNumeric;
      worst_status: UptimeDayRow['worst_status'];
      total_checks: number;
    }> = [];

    if (endpointIds.length > 0) {
      const checksResult = await pool.query<CheckRow>(
        `SELECT id,endpoint_id,checked_at,status,response_time_ms,status_code,error_message,region
         FROM (
           SELECT id,endpoint_id,checked_at,status,response_time_ms,status_code,error_message,region,
                  ROW_NUMBER() OVER (PARTITION BY endpoint_id ORDER BY checked_at DESC) AS rn
           FROM status_checks
           WHERE endpoint_id=ANY($1::bigint[]) AND checked_at >= NOW() - ($2 || ' hours')::interval
         ) recent_checks
         WHERE rn <= $3
         ORDER BY endpoint_id,checked_at DESC`,
        [endpointIds, String(historyHours.value), checksPerEndpoint.value],
      );

      for (const row of checksResult.rows) {
        const endpoint = endpoints.get(String(row.endpoint_id));
        if (endpoint) {
          endpoint.recent_checks.push({
            id: String(row.id),
            endpoint_id: String(row.endpoint_id),
            checked_at: row.checked_at,
            status: row.status,
            response_time_ms: row.response_time_ms,
            status_code: row.status_code,
            error_message: row.error_message,
            region: row.region,
          });
        }
      }

      const uptime24Result = await pool.query<Uptime24Row>(
        `SELECT endpoint_id, ROUND(100.0*COUNT(*) FILTER (WHERE status='operational')/NULLIF(COUNT(*),0),2) AS uptime_percentage_24h
         FROM status_checks
         WHERE endpoint_id=ANY($1::bigint[]) AND checked_at >= NOW()-INTERVAL '24 hours'
         GROUP BY endpoint_id`,
        [endpointIds],
      );

      for (const row of uptime24Result.rows) {
        const endpoint = endpoints.get(String(row.endpoint_id));
        if (endpoint) {
          endpoint.uptime_24h_percentage = row.uptime_percentage_24h;
        }
      }

      const uptimeDailyResult = await pool.query<UptimeDayRow>(
        `SELECT endpoint_id,day,uptime_percentage,worst_status,total_checks
         FROM uptime_daily
         WHERE endpoint_id=ANY($1::bigint[]) AND day >= CURRENT_DATE-INTERVAL '89 days'
         ORDER BY day,endpoint_id`,
        [endpointIds],
      );

      uptimeDays = uptimeDailyResult.rows.map((row) => ({
        endpoint_id: String(row.endpoint_id),
        day: row.day,
        uptime_percentage: row.uptime_percentage,
        worst_status: row.worst_status,
        total_checks: row.total_checks,
      }));
    }

    const activeIncidentsResult = await pool.query<IncidentRow>(
      `SELECT id,status_page_id,endpoint_id,title,description,status,impact,started_at,resolved_at,created_at,updated_at
       FROM incidents
       WHERE status_page_id=$1 AND status <> 'resolved'
       ORDER BY started_at DESC`,
      [page.id],
    );

    const recentIncidentsResult = await pool.query<IncidentRow>(
      `SELECT id,status_page_id,endpoint_id,title,description,status,impact,started_at,resolved_at,created_at,updated_at
       FROM incidents
       WHERE status_page_id=$1 AND status='resolved'
       ORDER BY started_at DESC
       LIMIT $2`,
      [page.id, incidentsLimit.value],
    );

    const maintenanceResult = await pool.query<MaintenanceRow>(
      `SELECT id,status_page_id,title,description,status,impact,scheduled_start_at,scheduled_end_at,started_at,completed_at,created_at,updated_at
       FROM scheduled_maintenances
       WHERE status_page_id=$1 AND status IN ('scheduled','in_progress','verifying') AND scheduled_end_at >= NOW()-INTERVAL '2 hours'
       ORDER BY scheduled_start_at ASC`,
      [page.id],
    );

    const endpointList = Array.from(endpoints.values());
    const hasInProgressMaintenance = maintenanceResult.rows.some((maintenance) => maintenance.status === 'in_progress');
    const hasOutage = endpointList.some((endpoint) => endpoint.current_status === 'outage');
    const hasDegraded = endpointList.some((endpoint) => endpoint.current_status === 'degraded');
    const allOperational = endpointList.length > 0 && endpointList.every((endpoint) => endpoint.current_status === 'operational');

    const overallStatus: 'operational' | 'degraded' | 'outage' | 'paused' =
      endpointList.length === 0
        ? 'paused'
        : hasInProgressMaintenance
          ? 'paused'
          : hasOutage
            ? 'outage'
            : hasDegraded
              ? 'degraded'
              : allOperational
                ? 'operational'
                : 'paused';

    return NextResponse.json({
      status_page: {
        id: String(page.id),
        name: page.name,
        slug: page.slug,
        custom_domain: page.custom_domain,
        timezone: page.timezone,
        logo_url: page.logo_url,
        main_site_url: page.main_site_url,
        footer_text: page.footer_text,
        subscribe_email_enabled: page.subscribe_email_enabled,
        subscribe_webhook_enabled: page.subscribe_webhook_enabled,
        subscribe_rss_enabled: page.subscribe_rss_enabled,
        is_public: page.is_public,
      },
      overall_status: overallStatus,
      component_groups: Array.from(componentGroups.values()),
      endpoints: endpointList,
      active_incidents: activeIncidentsResult.rows.map(publicIncident),
      recent_incidents: recentIncidentsResult.rows.map(publicIncident),
      scheduled_maintenances: maintenanceResult.rows.map(publicMaintenance),
      uptime_days: uptimeDays,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('GET /api/v1/status-pages/[slug] failed', error);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
