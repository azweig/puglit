import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import config from '@/domain.config';

type EndpointMethod = 'GET' | 'HEAD';
type EndpointRunStatus = 'operational' | 'degraded' | 'down';
type ComponentStatus = 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'under_maintenance';

interface EndpointRow {
  id: string;
  component_id: string;
  url: string;
  method: EndpointMethod;
  expected_status_min: number;
  expected_status_max: number;
  degraded_threshold_ms: number;
  timeout_ms: number;
}

interface EndpointCheckResult {
  isUp: boolean;
  responseTimeMs: number;
  statusCode: number | null;
  errorMessage: string | null;
  endpointStatus: EndpointRunStatus;
}

interface ComponentEndpointAggregateRow {
  total_count: number;
  down_count: number;
  degraded_count: number;
}

interface ActiveMaintenanceRow {
  has_active: boolean;
}

function getConfiguredMonitorSecret(): string | null {
  const monitorConfig = config as unknown as { monitorSecret?: unknown };
  return typeof monitorConfig.monitorSecret === 'string' && monitorConfig.monitorSecret.length > 0
    ? monitorConfig.monitorSecret
    : null;
}

function clampInteger(value: number, fallback: number, min: number, max: number): number {
  if (!Number.isInteger(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, min), max);
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength);
}

function errorToMessage(error: unknown, timeoutMs: number): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return `timeout after ${timeoutMs}ms`;
    }
    return truncate(error.message.length > 0 ? error.message : error.name, 500);
  }
  return 'request failed';
}

function normalizeExpectedRange(endpoint: EndpointRow): { minStatus: number; maxStatus: number } {
  const minStatus = clampInteger(endpoint.expected_status_min, 200, 100, 599);
  const fallbackMax = minStatus <= 399 ? 399 : minStatus;
  const candidateMax = clampInteger(endpoint.expected_status_max, fallbackMax, 100, 599);
  return {
    minStatus,
    maxStatus: candidateMax >= minStatus ? candidateMax : fallbackMax,
  };
}

