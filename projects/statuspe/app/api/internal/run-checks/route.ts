import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

type EndpointMethod = 'GET' | 'HEAD' | 'POST';
type CheckStatus = 'operational' | 'degraded' | 'outage' | 'paused';
type EndpointCurrentStatus = CheckStatus;
type DbInteger = number | string;

interface EndpointRow {
  id: DbInteger;
  component_id: DbInteger;
  url: string;
  method: string;
  expected_status_min: DbInteger;
  expected_status_max: DbInteger;
  timeout_ms: DbInteger;
  region: string;
  is_active: boolean | string;
  current_status: string;
  consecutive_failures: DbInteger;
  consecutive_successes: DbInteger;
}

interface MonitoredEndpoint {
  id: number;
  componentId: number;
  url: string;
  method: EndpointMethod;
  expectedStatusMin: number;
  expectedStatusMax: number;
  timeoutMs: number;
  region: string;
  isActive: boolean;
  currentStatus: EndpointCurrentStatus;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
}

interface MeasuredCheck {
  status: CheckStatus;
  responseTimeMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}

interface RunCheckResult {
  endpoint_id: number;
  component_id: number;
  status: CheckStatus;
  current_status: EndpointCurrentStatus;
  response_time_ms: number | null;
  status_code: number | null;
  error_message: string | null;
  region: string;
}

function readInteger(value: DbInteger, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`invalid ${fieldName}`);
  }
  return Math.trunc(parsed);
}

function readBoolean(value: boolean | string, fieldName: string): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new Error(`invalid ${fieldName}`);
}

function readMethod(value: string): EndpointMethod {
  if (value === 'GET' || value === 'HEAD' || value === 'POST') {
    return value;
  }
  throw new Error('invalid method');
}

function isEndpointCurrentStatus(value: string): value is EndpointCurrentStatus {
  return value === 'operational' || value === 'degraded' || value === 'outage' || value === 'paused';
}

function normalizeEndpoint(row: EndpointRow): MonitoredEndpoint {
  const id = readInteger(row.id, 'id');
  const componentId = readInteger(row.component_id, 'component_id');
  const expectedStatusMin = readInteger(row.expected_status_min, 'expected_status_min');
  const expectedStatusMax = readInteger(row.expected_status_max, 'expected_status_max');
  const timeoutMs = readInteger(row.timeout_ms, 'timeout_ms');

  if (id <= 0) {
    throw new Error('invalid endpoint id');
  }
  if (componentId <= 0) {
    throw new Error('invalid component_id');
  }
  if (typeof row.url !== 'string' || row.url.length === 0 || row.url.length > 2048 || !row.url.startsWith('https://')) {
    throw new Error('invalid endpoint url');
  }
  if (expectedStatusMin < 100 || expectedStatusMin > 599 || expectedStatusMax < 100 || expectedStatusMax > 599 || expectedStatusMin > expectedStatusMax) {
    throw new Error('invalid expected status range');
  }
  if (timeoutMs < 1000 || timeoutMs > 60000) {
    throw new Error('invalid timeout_ms');
  }
  if (typeof row.region !== 'string' || row.region.length === 0 || row.region.length > 100) {
    throw new Error('invalid region');
  }
  if (!isEndpointCurrentStatus(row.current_status)) {
    throw new Error('invalid current_status');
  }

  return {
    id,
    componentId,
    url: row.url,
    method: readMethod(row.method),
    expectedStatusMin,
    expectedStatusMax,
    timeoutMs,
    region: row.region,
    isActive: readBoolean(row.is_active, 'is_active'),
    currentStatus: row.current_status,
    consecutiveFailures: Math.max(0, readInteger(row.consecutive_failures, 'consecutive_failures')),
    consecutiveSuccesses: Math.max(0, readInteger(row.consecutive_successes, 'consecutive_successes')),
  };
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength);
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return truncate(error.message, 500);
  }
  return 'request failed';
}

