import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const runtime = 'nodejs';

type Channel = 'email' | 'webhook';

type PageRow = {
  id: string;
  name: string;
  slug: string;
  subscribe_email_enabled: boolean;
  subscribe_webhook_enabled: boolean;
  subscribe_rss_enabled: boolean;
};

type ComponentRow = {
  id: string;
  name: string;
  current_status: string;
};

type IdRow = {
  id: string;
};

type ValidatedSubscription = {
  channel: Channel;
  email: string | null;
  webhook_url: string | null;
  wants_all_components: boolean;
  component_ids: number[];
};

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

class VerificationDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VerificationDeliveryError';
  }
}

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function generateBearerToken(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function sha256Digest(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
  return Buffer.from(new Uint8Array(digest)).toString('hex');
}

function getSlug(request: NextRequest): ValidationResult<string> {
  const parts = request.nextUrl.pathname.split('/').filter(Boolean);
  const markerIndex = parts.indexOf('status-pages');

  if (markerIndex < 0 || markerIndex + 1 >= parts.length) {
    return { ok: false, error: 'missing slug' };
  }

  let slug: string;
  try {
    slug = decodeURIComponent(parts[markerIndex + 1] ?? '');
  } catch {
    return { ok: false, error: 'invalid slug' };
  }

  if (slug.length < 1 || slug.length > 160 || slug.includes('/') || /[\u0000-\u001F\u007F]/.test(slug)) {
    return { ok: false, error: 'invalid slug' };
  }

  return { ok: true, value: slug };
}

function parsePagination(searchParams: URLSearchParams): ValidationResult<{ limit: number; offset: number }> {
  const rawLimit = searchParams.get('limit');
  const rawOffset = searchParams.get('offset');

  const limit = rawLimit === null ? 100 : Number(rawLimit);
  const offset = rawOffset === null ? 0 : Number(rawOffset);

  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    return { ok: false, error: 'limit must be an integer between 1 and 200' };
  }

  if (!Number.isInteger(offset) || offset < 0 || offset > 100000) {
    return { ok: false, error: 'offset must be an integer between 0 and 100000' };
  }

  return { ok: true, value: { limit, offset } };
}

function validateSubscribeBody(body: unknown): ValidationResult<ValidatedSubscription> {
  if (!isRecord(body)) {
    return { ok: false, error: 'body must be an object' };
  }

  const channelValue = body.channel;
  if (channelValue !== 'email' && channelValue !== 'webhook') {
    return { ok: false, error: 'channel must be email or webhook' };
  }

  const wantsAllValue = body.wants_all_components;
  let wantsAllComponents = true;
  if (wantsAllValue !== undefined) {
    if (typeof wantsAllValue !== 'boolean') {
      return { ok: false, error: 'wants_all_components must be a boolean' };
    }
    wantsAllComponents = wantsAllValue;
  }

  let email: string | null = null;
  let webhookUrl: string | null = null;

  if (channelValue === 'email') {
    if (typeof body.email !== 'string') {
      return { ok: false, error: 'email is required' };
    }

    email = body.email.trim().toLowerCase();
    if (email.length < 3 || email.length > 254 || !email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
      return { ok: false, error: 'email is invalid' };
    }
  }

  if (channelValue === 'webhook') {
    if (typeof body.webhook_url !== 'string') {
      return { ok: false, error: 'webhook_url is required' };
    }

    webhookUrl = body.webhook_url.trim();
    if (webhookUrl.length < 9 || webhookUrl.length > 2048 || !webhookUrl.startsWith('https://')) {
      return { ok: false, error: 'webhook_url must start with https://' };
    }

    try {
      const parsed = new URL(webhookUrl);
      if (parsed.protocol !== 'https:') {
        return { ok: false, error: 'webhook_url must start with https://' };
      }
    } catch {
      return { ok: false, error: 'webhook_url is invalid' };
    }
  }

  const componentIds: number[] = [];
  if (!wantsAllComponents) {
    if (!Array.isArray(body.component_ids)) {
      return { ok: false, error: 'component_ids must be an array when wants_all_components is false' };
    }

    if (body.component_ids.length < 1 || body.component_ids.length > 500) {
      return { ok: false, error: 'component_ids must contain between 1 and 500 ids' };
    }

    const seen = new Set<number>();
    for (const rawId of body.component_ids) {
      let id: number;
      if (typeof rawId === 'number') {
        id = rawId;
      } else if (typeof rawId === 'string' && rawId.trim().length > 0) {
        id = Number(rawId.trim());
      } else {
        return { ok: false, error: 'component_ids must contain only numeric ids' };
      }

      if (!Number.isSafeInteger(id) || id <= 0) {
        return { ok: false, error: 'component_ids must contain only positive integer ids' };
      }

      if (!seen.has(id)) {
        seen.add(id);
        componentIds.push(id);
      }
    }
  }

  return {
    ok: true,
    value: {
      channel: channelValue,
      email,
      webhook_url: webhookUrl,
      wants_all_components: wantsAllComponents,
      component_ids: componentIds,
    },
  };
}

function getPgErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

function makeVerificationUrl(request: NextRequest, token: string): string {
  const url = new URL('/subscribe/verify', request.nextUrl.origin);
  url.searchParams.set('token', token);
  return url.toString();
}

function maskEmail(email: string): string {
  const [localPart = '', domain = ''] = email.split('@');
  const maskedLocal = localPart.length <= 1 ? '*' : `${localPart.slice(0, Math.min(2, localPart.length))}***`;
  const domainParts = domain.split('.').filter(Boolean);

  if (domainParts.length === 0) {
    return `${maskedLocal}@***`;
  }

  const firstDomainPart = domainParts[0] ?? '';
  const maskedFirstDomainPart = firstDomainPart.length <= 1 ? '*' : `${firstDomainPart.charAt(0)}***`;
  const maskedDomain = [maskedFirstDomainPart, ...domainParts.slice(1)].join('.');

  return `${maskedLocal}@${maskedDomain}`;
}

function maskWebhookUrl(webhookUrl: string): string {
  try {
    const parsed = new URL(webhookUrl);
    return `${parsed.origin}/…`;
  } catch {
    return 'https://…';
  }
}

function maskDestination(subscription: ValidatedSubscription): string {
  if (subscription.channel === 'email' && subscription.email !== null) {
    return maskEmail(subscription.email);
  }

  if (subscription.channel === 'webhook' && subscription.webhook_url !== null) {
    return maskWebhookUrl(subscription.webhook_url);
  }

  return '';
}

async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? process.env.EMAIL_FROM ?? process.env.STATUSPE_EMAIL_FROM;

  if (!apiKey || !from) {
    throw new VerificationDeliveryError('email delivery is not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    throw new VerificationDeliveryError(`email delivery failed: ${response.status}`);
  }
}

async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
  const subject = 'Verify your StatusPe subscription';
  const text = `Open this link to verify your subscription: ${verificationUrl}`;

  await sendEmail({ to, subject, text });
}

async function sendWebhookChallenge(webhookUrl: string, payload: unknown): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'StatusPe-Subscription-Verification',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new VerificationDeliveryError(`webhook verification challenge failed: ${response.status}`);
    }
  } catch (error: any) {
    if (error instanceof VerificationDeliveryError) {
      throw error;
    }

    throw new VerificationDeliveryError('webhook verification challenge failed');
  } finally {
    clearTimeout(timeout);
  }
}

