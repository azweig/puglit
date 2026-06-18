import { NextRequest, NextResponse } from 'next/server';
import { Pool, type PoolConfig } from 'pg';

export const runtime = 'nodejs';

type StatusPageRow = {
  id: string;
  name: string;
  slug: string;
  subscribe_rss_enabled: boolean;
};

type FeedRow = {
  kind: 'incident' | 'maintenance';
  item_id: string;
  update_id: string;
  item_title: string;
  update_status: string;
  message: string;
  published_at: Date | string;
};

const globalForDb = globalThis as typeof globalThis & {
  __statusPageRssPool?: Pool;
};

function createPool(): Pool {
  const config: PoolConfig = {};

  if (process.env.DATABASE_URL) {
    config.connectionString = process.env.DATABASE_URL;
  }

  return new Pool(config);
}

const pool = globalForDb.__statusPageRssPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__statusPageRssPool = pool;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toRssDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

function extractSlug(request: NextRequest): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const statusPagesIndex = segments.indexOf('status-pages');

  if (statusPagesIndex < 0 || statusPagesIndex + 1 >= segments.length) {
    return null;
  }

  try {
    return decodeURIComponent(segments[statusPagesIndex + 1]);
  } catch {
    return null;
  }
}

function isValidSlug(slug: string): boolean {
  if (slug.length < 1 || slug.length > 200 || slug.trim() !== slug) {
    return false;
  }

  for (const character of slug) {
    const code = character.charCodeAt(0);
    if (code <= 31 || code === 127 || character === '/' || character === '\\' || character === '?' || character === '#') {
      return false;
    }
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    const slug = extractSlug(request);

    if (slug === null || !isValidSlug(slug)) {
      return NextResponse.json({ error: 'invalid_slug' }, { status: 400 });
    }

    const pageResult = await pool.query<StatusPageRow>(
      `
        SELECT id::text AS id, name, slug, subscribe_rss_enabled
        FROM status_pages
        WHERE slug = $1 AND is_public = TRUE
        LIMIT 1
      `,
      [slug],
    );

    const page = pageResult.rows[0];

    if (!page) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (!page.subscribe_rss_enabled) {
      return NextResponse.json({ error: 'rss_disabled' }, { status: 403 });
    }

    const feedResult = await pool.query<FeedRow>(
      `
        SELECT kind, item_id, update_id, item_title, update_status, message, published_at
        FROM (
          SELECT
            'incident'::text AS kind,
            i.id::text AS item_id,
            iu.id::text AS update_id,
            i.title AS item_title,
            iu.status AS update_status,
            iu.message AS message,
            iu.published_at AS published_at
          FROM incident_updates iu
          INNER JOIN incidents i ON i.id = iu.incident_id
          WHERE i.status_page_id = $1
            AND iu.published_at >= NOW() - INTERVAL '90 days'

          UNION ALL

          SELECT
            'maintenance'::text AS kind,
            sm.id::text AS item_id,
            mu.id::text AS update_id,
            sm.title AS item_title,
            mu.status AS update_status,
            mu.message AS message,
            mu.published_at AS published_at
          FROM maintenance_updates mu
          INNER JOIN scheduled_maintenances sm ON sm.id = mu.maintenance_id
          WHERE sm.status_page_id = $1
            AND mu.published_at >= NOW() - INTERVAL '90 days'
        ) AS feed
        ORDER BY published_at DESC
        LIMIT 50
      `,
      [page.id],
    );

    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    const encodedSlug = encodeURIComponent(page.slug);
    const channelLink = `${origin}/s/${encodedSlug}`;
    const latestPublishedAt = feedResult.rows[0]?.published_at;
    const lastBuildDate = latestPublishedAt ? toRssDate(latestPublishedAt) : new Date().toUTCString();

    const items = feedResult.rows
      .map((row) => {
        const itemPath = row.kind === 'incident'
          ? `/s/${encodedSlug}/incidents/${encodeURIComponent(row.item_id)}`
          : `/s/${encodedSlug}/maintenances/${encodeURIComponent(row.item_id)}`;
        const link = `${origin}${itemPath}`;
        const label = row.kind === 'incident' ? 'Incident' : 'Maintenance';
        const title = `${label}: ${row.item_title}`;
        const description = `Status: ${row.update_status}\n\n${row.message}`;
        const guid = `${row.kind}-${row.item_id}-update-${row.update_id}`;

        return [
          '    <item>',
          `      <title>${escapeXml(title)}</title>`,
          `      <link>${escapeXml(link)}</link>`,
          `      <guid isPermaLink='false'>${escapeXml(guid)}</guid>`,
          `      <pubDate>${escapeXml(toRssDate(row.published_at))}</pubDate>`,
          `      <description>${escapeXml(description)}</description>`,
          '    </item>',
        ].join('\n');
      })
      .join('\n');

    const xml = [
      `<?xml version='1.0' encoding='UTF-8'?>`,
      `<rss version='2.0'>`,
      '  <channel>',
      `    <title>${escapeXml(`${page.name} Updates`)}</title>`,
      `    <link>${escapeXml(channelLink)}</link>`,
      `    <description>${escapeXml(`Public RSS feed for ${page.name} incidents and scheduled maintenances.`)}</description>`,
      `    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>`,
      `    <ttl>15</ttl>`,
      items,
      '  </channel>',
      '</rss>',
    ]
      .filter((line) => line.length > 0)
      .join('\n');

    return new NextResponse(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    });
  } catch (error: unknown) {
    console.error('GET /api/v1/status-pages/[slug]/rss failed', error);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
