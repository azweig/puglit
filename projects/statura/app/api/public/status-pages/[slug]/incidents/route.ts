import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

interface StatusPageRow {
  id: string;
}

interface PublicIncidentRow {
  id: string;
  status_page_id: string;
  title: string;
  description: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  impact: "minor" | "major" | "critical" | "maintenance";
  started_at: Date | string;
  resolved_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  components: JsonValue;
  updates: JsonValue;
}

interface ParsedIntegerParam {
  value: number;
  error: string | null;
}

function extractSlug(request: NextRequest): string | null {
  const marker = "/api/public/status-pages/";
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith(marker)) {
    return null;
  }

  const remainder = pathname.slice(marker.length);
  const rawSlug = remainder.split("/")[0];

  if (!rawSlug) {
    return null;
  }

  try {
    return decodeURIComponent(rawSlug);
  } catch {
    return null;
  }
}

function isValidSlug(slug: string): boolean {
  return slug.length >= 1 && slug.length <= 120 && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(slug);
}

function currentUtcMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseMonth(monthValue: string): { startIso: string; endIso: string; error: string | null } {
  const match = /^(\d{4})-(\d{2})$/.exec(monthValue);

  if (!match) {
    return { startIso: "", endIso: "", error: "month must be in YYYY-MM format" };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || year < 1970 || year > 9999 || month < 1 || month > 12) {
    return { startIso: "", endIso: "", error: "month is out of range" };
  }

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  return { startIso: start.toISOString(), endIso: end.toISOString(), error: null };
}

function parseIntegerParam(
  searchParams: URLSearchParams,
  name: string,
  defaultValue: number,
  minValue: number,
  maxValue: number,
): ParsedIntegerParam {
  const rawValue = searchParams.get(name);

  if (rawValue === null) {
    return { value: defaultValue, error: null };
  }

  if (rawValue.trim() === "") {
    return { value: defaultValue, error: `${name} must be a number` };
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < minValue || parsed > maxValue) {
    return { value: defaultValue, error: `${name} must be an integer between ${minValue} and ${maxValue}` };
  }

  return { value: parsed, error: null };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const slug = extractSlug(request);

    if (slug === null || !isValidSlug(slug)) {
      return NextResponse.json({ error: "invalid slug" }, { status: 400 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const monthParam = searchParams.get("month") ?? currentUtcMonth();
    const parsedMonth = parseMonth(monthParam);

    if (parsedMonth.error !== null) {
      return NextResponse.json({ error: parsedMonth.error }, { status: 400 });
    }

    const parsedLimit = parseIntegerParam(searchParams, "limit", 100, 1, 200);
    if (parsedLimit.error !== null) {
      return NextResponse.json({ error: parsedLimit.error }, { status: 400 });
    }

    const parsedOffset = parseIntegerParam(searchParams, "offset", 0, 0, 100000);
    if (parsedOffset.error !== null) {
      return NextResponse.json({ error: parsedOffset.error }, { status: 400 });
    }

    const pageResult = await pool.query<StatusPageRow>(
      "SELECT id FROM status_pages WHERE slug = $1 AND is_public = TRUE",
      [slug],
    );

    if (pageResult.rows.length === 0) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const statusPageId = pageResult.rows[0].id;

    const incidentsResult = await pool.query<PublicIncidentRow>(
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
          COALESCE(component_data.components, '[]'::jsonb) AS components,
          COALESCE(update_data.updates, '[]'::jsonb) AS updates
        FROM incidents i
        LEFT JOIN LATERAL (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', c.id,
              'status_page_id', c.status_page_id,
              'group_id', c.group_id,
              'name', c.name,
              'description', c.description,
              'current_status', c.current_status,
              'position', c.position,
              'is_visible', c.is_visible,
              'created_at', c.created_at,
              'updated_at', c.updated_at
            )
            ORDER BY c.position ASC, c.name ASC, c.id ASC
          ) AS components
          FROM incident_components ic
          INNER JOIN components c ON c.id = ic.component_id
          WHERE ic.incident_id = i.id
        ) component_data ON TRUE
        LEFT JOIN LATERAL (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', iu.id,
              'incident_id', iu.incident_id,
              'status', iu.status,
              'body', iu.body,
              'published_at', iu.published_at,
              'created_at', iu.created_at
            )
            ORDER BY iu.published_at DESC, iu.id DESC
          ) AS updates
          FROM incident_updates iu
          WHERE iu.incident_id = i.id
        ) update_data ON TRUE
        WHERE i.status_page_id = $1
          AND i.started_at >= $2
          AND i.started_at < $3
        ORDER BY i.started_at DESC, i.id DESC
        LIMIT $4 OFFSET $5
      `,
      [statusPageId, parsedMonth.startIso, parsedMonth.endIso, parsedLimit.value, parsedOffset.value],
    );

    return NextResponse.json(incidentsResult.rows, { status: 200 });
  } catch (error: any) {
    console.error("public status page incidents GET failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
