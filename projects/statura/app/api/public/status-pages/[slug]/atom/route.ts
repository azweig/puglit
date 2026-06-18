import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type DbDate = Date | string;

interface StatusPageRow {
  id: string;
  title: string;
  slug: string;
  logo_text: string | null;
  custom_domain: string | null;
  timezone: string;
  updated_at: DbDate;
}

interface EventRow {
  event_type: 'incident_update' | 'maintenance_update';
  subject_id: string;
  update_id: string;
  subject_title: string;
  subject_description: string;
  subject_status: string;
  impact: string;
  update_status: string;
  body: string;
  published_at: DbDate;
  created_at: DbDate;
  started_at: DbDate;
  ended_at: DbDate | null;
}

function extractSlugFromRequest(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/').filter((segment) => segment.length > 0);

  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index] === 'status-pages' && index + 2 < segments.length && segments[index + 2] === 'atom') {
      try {
        return decodeURIComponent(segments[index + 1]);
      } catch {
        return null;
      }
    }
  }

  return null;
}

function isValidSlug(slug: string): boolean {
  return slug.length >= 1 && slug.length <= 100 && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(slug);
}

function firstHeaderValue(value: string | null): string {
  return (value ?? '').split(',')[0].trim();
}

function normalizeHost(value: string | null): string {
  const host = firstHeaderValue(value).toLowerCase().replace(/[\r\n]/g, '');
  if (host.length === 0) {
    return '';
  }

  if (host.startsWith('[')) {
    const closingBracketIndex = host.indexOf(']');
    return closingBracketIndex >= 0 ? host.slice(0, closingBracketIndex + 1) : host;
  }

  return host.split(':')[0].replace(/\.$/, '');
}

function buildOrigin(request: NextRequest): string {
  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'));
  const hostHeader = firstHeaderValue(request.headers.get('host'));
  const host = (forwardedHost || hostHeader || request.nextUrl.host).replace(/[\r\n]/g, '');

  const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto')).toLowerCase();
  const fallbackProto = request.nextUrl.protocol.replace(':', '').toLowerCase();
  const protocol = forwardedProto === 'http' || forwardedProto === 'https' ? forwardedProto : fallbackProto === 'http' ? 'http' : 'https';

  return `${protocol}://${host}`;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAtomDate(value: DbDate): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date(0).toISOString();
  }
  return date.toISOString();
}

function yearFromDate(value: DbDate): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '1970';
  }
  return String(date.getUTCFullYear());
}

