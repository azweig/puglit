import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type StatusPageRow = {
  id: string;
  title: string;
  slug: string;
  logo_text: string | null;
  custom_domain: string | null;
  timezone: string;
  updated_at: Date | string;
};

type FeedRow = {
  item_type: 'incident' | 'maintenance';
  id: string;
  title: string;
  description: string;
  status: string;
  impact: string;
  event_at: Date | string;
  published_at: Date | string;
  last_update_body: string | null;
  last_update_at: Date | string | null;
};

function jsonError(error: string, status: number): NextResponse<{ error: string }> {
  return NextResponse.json({ error }, { status });
}

function extractSlug(pathname: string): string | null {
  const marker = '/status-pages/';
  const markerIndex = pathname.indexOf(marker);
  if (markerIndex < 0) return null;

  const rest = pathname.slice(markerIndex + marker.length);
  const encodedSlug = rest.split('/')[0];
  if (!encodedSlug) return null;

  try {
    return decodeURIComponent(encodedSlug);
  } catch {
    return null;
  }
}

function isValidSlug(slug: string): boolean {
  return slug.length >= 1 && slug.length <= 120 && /^[A-Za-z0-9][A-Za-z0-9._~-]*$/.test(slug);
}

function normalizeHost(rawHost: string | null): string {
  if (!rawHost) return '';

  const firstHost = rawHost.split(',')[0]?.trim().toLowerCase() ?? '';
  const withoutProtocol = firstHost.replace(/^https?:\/\//, '');
  const hostOnly = withoutProtocol.split('/')[0]?.replace(/\.$/, '') ?? '';

  if (!hostOnly || hostOnly.length > 253) return '';

  const withoutPort = hostOnly.startsWith('[') ? '' : hostOnly.split(':')[0] ?? '';
  if (!withoutPort || withoutPort.length > 253) return '';

  if (withoutPort === 'localhost') return withoutPort;
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(withoutPort)) {
    return '';
  }

  return withoutPort;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toDate(value: Date | string | null): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function toRssDate(value: Date | string | null): string {
  return toDate(value).toUTCString();
}

function buildAbsoluteUrl(origin: string, path: string): string {
  const safeOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  return `${safeOrigin}${path}`;
}

function buildItemDescription(item: FeedRow): string {
  const parts = [
    `Status: ${item.status}`,
    `Impact: ${item.impact}`,
    `Description: ${item.description}`,
  ];

  if (item.last_update_body && item.last_update_body.trim().length > 0) {
    const updateDate = item.last_update_at ? ` (${toRssDate(item.last_update_at)})` : '';
    parts.push(`Last update${updateDate}: ${item.last_update_body}`);
  } else {
    parts.push('Last update: No update has been published yet.');
  }

  return parts.join('\n\n');
}

function buildRssXml(page: StatusPageRow, items: FeedRow[], origin: string): string {
  const channelLink = buildAbsoluteUrl(origin, `/status-pages/${encodeURIComponent(page.slug)}`);
  const now = new Date().toUTCString();

  const itemXml = items
    .map((item) => {
      const itemPath = item.item_type === 'incident' ? `/incidents/${encodeURIComponent(item.id)}` : `/maintenance/${encodeURIComponent(item.id)}`;
      const itemLink = buildAbsoluteUrl(origin, itemPath);
      const typeLabel = item.item_type === 'incident' ? 'Incident' : 'Maintenance';
      const description = buildItemDescription(item);

      return [
        '    <item>',
        `      <title>${escapeXml(`[${typeLabel}] ${item.title}`)}</title>`,
        `      <link>${escapeXml(itemLink)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(itemLink)}</guid>`,
        `      <pubDate>${escapeXml(toRssDate(item.published_at))}</pubDate>`,
        `      <category>${escapeXml(item.item_type)}</category>`,
        `      <category>${escapeXml(item.status)}</category>`,
        `      <category>${escapeXml(item.impact)}</category>`,
        `      <description>${escapeXml(description)}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(`${page.title} Status Updates`)}</title>`,
    `    <link>${escapeXml(channelLink)}</link>`,
    `    <description>${escapeXml(`Public incident and maintenance updates for ${page.title}.`)}</description>`,
    `    <lastBuildDate>${escapeXml(now)}</lastBuildDate>`,
    '    <ttl>5</ttl>',
    '    <generator>Next.js App Router</generator>',
    itemXml,
    '  </channel>',
    '</rss>',
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const slug = extractSlug(request.nextUrl.pathname);
    if (!slug || !isValidSlug(slug)) {
      return jsonError('invalid_slug', 400);
    }

    const host = normalizeHost(request.headers.get('x-forwarded-host') ?? request.headers.get('host'));

    const pageResult = await pool.query<StatusPageRow>(
      `
        SELECT
          id::text AS id,
          title,
          slug,
          logo_text,
          custom_domain,
          timezone,
          updated_at
        FROM status_pages
        WHERE is_public = TRUE
          AND (
            slug = $1
            OR ($2 <> '' AND lower(custom_domain) = $2)
          )
        ORDER BY
          CASE WHEN $2 <> '' AND lower(custom_domain) = $2 THEN 0 ELSE 1 END,
          id ASC
        LIMIT 1
      `,
      [slug, host],
    );

    const page = pageResult.rows[0];
    if (!page) {
      return jsonError('not_found', 404);
    }

    const feedResult = await pool.query<FeedRow>(
      `
        WITH feed_items AS (
          SELECT
            'incident'::text AS item_type,
            i.id::text AS id,
            i.title,
            i.description,
            i.status,
            i.impact,
            i.started_at AS event_at,
            COALESCE(last_update.published_at, i.updated_at, i.started_at) AS published_at,
            last_update.body AS last_update_body,
            last_update.published_at AS last_update_at
          FROM incidents i
          LEFT JOIN LATERAL (
            SELECT
              iu.body,
              iu.published_at
            FROM incident_updates iu
            WHERE iu.incident_id = i.id
            ORDER BY iu.published_at DESC, iu.id DESC
            LIMIT 1
          ) last_update ON TRUE
          WHERE i.status_page_id = $1

          UNION ALL

          SELECT
            'maintenance'::text AS item_type,
            m.id::text AS id,
            m.title,
            m.description,
            m.status,
            m.impact,
            m.scheduled_start AS event_at,
            COALESCE(last_update.published_at, m.updated_at, m.scheduled_start) AS published_at,
            last_update.body AS last_update_body,
            last_update.published_at AS last_update_at
          FROM maintenances m
          LEFT JOIN LATERAL (
            SELECT
              mu.body,
              mu.published_at
            FROM maintenance_updates mu
            WHERE mu.maintenance_id = m.id
            ORDER BY mu.published_at DESC, mu.id DESC
            LIMIT 1
          ) last_update ON TRUE
          WHERE m.status_page_id = $1
        )
        SELECT
          item_type,
          id,
          title,
          description,
          status,
          impact,
          event_at,
          published_at,
          last_update_body,
          last_update_at
        FROM feed_items
        ORDER BY published_at DESC, event_at DESC, id DESC
        LIMIT 50
      `,
      [page.id],
    );

    const xml = buildRssXml(page, feedResult.rows, request.nextUrl.origin);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error: unknown) {
    console.error('public status page rss GET failed', error);
    return jsonError('internal', 500);
  }
}