async function measureEndpoint(endpoint: MonitoredEndpoint): Promise<MeasuredCheck> {
  const controller = new AbortController();
  let timeoutTriggered = false;
  const startedAt = Date.now();
  const timeoutId = setTimeout(() => {
    timeoutTriggered = true;
    controller.abort();
  }, endpoint.timeoutMs);

  try {
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'follow',
    });
    const responseTimeMs = Math.max(0, Date.now() - startedAt);
    const statusCode = response.status;
    const statusInRange = statusCode >= endpoint.expectedStatusMin && statusCode <= endpoint.expectedStatusMax;

    if (!statusInRange) {
      return {
        status: 'outage',
        responseTimeMs,
        statusCode,
        errorMessage: truncate(`unexpected status ${statusCode}`, 500),
      };
    }

    if (responseTimeMs > endpoint.timeoutMs * 0.8) {
      return {
        status: 'degraded',
        responseTimeMs,
        statusCode,
        errorMessage: null,
      };
    }

    return {
      status: 'operational',
      responseTimeMs,
      statusCode,
      errorMessage: null,
    };
  } catch (error: any) {
    const responseTimeMs = Math.max(0, Date.now() - startedAt);
    return {
      status: 'outage',
      responseTimeMs,
      statusCode: null,
      errorMessage: timeoutTriggered || controller.signal.aborted ? `timeout after ${endpoint.timeoutMs}ms` : errorToMessage(error),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function nextCounters(endpoint: MonitoredEndpoint, measuredStatus: CheckStatus): { failures: number; successes: number } {
  if (measuredStatus === 'outage') {
    return {
      failures: endpoint.consecutiveFailures + 1,
      successes: 0,
    };
  }

  return {
    failures: 0,
    successes: endpoint.consecutiveSuccesses + 1,
  };
}

function applyHysteresis(endpoint: MonitoredEndpoint, measuredStatus: CheckStatus, failures: number, successes: number): EndpointCurrentStatus {
  if (!endpoint.isActive) {
    return 'paused';
  }

  if (measuredStatus === 'outage') {
    if (failures >= 2) {
      return 'outage';
    }
    return endpoint.currentStatus === 'outage' ? 'outage' : 'degraded';
  }

  if (measuredStatus === 'degraded') {
    return 'degraded';
  }

  if (successes >= 2) {
    return 'operational';
  }

  if (endpoint.currentStatus === 'outage' || endpoint.currentStatus === 'degraded') {
    return endpoint.currentStatus;
  }

  return 'operational';
}

async function persistCheck(endpoint: MonitoredEndpoint, measured: MeasuredCheck): Promise<RunCheckResult> {
  const counters = nextCounters(endpoint, measured.status);
  const currentStatus = applyHysteresis(endpoint, measured.status, counters.failures, counters.successes);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO status_checks (endpoint_id, status, response_time_ms, status_code, error_message, region)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [endpoint.id, measured.status, measured.responseTimeMs, measured.statusCode, measured.errorMessage, endpoint.region],
    );

    await client.query(
      `UPDATE endpoints
       SET current_status = $1,
           last_checked_at = NOW(),
           last_response_time_ms = $2,
           last_status_code = $3,
           consecutive_failures = $4,
           consecutive_successes = $5,
           updated_at = NOW()
       WHERE id = $6`,
      [currentStatus, measured.responseTimeMs, measured.statusCode, counters.failures, counters.successes, endpoint.id],
    );

    await client.query(
      `UPDATE components AS c
       SET current_status = derived.current_status,
           updated_at = NOW()
       FROM (
         SELECT
           $1::bigint AS component_id,
           CASE
             WHEN COALESCE(BOOL_OR(e.current_status = 'outage'), FALSE) THEN 'outage'
             WHEN COALESCE(BOOL_OR(e.current_status = 'degraded'), FALSE) THEN 'degraded'
             ELSE 'operational'
           END AS current_status
         FROM endpoints AS e
         WHERE e.component_id = $1 AND e.is_active = TRUE
       ) AS derived
       WHERE c.id = derived.component_id`,
      [endpoint.componentId],
    );

    await client.query(
      `INSERT INTO uptime_daily (
         endpoint_id,
         day,
         uptime_percentage,
         total_checks,
         operational_checks,
         degraded_checks,
         outage_checks,
         worst_status,
         updated_at
       )
       SELECT
         $1::bigint,
         CURRENT_DATE,
         CASE
           WHEN COUNT(*) = 0 THEN NULL
           ELSE ROUND(((COUNT(*) FILTER (WHERE status IN ('operational', 'degraded')))::numeric * 100.0 / COUNT(*)::numeric), 2)
         END,
         COUNT(*)::integer,
         (COUNT(*) FILTER (WHERE status = 'operational'))::integer,
         (COUNT(*) FILTER (WHERE status = 'degraded'))::integer,
         (COUNT(*) FILTER (WHERE status = 'outage'))::integer,
         CASE
           WHEN COUNT(*) FILTER (WHERE status = 'outage') > 0 THEN 'outage'
           WHEN COUNT(*) FILTER (WHERE status = 'degraded') > 0 THEN 'degraded'
           WHEN COUNT(*) FILTER (WHERE status = 'paused') > 0 AND COUNT(*) FILTER (WHERE status IN ('operational', 'degraded', 'outage')) = 0 THEN 'paused'
           ELSE 'operational'
         END,
         NOW()
       FROM status_checks
       WHERE endpoint_id = $1
         AND checked_at >= CURRENT_DATE
         AND checked_at < CURRENT_DATE + INTERVAL '1 day'
       ON CONFLICT (endpoint_id, day) DO UPDATE SET
         uptime_percentage = EXCLUDED.uptime_percentage,
         total_checks = EXCLUDED.total_checks,
         operational_checks = EXCLUDED.operational_checks,
         degraded_checks = EXCLUDED.degraded_checks,
         outage_checks = EXCLUDED.outage_checks,
         worst_status = EXCLUDED.worst_status,
         updated_at = NOW()`,
      [endpoint.id],
    );

    await client.query('COMMIT');

    return {
      endpoint_id: endpoint.id,
      component_id: endpoint.componentId,
      status: measured.status,
      current_status: currentStatus,
      response_time_ms: measured.responseTimeMs,
      status_code: measured.statusCode,
      error_message: measured.errorMessage,
      region: endpoint.region,
    };
  } catch (error: any) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError: any) {
      console.error('run-checks rollback failed', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  void request;

  try {
    const { rows } = await pool.query(
      `SELECT
         e.id,
         e.component_id,
         e.url,
         e.method,
         e.expected_status_min,
         e.expected_status_max,
         e.timeout_ms,
         e.region,
         e.is_active,
         e.current_status,
         e.consecutive_failures,
         e.consecutive_successes
       FROM endpoints AS e
       JOIN status_pages AS sp ON sp.id = e.status_page_id
       WHERE e.is_active = TRUE
         AND sp.is_public = TRUE
         AND (
           e.last_checked_at IS NULL
           OR e.last_checked_at <= NOW() - (e.check_interval_minutes || ' minutes')::interval
         )
       ORDER BY e.last_checked_at NULLS FIRST
       LIMIT 100`,
    );

    const endpoints = (rows as EndpointRow[]).map(normalizeEndpoint);
    const results: RunCheckResult[] = [];

    for (const endpoint of endpoints) {
      const measured = await measureEndpoint(endpoint);
      const result = await persistCheck(endpoint, measured);
      results.push(result);
    }

    return NextResponse.json({ checked: results.length, results }, { status: 200 });
  } catch (error: any) {
    console.error('run-checks failed', error);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
