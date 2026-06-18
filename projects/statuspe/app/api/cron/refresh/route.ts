import { NextRequest, NextResponse, after } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDER_KEY = process.env.STATUSPE_PROBE_KEY;
const REGION = process.env.STATUSPE_PROBE_REGION || "global";
const DEFAULT_LIMIT = 25;

// Cadence: run this route from your scheduler every 30 seconds. The target DDL stores
// check_interval_minutes, so each active endpoint is probed no more often than its own
// interval (minimum 1 minute). Keep per-probe timeouts around 5-10s to avoid piling up work.

type EndpointRow = {
  id: number;
  status_page_id: number;
  component_id: number;
  name: string;
  url: string;
  method: "GET" | "HEAD" | "POST";
  expected_status_min: number;
  expected_status_max: number;
  check_interval_minutes: number;
  timeout_ms: number;
  region: string;
  current_status: "operational" | "degraded" | "outage" | "paused";
  last_checked_at: string | null;
  last_response_time_ms: number | null;
  last_status_code: number | null;
  consecutive_failures: number;
  consecutive_successes: number;
};

type ProbeOutcome = {
  checkedAt: Date;
  ok: boolean;
  checkStatus: "operational" | "degraded" | "outage" | "paused";
  responseTimeMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
};

type JobSummary = {
  mode: "live" | "mock";
  selected: number;
  checked: number;
  failures: number;
  incidentsOpened: number;
  incidentsResolved: number;
};

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (req.nextUrl.searchParams.get("sync") === "1") {
    try {
      const summary = await runRefreshJob();
      return NextResponse.json({ ok: true, summary });
    } catch (error: any) {
      return NextResponse.json(
        { ok: false, error: error?.message || "refresh failed" },
        { status: 500 }
      );
    }
  }

  after(async () => {
    try {
      await runRefreshJob();
    } catch (error) {
      console.error("StatusPe refresh failed", error);
    }
  });

  return NextResponse.json({ ok: true, scheduled: true });
}

async function runRefreshJob(): Promise<JobSummary> {
  const mode: "live" | "mock" = PROVIDER_KEY ? "live" : "mock";
  const endpoints = mode === "live" ? await loadDueEndpoints() : await ensureMockRows();

  const summary: JobSummary = {
    mode,
    selected: endpoints.length,
    checked: 0,
    failures: 0,
    incidentsOpened: 0,
    incidentsResolved: 0,
  };

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    const outcome = mode === "live" ? await probeEndpoint(endpoint) : mockOutcomeFor(endpoint, i);
    const result = await recordProbeResult(endpoint, outcome);
    summary.checked += 1;
    if (!outcome.ok) summary.failures += 1;
    if (result.incidentOpened) summary.incidentsOpened += 1;
    if (result.incidentResolved) summary.incidentsResolved += 1;
  }

  return summary;
}