async function runEndpointCheck(endpoint: EndpointRow): Promise<EndpointCheckResult> {
  const timeoutMs = clampInteger(endpoint.timeout_ms, 10000, 100, 60000);
  const degradedThresholdMs = clampInteger(endpoint.degraded_threshold_ms, 1500, 0, 600000);
  const { minStatus, maxStatus } = normalizeExpectedRange(endpoint);

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
    });

    const responseTimeMs = Math.max(0, Date.now() - startedAt);
    const statusCode = response.status;
    const isUp = statusCode >= minStatus && statusCode <= maxStatus;
    const endpointStatus: EndpointRunStatus = !isUp
      ? 'down'
      : responseTimeMs > degradedThresholdMs
        ? 'degraded'
        : 'operational';

    return {
      isUp,
      responseTimeMs,
      statusCode,
      errorMessage: null,
      endpointStatus,
    };
  } catch (error: unknown) {
    const responseTimeMs = Math.max(0, Date.now() - startedAt);
    return {
      isUp: false,
      responseTimeMs,
      statusCode: null,
      errorMessage: errorToMessage(error, timeoutMs),
      endpointStatus: 'down',
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function persistEndpointResult(endpoint: EndpointRow, result: EndpointCheckResult): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO uptime_checks (endpoint_id, is_up, response_time_ms, status_code, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [endpoint.id, result.isUp, result.responseTimeMs, result.statusCode, result.errorMessage],
    );
    await client.query(
      `UPDATE endpoints
       SET current_status = $2, last_checked_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [endpoint.id, result.endpointStatus],
    );
    await client.query('COMMIT');
  } catch (error: unknown) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError: unknown) {
      console.error('monitor run-checks rollback failed', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

function deriveComponentStatus(hasActiveMaintenance: boolean, aggregate: ComponentEndpointAggregateRow): ComponentStatus {
  if (hasActiveMaintenance) {
    return 'under_maintenance';
  }
  if (aggregate.total_count > 0 && aggregate.down_count === aggregate.total_count) {
    return 'major_outage';
  }
  if (aggregate.down_count > 0) {
    return 'partial_outage';
  }
  if (aggregate.degraded_count > 0) {
    return 'degraded_performance';
  }
  return 'operational';
}

async function recalculateComponent(componentId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const maintenanceResult = await client.query<ActiveMaintenanceRow>(
      `SELECT EXISTS (
         SELECT 1
         FROM maintenances m
         JOIN maintenance_components mc ON mc.maintenance_id = m.id
         WHERE mc.component_id = $1
           AND m.status IN ('scheduled', 'in_progress', 'verifying')
           AND NOW() >= m.scheduled_start
           AND NOW() <= m.scheduled_end
       ) AS has_active`,
      [componentId],
    );
    const hasActiveMaintenance = maintenanceResult.rows[0]?.has_active === true;

    const aggregateResult = await client.query<ComponentEndpointAggregateRow>(
      `SELECT
         COUNT(*)::int AS total_count,
         (COUNT(*) FILTER (WHERE current_status = 'down'))::int AS down_count,
         (COUNT(*) FILTER (WHERE current_status = 'degraded'))::int AS degraded_count
       FROM endpoints
       WHERE component_id = $1`,
      [componentId],
    );

    const aggregate = aggregateResult.rows[0] ?? { total_count: 0, down_count: 0, degraded_count: 0 };
    const componentStatus = deriveComponentStatus(hasActiveMaintenance, aggregate);

    await client.query(
      `UPDATE components
       SET current_status = $2, updated_at = NOW()
       WHERE id = $1`,
      [componentId, componentStatus],
    );

    await client.query(
      `WITH daily AS (
         SELECT
           COUNT(uc.id)::int AS total_checks,
           (COUNT(uc.id) FILTER (WHERE uc.is_up))::int AS up_checks,
           (COUNT(uc.id) FILTER (WHERE NOT uc.is_up))::int AS down_checks,
           (COUNT(uc.id) FILTER (WHERE uc.is_up AND uc.response_time_ms > e.degraded_threshold_ms))::int AS degraded_checks
         FROM endpoints e
         LEFT JOIN uptime_checks uc
           ON uc.endpoint_id = e.id
          AND uc.checked_at >= CURRENT_DATE
          AND uc.checked_at < CURRENT_DATE + INTERVAL '1 day'
         WHERE e.component_id = $1
       )
       INSERT INTO uptime_days (component_id, day, uptime_percentage, status, checks_count, down_minutes, updated_at)
       SELECT
         $1::bigint,
         CURRENT_DATE,
         CASE
           WHEN total_checks = 0 THEN 100.000::numeric
           ELSE ROUND((100.0::numeric * up_checks::numeric / total_checks::numeric), 3)
         END,
         CASE
           WHEN $2::boolean THEN 'under_maintenance'
           WHEN total_checks = 0 THEN 'no_data'
           WHEN down_checks = total_checks THEN 'major_outage'
           WHEN down_checks > 0 THEN 'partial_outage'
           WHEN degraded_checks > 0 THEN 'degraded_performance'
           ELSE 'operational'
         END,
         total_checks,
         down_checks,
         NOW()
       FROM daily
       ON CONFLICT (component_id, day)
       DO UPDATE SET
         uptime_percentage = EXCLUDED.uptime_percentage,
         status = EXCLUDED.status,
         checks_count = EXCLUDED.checks_count,
         down_minutes = EXCLUDED.down_minutes,
         updated_at = NOW()`,
      [componentId, hasActiveMaintenance],
    );

    await client.query('COMMIT');
  } catch (error: unknown) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError: unknown) {
      console.error('monitor component recalculation rollback failed', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  try {
    const monitorSecret = getConfiguredMonitorSecret();
    if (monitorSecret !== null && request.headers.get('x-monitor-secret') !== monitorSecret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const endpointsResult = await pool.query<EndpointRow>(
      `SELECT
         e.id,
         e.component_id,
         e.url,
         e.method,
         e.expected_status_min,
         e.expected_status_max,
         e.degraded_threshold_ms,
         e.timeout_ms
       FROM endpoints e
       JOIN status_pages sp ON sp.id = e.status_page_id
       WHERE sp.is_public = TRUE
       ORDER BY e.id ASC`,
    );

    let checked = 0;
    let up = 0;
    let down = 0;
    let degraded = 0;
    const affectedComponentIds = new Set<string>();

    for (const endpoint of endpointsResult.rows) {
      const result = await runEndpointCheck(endpoint);
      await persistEndpointResult(endpoint, result);

      checked += 1;
      if (result.isUp) {
        up += 1;
      } else {
        down += 1;
      }
      if (result.endpointStatus === 'degraded') {
        degraded += 1;
      }
      affectedComponentIds.add(endpoint.component_id);
    }

    for (const componentId of affectedComponentIds) {
      await recalculateComponent(componentId);
    }

    return NextResponse.json({ checked, up, down, degraded }, { status: 200 });
  } catch (error: unknown) {
    console.error('monitor run-checks failed', error);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