function humanize(value: string): string {
  return value
    .split('_')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function truncateText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function pageAlternateUrl(origin: string, page: StatusPageRow, requestHost: string): string {
  const customDomainHost = normalizeHost(page.custom_domain);
  if (customDomainHost.length > 0 && customDomainHost === requestHost) {
    return origin;
  }

  return `${origin}/status-pages/${encodeURIComponent(page.slug)}`;
}

function buildEntryUrl(pageUrl: string, event: EventRow): string {
  const resource = event.event_type === 'incident_update' ? 'incidents' : 'maintenances';
  return `${pageUrl}/${resource}/${encodeURIComponent(event.subject_id)}`;
}

function renderAtomXml(args: {
  page: StatusPageRow;
  events: EventRow[];
  origin: string;
  selfUrl: string;
  requestHost: string;
}): string {
  const { page, events, origin, selfUrl, requestHost } = args;
  const feedUpdated = events.length > 0 ? events[0].published_at : page.updated_at;
  const pageUrl = pageAlternateUrl(origin, page, requestHost);
  const feedTitle = `${page.title} Status Updates`;
  const feedId = `urn:status-page:${page.id}:atom`;

  const entries = events
    .map((event) => {
      const eventKind = event.event_type === 'incident_update' ? 'Incident' : 'Maintenance';
      const title = `${eventKind}: ${event.subject_title} - ${humanize(event.update_status)}`;
      const published = toAtomDate(event.published_at);
      const entryUrl = buildEntryUrl(pageUrl, event);
      const entryId = `urn:status-page:${page.id}:${event.event_type}:${event.update_id}`;
      const summary = truncateText(event.body, 500);
      const content = [
        `${eventKind}: ${event.subject_title}`,
        `Status: ${humanize(event.update_status)}`,
        `Impact: ${humanize(event.impact)}`,
        `Started: ${toAtomDate(event.started_at)}`,
        event.ended_at ? `Ended: ${toAtomDate(event.ended_at)}` : null,
        '',
        event.body.trim(),
      ]
        .filter((line): line is string => line !== null)
        .join('\n');

      return [
        '  <entry>',
        `    <id>${xmlEscape(entryId)}</id>`,
        `    <title>${xmlEscape(title)}</title>`,
        `    <updated>${published}</updated>`,
        `    <published>${published}</published>`,
        `    <link rel="alternate" href="${xmlEscape(entryUrl)}" />`,
        `    <category term="${xmlEscape(event.event_type)}" label="${xmlEscape(eventKind)}" />`,
        `    <category term="${xmlEscape(event.update_status)}" label="${xmlEscape(humanize(event.update_status))}" />`,
        `    <summary>${xmlEscape(summary)}</summary>`,
        `    <content type="text">${xmlEscape(content)}</content>`,
        '  </entry>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <id>${xmlEscape(feedId)}</id>`,
    `  <title>${xmlEscape(feedTitle)}</title>`,
    `  <updated>${toAtomDate(feedUpdated)}</updated>`,
    `  <link rel="self" href="${xmlEscape(selfUrl)}" type="application/atom+xml" />`,
    `  <link rel="alternate" href="${xmlEscape(pageUrl)}" type="text/html" />`,
    `  <generator uri="${xmlEscape(origin)}">Status Pages</generator>`,
    '  <author>',
    `    <name>${xmlEscape(page.title)}</name>`,
    '  </author>',
    `  <rights>Copyright ${xmlEscape(yearFromDate(feedUpdated))} ${xmlEscape(page.title)}</rights>`,
    entries,
    '</feed>',
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const slug = extractSlugFromRequest(request);
    if (slug === null || !isValidSlug(slug)) {
      return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    }

    const hostHeader = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host;
    const requestHost = normalizeHost(hostHeader);
    if (requestHost.length === 0 || requestHost.length > 253) {
      return NextResponse.json({ error: 'invalid host' }, { status: 400 });
    }

    const pageResult = await pool.query<StatusPageRow>(
      `SELECT id::text AS id,
              title,
              slug,
              logo_text,
              custom_domain,
              timezone,
              updated_at
         FROM status_pages
        WHERE is_public = TRUE
          AND (slug = $1 OR LOWER(custom_domain) = $2)
        ORDER BY CASE WHEN LOWER(custom_domain) = $2 THEN 0 ELSE 1 END, id ASC
        LIMIT 1`,
      [slug, requestHost],
    );

    const page = pageResult.rows[0];
    if (!page) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    const eventsResult = await pool.query<EventRow>(
      `WITH feed_events AS (
          SELECT 'incident_update'::text AS event_type,
                 i.id::text AS subject_id,
                 iu.id::text AS update_id,
                 i.title AS subject_title,
                 i.description AS subject_description,
                 i.status AS subject_status,
                 i.impact AS impact,
                 iu.status AS update_status,
                 iu.body AS body,
                 iu.published_at AS published_at,
                 iu.created_at AS created_at,
                 i.started_at AS started_at,
                 i.resolved_at AS ended_at,
                 iu.id AS sort_id
            FROM incident_updates iu
            JOIN incidents i ON i.id = iu.incident_id
           WHERE i.status_page_id = $1
          UNION ALL
          SELECT 'maintenance_update'::text AS event_type,
                 m.id::text AS subject_id,
                 mu.id::text AS update_id,
                 m.title AS subject_title,
                 m.description AS subject_description,
                 m.status AS subject_status,
                 m.impact AS impact,
                 mu.status AS update_status,
                 mu.body AS body,
                 mu.published_at AS published_at,
                 mu.created_at AS created_at,
                 m.scheduled_start AS started_at,
                 COALESCE(m.completed_at, m.scheduled_end) AS ended_at,
                 mu.id AS sort_id
            FROM maintenance_updates mu
            JOIN maintenances m ON m.id = mu.maintenance_id
           WHERE m.status_page_id = $1
        )
        SELECT event_type,
               subject_id,
               update_id,
               subject_title,
               subject_description,
               subject_status,
               impact,
               update_status,
               body,
               published_at,
               created_at,
               started_at,
               ended_at
          FROM feed_events
         ORDER BY published_at DESC, sort_id DESC
         LIMIT 50`,
      [page.id],
    );

    const origin = buildOrigin(request);
    const xml = renderAtomXml({
      page,
      events: eventsResult.rows,
      origin,
      selfUrl: request.url,
      requestHost,
    });

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/atom+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('public status page atom GET failed', error);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