async function loadDueEndpoints(): Promise<EndpointRow[]> {
  const limit = clampInt(process.env.STATUSPE_PROBE_LIMIT, 1, 100, DEFAULT_LIMIT);
  const result = await pool.query(
    `SELECT id, status_page_id, component_id, name, url, method,
            expected_status_min, expected_status_max, check_interval_minutes,
            timeout_ms, region, current_status, last_checked_at,
            last_response_time_ms, last_status_code,
            consecutive_failures, consecutive_successes
       FROM endpoints
      WHERE is_active = TRUE
        AND current_status <> 'paused'
        AND (last_checked_at IS NULL OR last_checked_at <= NOW() - (check_interval_minutes * INTERVAL '1 minute'))
      ORDER BY COALESCE(last_checked_at, TIMESTAMPTZ 'epoch') ASC, id ASC
      LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function ensureMockRows(): Promise<EndpointRow[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const pageResult = await client.query(
      `INSERT INTO status_pages
        (name, slug, logo_url, main_site_url, custom_domain, timezone, is_public,
         subscribe_email_enabled, subscribe_webhook_enabled, subscribe_rss_enabled, footer_text, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         logo_url = EXCLUDED.logo_url,
         main_site_url = EXCLUDED.main_site_url,
         custom_domain = EXCLUDED.custom_domain,
         timezone = EXCLUDED.timezone,
         is_public = EXCLUDED.is_public,
         subscribe_email_enabled = EXCLUDED.subscribe_email_enabled,
         subscribe_webhook_enabled = EXCLUDED.subscribe_webhook_enabled,
         subscribe_rss_enabled = EXCLUDED.subscribe_rss_enabled,
         footer_text = EXCLUDED.footer_text,
         updated_at = NOW()
       RETURNING id`,
      [
        "StatusPe Demo",
        "statuspe-demo",
        null,
        "https://statuspe.example.com",
        null,
        "America/Lima",
        true,
        true,
        true,
        true,
        "Powered by StatusPe",
      ]
    );
    const statusPageId = Number(pageResult.rows[0].id);

    const groupId = await upsertComponentGroup(client, statusPageId, {
      name: "Production",
      description: "Core public services monitored by StatusPe",
      position: 0,
      is_collapsed: false,
    });

    const websiteComponentId = await upsertComponent(client, statusPageId, groupId, {
      name: "Website",
      description: "Marketing site and public status page",
      position: 0,
      is_public: true,
    });

    const apiComponentId = await upsertComponent(client, statusPageId, groupId, {
      name: "API",
      description: "Primary JSON API",
      position: 1,
      is_public: true,
    });

    await upsertEndpoint(client, statusPageId, websiteComponentId, {
      name: "Website HTTPS",
      url: "https://example.com/",
      method: "HEAD",
      expected_status_min: 200,
      expected_status_max: 399,
      check_interval_minutes: 1,
      timeout_ms: 5000,
      region: REGION,
    });

    await upsertEndpoint(client, statusPageId, apiComponentId, {
      name: "API Healthcheck",
      url: "https://api.statuspe.example.com/health",
      method: "GET",
      expected_status_min: 200,
      expected_status_max: 299,
      check_interval_minutes: 1,
      timeout_ms: 5000,
      region: REGION,
    });

    await client.query("COMMIT");

    const endpoints = await pool.query(
      `SELECT id, status_page_id, component_id, name, url, method,
              expected_status_min, expected_status_max, check_interval_minutes,
              timeout_ms, region, current_status, last_checked_at,
              last_response_time_ms, last_status_code,
              consecutive_failures, consecutive_successes
         FROM endpoints
        WHERE status_page_id = $1 AND region = $2 AND is_active = TRUE
        ORDER BY id ASC`,
      [statusPageId, REGION]
    );
    return endpoints.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function upsertComponentGroup(client: any, statusPageId: number, input: any): Promise<number> {
  const existing = await client.query(
    `SELECT id FROM component_groups WHERE status_page_id = $1 AND name = $2 LIMIT 1`,
    [statusPageId, input.name]
  );
  if (existing.rowCount > 0) {
    await client.query(
      `UPDATE component_groups
          SET description = $1, position = $2, is_collapsed = $3
        WHERE id = $4`,
      [input.description, input.position, input.is_collapsed, existing.rows[0].id]
    );
    return Number(existing.rows[0].id);
  }
  const inserted = await client.query(
    `INSERT INTO component_groups
       (status_page_id, name, description, position, is_collapsed)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id`,
    [statusPageId, input.name, input.description, input.position, input.is_collapsed]
  );
  return Number(inserted.rows[0].id);
}

async function upsertComponent(client: any, statusPageId: number, groupId: number, input: any): Promise<number> {
  const existing = await client.query(
    `SELECT id FROM components WHERE status_page_id = $1 AND name = $2 LIMIT 1`,
    [statusPageId, input.name]
  );
  if (existing.rowCount > 0) {
    await client.query(
      `UPDATE components
          SET group_id = $1, description = $2, position = $3, is_public = $4, updated_at = NOW()
        WHERE id = $5`,
      [groupId, input.description, input.position, input.is_public, existing.rows[0].id]
    );
    return Number(existing.rows[0].id);
  }
  const inserted = await client.query(
    `INSERT INTO components
       (status_page_id, group_id, name, description, position, is_public)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id`,
    [statusPageId, groupId, input.name, input.description, input.position, input.is_public]
  );
  return Number(inserted.rows[0].id);
}

async function upsertEndpoint(client: any, statusPageId: number, componentId: number, input: any): Promise<number> {
  const existing = await client.query(
    `SELECT id FROM endpoints
      WHERE status_page_id = $1 AND component_id = $2 AND url = $3 AND region = $4
      LIMIT 1`,
    [statusPageId, componentId, input.url, input.region]
  );
  if (existing.rowCount > 0) {
    await client.query(
      `UPDATE endpoints
          SET name = $1, method = $2, expected_status_min = $3, expected_status_max = $4,
              check_interval_minutes = $5, timeout_ms = $6, is_active = TRUE, updated_at = NOW()
        WHERE id = $7`,
      [
        input.name,
        input.method,
        input.expected_status_min,
        input.expected_status_max,
        input.check_interval_minutes,
        input.timeout_ms,
        existing.rows[0].id,
      ]
    );
    return Number(existing.rows[0].id);
  }
  const inserted = await client.query(
    `INSERT INTO endpoints
       (status_page_id, component_id, name, url, method, expected_status_min,
        expected_status_max, check_interval_minutes, timeout_ms, region, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)
     RETURNING id`,
    [
      statusPageId,
      componentId,
      input.name,
      input.url,
      input.method,
      input.expected_status_min,
      input.expected_status_max,
      input.check_interval_minutes,
      input.timeout_ms,
      input.region,
    ]
  );
  return Number(inserted.rows[0].id);
}

function mockOutcomeFor(endpoint: EndpointRow, index: number): ProbeOutcome {
  const isApi = endpoint.name.toLowerCase().includes("api");
  const forcedRecovery = endpoint.consecutive_failures >= 2;
  if (isApi && !forcedRecovery) {
    return {
      checkedAt: new Date(),
      ok: false,
      checkStatus: "degraded",
      responseTimeMs: 1280,
      statusCode: 503,
      errorMessage: "bad_status: expected 200-299, received 503",
    };
  }
  return {
    checkedAt: new Date(),
    ok: true,
    checkStatus: "operational",
    responseTimeMs: 120 + index * 37,
    statusCode: 200,
    errorMessage: null,
  };
}

async function probeEndpoint(endpoint: EndpointRow): Promise<ProbeOutcome> {
  const checkedAt = new Date();
  const validationError = validateProbeUrl(endpoint.url);
  if (validationError) {
    return {
      checkedAt,
      ok: false,
      checkStatus: "outage",
      responseTimeMs: null,
      statusCode: null,
      errorMessage: validationError,
    };
  }

  const firstMethod = endpoint.method === "POST" ? "POST" : "HEAD";
  const start = Date.now();
  let controller = new AbortController();
  let timeout = setTimeout(() => controller.abort(), endpoint.timeout_ms);

  try {
    let response = await fetch(endpoint.url, {
      method: firstMethod,
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: { "user-agent": "StatusPe-Probe/1.0" },
    });

    if (firstMethod === "HEAD" && (response.status === 405 || response.status === 501)) {
      clearTimeout(timeout);
      controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), endpoint.timeout_ms);
      response = await fetch(endpoint.url, {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
        headers: { "user-agent": "StatusPe-Probe/1.0" },
      });
    }

    const responseTimeMs = Date.now() - start;
    const ok = response.status >= endpoint.expected_status_min && response.status <= endpoint.expected_status_max;
    return {
      checkedAt,
      ok,
      checkStatus: ok ? "operational" : response.status >= 500 ? "outage" : "degraded",
      responseTimeMs,
      statusCode: response.status,
      errorMessage: ok
        ? null
        : `bad_status: expected ${endpoint.expected_status_min}-${endpoint.expected_status_max}, received ${response.status}`,
    };
  } catch (error: any) {
    const responseTimeMs = Date.now() - start;
    const errorType = classifyFetchError(error);
    return {
      checkedAt,
      ok: false,
      checkStatus: errorType === "timeout" || errorType === "dns_error" || errorType === "tls_error" ? "outage" : "degraded",
      responseTimeMs,
      statusCode: null,
      errorMessage: `${errorType}: ${error?.message || "probe failed"}`.slice(0, 1000),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function recordProbeResult(endpoint: EndpointRow, outcome: ProbeOutcome): Promise<{ incidentOpened: boolean; incidentResolved: boolean }> {
  const client = await pool.connect();
  let incidentOpened = false;
  let incidentResolved = false;

  try {
    await client.query("BEGIN");

    const locked = await client.query(
      `SELECT id, status_page_id, component_id, current_status, consecutive_failures, consecutive_successes
         FROM endpoints
        WHERE id = $1
        FOR UPDATE`,
      [endpoint.id]
    );

    if (locked.rowCount === 0) {
      await client.query("ROLLBACK");
      return { incidentOpened, incidentResolved };
    }

    const current = locked.rows[0];
    const previousStatus = current.current_status as "operational" | "degraded" | "outage" | "paused";
    const previousFailures = Number(current.consecutive_failures || 0);
    const previousSuccesses = Number(current.consecutive_successes || 0);
    const consecutiveFailures = outcome.ok ? 0 : previousFailures + 1;
    const consecutiveSuccesses = outcome.ok ? previousSuccesses + 1 : 0;
    const endpointStatus = nextEndpointStatus(previousStatus, outcome.ok, consecutiveFailures, consecutiveSuccesses);

    await client.query(
      `INSERT INTO status_checks
         (endpoint_id, checked_at, status, response_time_ms, status_code, error_message, region)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        endpoint.id,
        outcome.checkedAt,
        outcome.checkStatus,
        outcome.responseTimeMs,
        outcome.statusCode,
        outcome.errorMessage,
        endpoint.region || REGION,
      ]
    );

    await client.query(
      `UPDATE endpoints
          SET current_status = $1,
              last_checked_at = $2,
              last_response_time_ms = $3,
              last_status_code = $4,
              consecutive_failures = $5,
              consecutive_successes = $6,
              updated_at = NOW()
        WHERE id = $7`,
      [
        endpointStatus,
        outcome.checkedAt,
        outcome.responseTimeMs,
        outcome.statusCode,
        consecutiveFailures,
        consecutiveSuccesses,
        endpoint.id,
      ]
    );

    const activeIncident = await client.query(
      `SELECT id, status, impact
         FROM incidents
        WHERE endpoint_id = $1 AND status <> 'resolved'
        ORDER BY started_at DESC
        LIMIT 1
        FOR UPDATE`,
      [endpoint.id]
    );

    if ((endpointStatus === "degraded" || endpointStatus === "outage") && consecutiveFailures >= 2) {
      const impact = endpointStatus === "outage" ? "major" : "minor";
      const affectedStatus = endpointStatus === "outage" ? "outage" : "degraded";
      if (activeIncident.rowCount === 0) {
        const incident = await client.query(
          `INSERT INTO incidents
             (status_page_id, endpoint_id, title, description, status, impact, started_at, created_at, updated_at)
           VALUES ($1,$2,$3,$4,'investigating',$5,$6,NOW(),NOW())
           RETURNING id`,
          [
            endpoint.status_page_id,
            endpoint.id,
            `${endpoint.name} is ${endpointStatus}`,
            outcome.errorMessage || `Automatic probe detected ${endpointStatus}.`,
            impact,
            outcome.checkedAt,
          ]
        );
        const incidentId = Number(incident.rows[0].id);
        await client.query(
          `INSERT INTO incident_updates (incident_id, status, message, author_label, published_at)
           VALUES ($1,'investigating',$2,'StatusPe',$3)`,
          [incidentId, outcome.errorMessage || `StatusPe detected ${endpoint.name} as ${endpointStatus}.`, outcome.checkedAt]
        );
        await client.query(
          `INSERT INTO incident_components (incident_id, component_id, affected_status)
           VALUES ($1,$2,$3)
           ON CONFLICT (incident_id, component_id) DO UPDATE SET affected_status = EXCLUDED.affected_status`,
          [incidentId, endpoint.component_id, affectedStatus]
        );
        incidentOpened = true;
      } else {
        const incidentId = Number(activeIncident.rows[0].id);
        await client.query(
          `UPDATE incidents
              SET title = $1, description = $2, status = 'identified', impact = $3, updated_at = NOW()
            WHERE id = $4`,
          [
            `${endpoint.name} is ${endpointStatus}`,
            outcome.errorMessage || `Automatic probe still reports ${endpointStatus}.`,
            impact,
            incidentId,
          ]
        );
        await client.query(
          `INSERT INTO incident_components (incident_id, component_id, affected_status)
           VALUES ($1,$2,$3)
           ON CONFLICT (incident_id, component_id) DO UPDATE SET affected_status = EXCLUDED.affected_status`,
          [incidentId, endpoint.component_id, affectedStatus]
        );
        if (previousStatus !== endpointStatus) {
          await client.query(
            `INSERT INTO incident_updates (incident_id, status, message, author_label, published_at)
             VALUES ($1,'identified',$2,'StatusPe',$3)`,
            [incidentId, `${endpoint.name} changed from ${previousStatus} to ${endpointStatus}.`, outcome.checkedAt]
          );
        }
      }
    }

    if (endpointStatus === "operational" && consecutiveSuccesses >= 2 && activeIncident.rowCount > 0) {
      const incidentId = Number(activeIncident.rows[0].id);
      await client.query(
        `UPDATE incidents
            SET status = 'resolved', resolved_at = $1, updated_at = NOW()
          WHERE id = $2`,
        [outcome.checkedAt, incidentId]
      );
      await client.query(
        `INSERT INTO incident_updates (incident_id, status, message, author_label, published_at)
         VALUES ($1,'resolved',$2,'StatusPe',$3)`,
        [incidentId, `${endpoint.name} recovered after two successful checks.`, outcome.checkedAt]
      );
      await client.query(
        `INSERT INTO incident_components (incident_id, component_id, affected_status)
         VALUES ($1,$2,'operational')
         ON CONFLICT (incident_id, component_id) DO UPDATE SET affected_status = 'operational'`,
        [incidentId, endpoint.component_id]
      );
      incidentResolved = true;
    }

    await updateComponentStatus(client, endpoint.component_id);
    await refreshDailyRollup(client, endpoint.id, outcome.checkedAt);

    await client.query("COMMIT");
    return { incidentOpened, incidentResolved };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function nextEndpointStatus(
  previousStatus: "operational" | "degraded" | "outage" | "paused",
  ok: boolean,
  consecutiveFailures: number,
  consecutiveSuccesses: number
): "operational" | "degraded" | "outage" | "paused" {
  if (previousStatus === "paused") return "paused";
  if (ok) {
    if (previousStatus !== "operational" && consecutiveSuccesses < 2) return "degraded";
    return "operational";
  }
  if (consecutiveFailures >= 3) return "outage";
  if (consecutiveFailures >= 2) return "degraded";
  return previousStatus === "degraded" || previousStatus === "outage" ? previousStatus : "operational";
}

async function updateComponentStatus(client: any, componentId: number) {
  await client.query(
    `WITH ranked AS (
       SELECT COALESCE(MAX(CASE current_status
         WHEN 'outage' THEN 3
         WHEN 'degraded' THEN 2
         WHEN 'paused' THEN 1
         ELSE 0 END), 0) AS worst
       FROM endpoints
       WHERE component_id = $1 AND is_active = TRUE
     )
     UPDATE components
        SET current_status = CASE ranked.worst
          WHEN 3 THEN 'outage'
          WHEN 2 THEN 'degraded'
          WHEN 1 THEN 'paused'
          ELSE 'operational' END,
            updated_at = NOW()
       FROM ranked
      WHERE components.id = $1`,
    [componentId]
  );
}

async function refreshDailyRollup(client: any, endpointId: number, checkedAt: Date) {
  const day = checkedAt.toISOString().slice(0, 10);
  await client.query(
    `INSERT INTO uptime_daily
       (endpoint_id, day, uptime_percentage, total_checks, operational_checks,
        degraded_checks, outage_checks, worst_status, created_at, updated_at)
     SELECT
       $1,
       $2::date,
       ROUND((SUM(CASE WHEN status = 'operational' THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100, 2),
       COUNT(*)::integer,
       SUM(CASE WHEN status = 'operational' THEN 1 ELSE 0 END)::integer,
       SUM(CASE WHEN status = 'degraded' THEN 1 ELSE 0 END)::integer,
       SUM(CASE WHEN status = 'outage' THEN 1 ELSE 0 END)::integer,
       CASE MAX(CASE status WHEN 'outage' THEN 3 WHEN 'degraded' THEN 2 WHEN 'paused' THEN 1 ELSE 0 END)
         WHEN 3 THEN 'outage'
         WHEN 2 THEN 'degraded'
         WHEN 1 THEN 'paused'
         ELSE 'operational'
       END,
       NOW(),
       NOW()
     FROM status_checks
     WHERE endpoint_id = $1 AND checked_at::date = $2::date
     ON CONFLICT (endpoint_id, day) DO UPDATE SET
       uptime_percentage = EXCLUDED.uptime_percentage,
       total_checks = EXCLUDED.total_checks,
       operational_checks = EXCLUDED.operational_checks,
       degraded_checks = EXCLUDED.degraded_checks,
       outage_checks = EXCLUDED.outage_checks,
       worst_status = EXCLUDED.worst_status,
       updated_at = NOW()`,
    [endpointId, day]
  );
}

function validateProbeUrl(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return "connection_error: invalid URL";
  }
  if (parsed.protocol !== "https:") return "connection_error: only https URLs are allowed";
  if (parsed.username || parsed.password) return "connection_error: URL credentials are not allowed";
  if (parsed.port && parsed.port !== "443") return "connection_error: only default HTTPS port is allowed";

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return "connection_error: local hostnames are blocked";
  }
  if (isPrivateIpv4(host) || isBlockedIpv6(host)) {
    return "connection_error: private or local IP targets are blocked";
  }
  return null;
}

function isPrivateIpv4(host: string): boolean {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  const parts = host.split(".").map((p) => Number(p));
  if (parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isBlockedIpv6(host: string): boolean {
  if (!host.includes(":")) return false;
  const normalized = host.toLowerCase();
  return normalized === "::1" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd");
}

function classifyFetchError(error: any): "timeout" | "dns_error" | "tls_error" | "connection_error" {
  const text = `${error?.name || ""} ${error?.code || ""} ${error?.message || ""} ${error?.cause?.code || ""} ${error?.cause?.message || ""}`.toLowerCase();
  if (text.includes("abort") || text.includes("timeout")) return "timeout";
  if (text.includes("enotfound") || text.includes("eai_again") || text.includes("dns")) return "dns_error";
  if (text.includes("cert") || text.includes("tls") || text.includes("ssl")) return "tls_error";
  return "connection_error";
}

function clampInt(value: string | undefined, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}