async function sendVerificationChallenge(
  subscription: ValidatedSubscription,
  page: PageRow,
  verificationToken: string,
  verificationUrl: string,
): Promise<void> {
  if (subscription.channel === 'email') {
    if (subscription.email === null) {
      throw new VerificationDeliveryError('email is missing');
    }

    await sendVerificationEmail(subscription.email, verificationUrl);
    return;
  }

  if (subscription.webhook_url === null) {
    throw new VerificationDeliveryError('webhook_url is missing');
  }

  await sendWebhookChallenge(subscription.webhook_url, {
    type: 'status_page_subscription_verification',
    status_page: {
      id: page.id,
      name: page.name,
      slug: page.slug,
    },
    channel: subscription.channel,
    verification_token: verificationToken,
    verification_url: verificationUrl,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const slugResult = getSlug(request);
    if (!slugResult.ok) {
      return jsonError(slugResult.error, 400);
    }

    const paginationResult = parsePagination(request.nextUrl.searchParams);
    if (!paginationResult.ok) {
      return jsonError(paginationResult.error, 400);
    }

    const pageResult = await pool.query<PageRow>(
      `SELECT id, name, slug, subscribe_email_enabled, subscribe_webhook_enabled, subscribe_rss_enabled
       FROM status_pages
       WHERE slug = $1 AND is_public = TRUE
       LIMIT 1`,
      [slugResult.value],
    );

    const page = pageResult.rows[0];
    if (!page) {
      return jsonError('not found', 404);
    }

    const { limit, offset } = paginationResult.value;
    const componentsResult = await pool.query<ComponentRow>(
      `SELECT id, name, current_status
       FROM components
       WHERE status_page_id = $1 AND is_public = TRUE
       ORDER BY position, name
       LIMIT $2 OFFSET $3`,
      [page.id, limit, offset],
    );

    return NextResponse.json({
      status_page: {
        id: page.id,
        name: page.name,
        slug: page.slug,
      },
      channels: {
        email: page.subscribe_email_enabled,
        webhook: page.subscribe_webhook_enabled,
        rss: page.subscribe_rss_enabled,
      },
      components: componentsResult.rows,
      pagination: { limit, offset },
    });
  } catch (error: any) {
    console.error('GET /api/v1/status-pages/[slug]/subscribe failed', error);
    return jsonError('internal', 500);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const slugResult = getSlug(request);
    if (!slugResult.ok) {
      return jsonError(slugResult.error, 400);
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return jsonError('invalid json body', 400);
    }

    const bodyResult = validateSubscribeBody(rawBody);
    if (!bodyResult.ok) {
      return jsonError(bodyResult.error, 400);
    }

    const subscription = bodyResult.value;

    const pageResult = await pool.query<PageRow>(
      `SELECT id, name, slug, subscribe_email_enabled, subscribe_webhook_enabled, subscribe_rss_enabled
       FROM status_pages
       WHERE slug = $1 AND is_public = TRUE
       LIMIT 1`,
      [slugResult.value],
    );

    const page = pageResult.rows[0];
    if (!page) {
      return jsonError('not found', 404);
    }

    if (subscription.channel === 'email' && !page.subscribe_email_enabled) {
      return jsonError('email subscriptions are disabled', 403);
    }

    if (subscription.channel === 'webhook' && !page.subscribe_webhook_enabled) {
      return jsonError('webhook subscriptions are disabled', 403);
    }

    if (subscription.channel === 'email') {
      const duplicateResult = await pool.query<IdRow>(
        `SELECT id
         FROM subscribers
         WHERE status_page_id = $1
           AND channel = 'email'
           AND lower(email) = lower($2::text)
           AND unsubscribed_at IS NULL
         LIMIT 1`,
        [page.id, subscription.email],
      );

      if (duplicateResult.rows.length > 0) {
        return jsonError('subscription already exists', 409);
      }
    } else {
      const duplicateResult = await pool.query<IdRow>(
        `SELECT id
         FROM subscribers
         WHERE status_page_id = $1
           AND channel = 'webhook'
           AND webhook_url = $2
           AND unsubscribed_at IS NULL
         LIMIT 1`,
        [page.id, subscription.webhook_url],
      );

      if (duplicateResult.rows.length > 0) {
        return jsonError('subscription already exists', 409);
      }
    }

    const verificationToken = generateBearerToken();
    const manageToken = generateBearerToken();
    const verificationTokenHash = await sha256Digest(verificationToken);
    const manageTokenHash = await sha256Digest(manageToken);
    const verificationUrl = makeVerificationUrl(request, verificationToken);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (!subscription.wants_all_components) {
        const componentResult = await client.query<IdRow>(
          `SELECT id
           FROM components
           WHERE status_page_id = $1
             AND is_public = TRUE
             AND id = ANY($2::bigint[])`,
          [page.id, subscription.component_ids],
        );

        const foundIds = new Set(componentResult.rows.map((row) => row.id));
        const allIdsBelongToPage = subscription.component_ids.every((id) => foundIds.has(String(id)));
        if (!allIdsBelongToPage) {
          await client.query('ROLLBACK');
          return jsonError('component_ids must belong to the public status page', 400);
        }
      }

      const insertResult = await client.query<IdRow>(
        `INSERT INTO subscribers
          (status_page_id, channel, email, webhook_url, wants_all_components, verification_token, manage_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          page.id,
          subscription.channel,
          subscription.email,
          subscription.webhook_url,
          subscription.wants_all_components,
          verificationTokenHash,
          manageTokenHash,
        ],
      );

      const inserted = insertResult.rows[0];
      if (!inserted) {
        throw new Error('subscriber insert did not return id');
      }

      if (!subscription.wants_all_components) {
        await client.query(
          `INSERT INTO subscriber_components (subscriber_id, component_id)
           SELECT $1, unnest($2::bigint[])`,
          [inserted.id, subscription.component_ids],
        );
      }

      await sendVerificationChallenge(subscription, page, verificationToken, verificationUrl);

      await client.query('COMMIT');
    } catch (error: any) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError: any) {
        console.error('subscription transaction rollback failed', rollbackError);
      }

      if (getPgErrorCode(error) === '23505') {
        return jsonError('subscription conflict', 409);
      }

      if (error instanceof VerificationDeliveryError) {
        console.error('subscription verification delivery failed', error);
        return jsonError('verification delivery failed', 503);
      }

      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json(
      {
        ok: true,
        channel: subscription.channel,
        destinationMasked: maskDestination(subscription),
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('POST /api/v1/status-pages/[slug]/subscribe failed', error);
    return jsonError('internal', 500);
  }
}
