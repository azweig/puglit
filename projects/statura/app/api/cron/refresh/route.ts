import { NextRequest, NextResponse, after } from "next/server";
import { pool } from "@/lib/db";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type EndpointRow = {
  id: number | string;
  status_page_id: number | string;
  component_id: number | string;
  component_name: string;
  name: string;
  url: string;
  method: 'GET' | 'HEAD';
  expected_status_min: number;
  expected_status_max: number;
  degraded_threshold_ms: number;
  timeout_ms: number;
};

type ProbeResult = {
  checkedAt: Date;
  isUp: boolean;
  statusCode: number | null;
  responseTimeMs: number;
  errorMessage: string | null;
};

type JobStats = {
  mode: 'live' | 'mock';
  selected: number;
  checked: number;
  up: number;
  down: number;
  degraded: number;
  incidentsOpened: number;
  incidentsResolved: number;
};

const LIVE_PROBE_KEY_ENV = 'STATURA_PROBE_KEY';
const DEFAULT_LIMIT = 100;
const DEFAULT_CONCURRENCY = 25;

// Cadence notes:
// - Run this route every 60 seconds for normal uptime checks.
// - Keep endpoint timeout at 5-10 seconds to avoid overloading monitored services.
// - This product has no paid external provider; the live source is direct HTTPS probes
//   against user-configured endpoints. Set STATURA_PROBE_KEY to any non-empty value
//   in production to enable live DB-configured probes. When absent, the same write path
//   is exercised with inline mock endpoints/results for offline verification.
// - TLS expiry checks are intentionally not attempted here because the target DDL has
//   no TLS columns and global fetch does not expose certificate metadata.

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const supplied = request.nextUrl.searchParams.get('key') || request.headers.get('x-cron-secret');
    if (supplied !== cronSecret) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  const sync = request.nextUrl.searchParams.get('sync') === '1';

  if (sync) {
    const stats = await runRefreshJob();
    return NextResponse.json({ ok: true, scheduled: false, stats });
  }

  after(async () => {
    try {
      await runRefreshJob();
    } catch (error) {
      console.error('[statura-cron-refresh] failed', error);
    }
  });

  return NextResponse.json({ ok: true, scheduled: true });
}

async function runRefreshJob(): Promise<JobStats> {
  const useMock = !process.env[LIVE_PROBE_KEY_ENV];
  const stats: JobStats = {
    mode: useMock ? 'mock' : 'live',
    selected: 0,
    checked: 0,
    up: 0,
    down: 0,
    degraded: 0,
    incidentsOpened: 0,
    incidentsResolved: 0,
  };

  if (useMock) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const endpoints = await seedMockScope(client);
      await client.query('COMMIT');
      stats.selected = endpoints.length;

      const mockResults = buildMockProbeResults(endpoints);
      for (const item of mockResults) {
        const persistStats = await persistProbeResult(item.endpoint, item.result);
        mergeStats(stats, item.result, persistStats.endpointStatus, persistStats.incidentAction);
      }
      return stats;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  const limit = clampInt(Number(process.env.STATURA_MAX_ENDPOINTS || DEFAULT_LIMIT), 1, 1000);
  const concurrency = clampInt(Number(process.env.STATURA_PROBE_CONCURRENCY || DEFAULT_CONCURRENCY), 1, 200);
  const due = await selectDueEndpoints(limit);
  stats.selected = due.length;

  await mapLimit(due, concurrency, async (endpoint) => {
    const result = await probeEndpoint(endpoint);
    const persistStats = await persistProbeResult(endpoint, result);
    mergeStats(stats, result, persistStats.endpointStatus, persistStats.incidentAction);
  });

  return stats;
}

async function selectDueEndpoints(limit: number): Promise<EndpointRow[]> {
  const { rows } = await pool.query(
    `
      SELECT
        e.id,
        e.status_page_id,
        e.component_id,
        c.name AS component_name,
        e.name,
        e.url,
        e.method,
        e.expected_status_min,
        e.expected_status_max,
        e.degraded_threshold_ms,
        e.timeout_ms
      FROM endpoints e
      JOIN components c ON c.id = e.component_id
      WHERE e.is_public = TRUE
        AND e.url LIKE 'https://%'
        AND (e.last_checked_at IS NULL OR e.last_checked_at < NOW() - INTERVAL '60 seconds')
      ORDER BY e.last_checked_at NULLS FIRST, e.id
      LIMIT $1
    `,
    [limit],
  );
  return rows;
}

async function probeEndpoint(endpoint: EndpointRow): Promise<ProbeResult> {
  const checkedAt = new Date();
  const timeoutMs = clampInt(Number(endpoint.timeout_ms || 10000), 1000, 30000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const response = await fetch(endpoint.url, {
      method: endpoint.method || 'GET',
      redirect: 'follow',
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'user-agent': 'Statura-Probe/1.0',
        accept: '*/*',
      },
    });

    const responseTimeMs = Math.max(0, Date.now() - started);
    const statusCode = response.status;
    const isUp = statusCode >= endpoint.expected_status_min && statusCode <= endpoint.expected_status_max;

    return {
      checkedAt,
      isUp,
      statusCode,
      responseTimeMs,
      errorMessage: isUp ? null : truncateText(`non_2xx_3xx: expected ${endpoint.expected_status_min}-${endpoint.expected_status_max}, got ${statusCode}`, 500),
    };
  } catch (error) {
    const responseTimeMs = Math.max(0, Date.now() - started);
    const errorMessage = classifyFetchError(error);
    return {
      checkedAt,
      isUp: false,
      statusCode: null,
      responseTimeMs,
      errorMessage: truncateText(errorMessage, 500),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function persistProbeResult(
  endpoint: EndpointRow,
  result: ProbeResult,
): Promise<{ endpointStatus: 'operational' | 'degraded' | 'down' | 'unknown'; incidentAction: 'opened' | 'resolved' | null }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `
        INSERT INTO uptime_checks (
          endpoint_id,
          checked_at,
          is_up,
          response_time_ms,
          status_code,
          error_message
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [endpoint.id, result.checkedAt, result.isUp, result.responseTimeMs, result.statusCode, result.errorMessage],
    );

    const recent = await client.query(
      `
        SELECT is_up, response_time_ms
        FROM uptime_checks
        WHERE endpoint_id = $1
        ORDER BY checked_at DESC
        LIMIT 3
      `,
      [endpoint.id],
    );

    const consecutiveFailures = countLeading(recent.rows, (row) => row.is_up === false);
    const consecutiveSuccesses = countLeading(recent.rows, (row) => row.is_up === true);

    let endpointStatus: 'operational' | 'degraded' | 'down' | 'unknown' = 'unknown';
    if (!result.isUp && consecutiveFailures >= 2) {
      endpointStatus = 'down';
    } else if (!result.isUp) {
      endpointStatus = 'degraded';
    } else if (result.responseTimeMs > endpoint.degraded_threshold_ms) {
      endpointStatus = 'degraded';
    } else {
      endpointStatus = 'operational';
    }

    await client.query(
      `
        UPDATE endpoints
        SET current_status = $1,
            last_checked_at = $2,
            updated_at = NOW()
        WHERE id = $3
      `,
      [endpointStatus, result.checkedAt, endpoint.id],
    );

    const componentStatus = await recomputeComponentStatus(client, endpoint.component_id);
    let incidentAction: 'opened' | 'resolved' | null = null;

    if (endpointStatus === 'down') {
      const opened = await openAutomaticIncidentIfNeeded(client, endpoint, componentStatus);
      incidentAction = opened ? 'opened' : null;
    } else if (consecutiveSuccesses >= 2) {
      const resolved = await resolveAutomaticIncidentsIfRecovered(client, endpoint);
      incidentAction = resolved ? 'resolved' : null;
    }

    await upsertUptimeDay(client, endpoint.component_id);

    await client.query('COMMIT');
    return { endpointStatus, incidentAction };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function recomputeComponentStatus(client: any, componentId: number | string): Promise<string> {
  const { rows } = await client.query(
    `
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE current_status = 'down')::INT AS down_count,
        COUNT(*) FILTER (WHERE current_status = 'degraded')::INT AS degraded_count,
        COUNT(*) FILTER (WHERE current_status = 'unknown')::INT AS unknown_count
      FROM endpoints
      WHERE component_id = $1
        AND is_public = TRUE
    `,
    [componentId],
  );

  const total = Number(rows[0]?.total || 0);
  const downCount = Number(rows[0]?.down_count || 0);
  const degradedCount = Number(rows[0]?.degraded_count || 0);
  const unknownCount = Number(rows[0]?.unknown_count || 0);

  let componentStatus = 'operational';
  if (total > 0 && downCount / total >= 0.5) {
    componentStatus = 'major_outage';
  } else if (downCount > 0) {
    componentStatus = 'partial_outage';
  } else if (degradedCount > 0 || unknownCount > 0) {
    componentStatus = 'degraded_performance';
  }

  await client.query(
    `
      UPDATE components
      SET current_status = $1,
          updated_at = NOW()
      WHERE id = $2
    `,
    [componentStatus, componentId],
  );

  return componentStatus;
}

async function openAutomaticIncidentIfNeeded(client: any, endpoint: EndpointRow, componentStatus: string): Promise<boolean> {
  const existing = await client.query(
    `
      SELECT i.id
      FROM incidents i
      JOIN incident_components ic ON ic.incident_id = i.id
      WHERE i.status_page_id = $1
        AND ic.component_id = $2
        AND i.status <> 'resolved'
      ORDER BY i.started_at DESC
      LIMIT 1
    `,
    [endpoint.status_page_id, endpoint.component_id],
  );

  if (existing.rowCount > 0) {
    return false;
  }

  const impact = componentStatus === 'major_outage' ? 'major' : 'minor';
  const incident = await client.query(
    `
      INSERT INTO incidents (
        status_page_id,
        title,
        description,
        status,
        impact,
        started_at,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, 'investigating', $4, NOW(), NOW(), NOW())
      RETURNING id
    `,
    [
      endpoint.status_page_id,
      `${endpoint.component_name} outage detected`,
      `Statura detected consecutive failed HTTPS checks for ${endpoint.name} (${endpoint.url}).`,
      impact,
    ],
  );

  const incidentId = incident.rows[0].id;

  await client.query(
    `
      INSERT INTO incident_components (incident_id, component_id)
      VALUES ($1, $2)
      ON CONFLICT (incident_id, component_id) DO NOTHING
    `,
    [incidentId, endpoint.component_id],
  );

  await client.query(
    `
      INSERT INTO incident_updates (incident_id, status, body, published_at, created_at)
      VALUES ($1, 'investigating', $2, NOW(), NOW())
    `,
    [incidentId, `Automated monitoring detected that ${endpoint.name} is not responding as expected.`],
  );

  return true;
}

async function resolveAutomaticIncidentsIfRecovered(client: any, endpoint: EndpointRow): Promise<boolean> {
  const active = await client.query(
    `
      SELECT i.id
      FROM incidents i
      JOIN incident_components ic ON ic.incident_id = i.id
      WHERE i.status_page_id = $1
        AND ic.component_id = $2
        AND i.status <> 'resolved'
      ORDER BY i.started_at DESC
    `,
    [endpoint.status_page_id, endpoint.component_id],
  );

  if (active.rowCount === 0) {
    return false;
  }

  for (const incident of active.rows) {
    await client.query(
      `
        UPDATE incidents
        SET status = 'resolved',
            resolved_at = COALESCE(resolved_at, NOW()),
            updated_at = NOW()
        WHERE id = $1
      `,
      [incident.id],
    );

    await client.query(
      `
        INSERT INTO incident_updates (incident_id, status, body, published_at, created_at)
        VALUES ($1, 'resolved', $2, NOW(), NOW())
      `,
      [incident.id, `Automated monitoring confirmed that ${endpoint.name} has recovered.`],
    );
  }

  return true;
}

async function upsertUptimeDay(client: any, componentId: number | string): Promise<void> {
  await client.query(
    `
      WITH stats AS (
        SELECT
          e.component_id,
          (NOW() AT TIME ZONE 'UTC')::DATE AS day,
          COUNT(uc.id)::INT AS checks_count,
          COUNT(uc.id) FILTER (WHERE uc.is_up)::INT AS up_count,
          COUNT(uc.id) FILTER (WHERE NOT uc.is_up)::INT AS down_count
        FROM endpoints e
        LEFT JOIN uptime_checks uc
          ON uc.endpoint_id = e.id
         AND uc.checked_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
         AND uc.checked_at < (date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day') AT TIME ZONE 'UTC'
        WHERE e.component_id = $1
        GROUP BY e.component_id
      ), calculated AS (
        SELECT
          component_id,
          day,
          CASE
            WHEN checks_count = 0 THEN 100::NUMERIC(6,3)
            ELSE ROUND(((up_count::NUMERIC / checks_count::NUMERIC) * 100), 3)::NUMERIC(6,3)
          END AS uptime_percentage,
          CASE
            WHEN checks_count = 0 THEN 'no_data'
            WHEN down_count = 0 THEN 'operational'
            WHEN (up_count::NUMERIC / checks_count::NUMERIC) >= 0.95 THEN 'degraded_performance'
            WHEN up_count > 0 THEN 'partial_outage'
            ELSE 'major_outage'
          END AS status,
          checks_count,
          down_count AS down_minutes
        FROM stats
      )
      INSERT INTO uptime_days (
        component_id,
        day,
        uptime_percentage,
        status,
        checks_count,
        down_minutes,
        created_at,
        updated_at
      )
      SELECT component_id, day, uptime_percentage, status, checks_count, down_minutes, NOW(), NOW()
      FROM calculated
      ON CONFLICT (component_id, day) DO UPDATE
      SET uptime_percentage = EXCLUDED.uptime_percentage,
          status = EXCLUDED.status,
          checks_count = EXCLUDED.checks_count,
          down_minutes = EXCLUDED.down_minutes,
          updated_at = NOW()
    `,
    [componentId],
  );
}

async function seedMockScope(client: any): Promise<EndpointRow[]> {
  const slug = 'statura-mock';

  await client.query(
    `
      DELETE FROM status_pages
      WHERE slug = $1
    `,
    [slug],
  );

  const page = await client.query(
    `
      INSERT INTO status_pages (
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
        updated_at
      ) VALUES ($1, $2, $3, NULL, TRUE, FALSE, FALSE, FALSE, 'UTC', NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE
      SET title = EXCLUDED.title,
          logo_text = EXCLUDED.logo_text,
          is_public = EXCLUDED.is_public,
          timezone = EXCLUDED.timezone,
          updated_at = NOW()
      RETURNING id
    `,
    ['Statura Demo Status', slug, 'Statura'],
  );
  const statusPageId = page.rows[0].id;

  const group = await client.query(
    `
      INSERT INTO component_groups (
        status_page_id,
        name,
        description,
        position,
        collapsed_by_default,
        created_at
      ) VALUES ($1, $2, $3, 0, FALSE, NOW())
      RETURNING id
    `,
    [statusPageId, 'Core Services', 'Offline mock services used to verify the ingestion pipeline.'],
  );
  const groupId = group.rows[0].id;

  const componentDefinitions = [
    { name: 'Public API', description: 'Primary REST API', position: 0, endpointName: 'API Health', url: 'https://example.com/api/health' },
    { name: 'Checkout API', description: 'Payment and checkout flow', position: 1, endpointName: 'Checkout Health', url: 'https://example.com/checkout/health' },
    { name: 'Docs Site', description: 'Customer documentation', position: 2, endpointName: 'Docs Home', url: 'https://example.com/docs' },
  ];

  const endpoints: EndpointRow[] = [];
  for (const definition of componentDefinitions) {
    const component = await client.query(
      `
        INSERT INTO components (
          status_page_id,
          group_id,
          name,
          description,
          current_status,
          position,
          is_visible,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, 'operational', $5, TRUE, NOW(), NOW())
        RETURNING id
      `,
      [statusPageId, groupId, definition.name, definition.description, definition.position],
    );
    const componentId = component.rows[0].id;

    const endpoint = await client.query(
      `
        INSERT INTO endpoints (
          status_page_id,
          component_id,
          name,
          url,
          method,
          current_status,
          expected_status_min,
          expected_status_max,
          degraded_threshold_ms,
          timeout_ms,
          is_public,
          last_checked_at,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, 'GET', 'unknown', 200, 399, 1500, 10000, TRUE, NULL, NOW(), NOW())
        RETURNING
          id,
          status_page_id,
          component_id,
          name,
          url,
          method,
          expected_status_min,
          expected_status_max,
          degraded_threshold_ms,
          timeout_ms
      `,
      [statusPageId, componentId, definition.endpointName, definition.url],
    );

    endpoints.push({
      ...endpoint.rows[0],
      component_name: definition.name,
    });
  }

  return endpoints;
}

function buildMockProbeResults(endpoints: EndpointRow[]): Array<{ endpoint: EndpointRow; result: ProbeResult }> {
  const now = Date.now();
  const items: Array<{ endpoint: EndpointRow; result: ProbeResult }> = [];

  for (const endpoint of endpoints) {
    if (endpoint.name === 'Checkout Health') {
      items.push({
        endpoint,
        result: {
          checkedAt: new Date(now - 10_000),
          isUp: false,
          statusCode: 503,
          responseTimeMs: 2300,
          errorMessage: 'non_2xx_3xx: expected 200-399, got 503',
        },
      });
      items.push({
        endpoint,
        result: {
          checkedAt: new Date(now),
          isUp: false,
          statusCode: 503,
          responseTimeMs: 2210,
          errorMessage: 'non_2xx_3xx: expected 200-399, got 503',
        },
      });
    } else if (endpoint.name === 'Docs Home') {
      items.push({
        endpoint,
        result: {
          checkedAt: new Date(now),
          isUp: true,
          statusCode: 200,
          responseTimeMs: 1840,
          errorMessage: null,
        },
      });
    } else {
      items.push({
        endpoint,
        result: {
          checkedAt: new Date(now),
          isUp: true,
          statusCode: 200,
          responseTimeMs: 124,
          errorMessage: null,
        },
      });
    }
  }

  return items;
}

function classifyFetchError(error: unknown): string {
  const anyError = error as { name?: string; message?: string; code?: string; cause?: { code?: string; message?: string } };
  const name = anyError?.name || '';
  const code = anyError?.code || anyError?.cause?.code || '';
  const rawMessage = anyError?.message || anyError?.cause?.message || String(error);
  const message = rawMessage.replace(/\s+/g, ' ').trim();
  const lower = `${name} ${code} ${message}`.toLowerCase();

  if (name === 'AbortError' || lower.includes('aborted') || lower.includes('timeout')) {
    return `timeout: ${message || 'request timed out'}`;
  }
  if (lower.includes('enotfound') || lower.includes('dns')) {
    return `dns_error: ${message}`;
  }
  if (lower.includes('certificate') || lower.includes('tls') || lower.includes('ssl')) {
    return `tls_error: ${message}`;
  }
  if (lower.includes('econnrefused') || lower.includes('connection refused')) {
    return `connection_refused: ${message}`;
  }
  return `network_error: ${message}`;
}

function countLeading<T>(rows: T[], predicate: (row: T) => boolean): number {
  let count = 0;
  for (const row of rows) {
    if (!predicate(row)) break;
    count += 1;
  }
  return count;
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength - 1);
}

function mergeStats(
  stats: JobStats,
  result: ProbeResult,
  endpointStatus: 'operational' | 'degraded' | 'down' | 'unknown',
  incidentAction: 'opened' | 'resolved' | null,
): void {
  stats.checked += 1;
  if (result.isUp) stats.up += 1;
  else stats.down += 1;
  if (endpointStatus === 'degraded') stats.degraded += 1;
  if (incidentAction === 'opened') stats.incidentsOpened += 1;
  if (incidentAction === 'resolved') stats.incidentsResolved += 1;
}

async function mapLimit<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(workers);
}
