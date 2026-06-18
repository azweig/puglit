import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type SubscriberChannel = "email" | "sms" | "slack" | "webhook";

type DateLike = Date | string | null;

interface SubscriptionRow {
  id: string;
  status_page_id: string;
  channel: SubscriberChannel;
  destination: string;
  verified_at: DateLike;
  is_active: boolean;
  created_at: DateLike;
  updated_at: DateLike;
  status_page_title: string;
  status_page_slug: string;
  status_page_logo_text: string | null;
  status_page_custom_domain: string | null;
  status_page_timezone: string;
}

interface ComponentRow {
  id: string;
  status_page_id: string;
  group_id: string | null;
  name: string;
  description: string | null;
  current_status: string;
  position: number;
  is_visible: boolean;
}

interface SubscriptionResponse {
  id: string;
  status_page_id: string;
  channel: SubscriberChannel;
  destination: string;
  verified_at: DateLike;
  is_active: boolean;
  created_at: DateLike;
  updated_at: DateLike;
  status_page: {
    id: string;
    title: string;
    slug: string;
    logo_text: string | null;
    custom_domain: string | null;
    timezone: string;
  };
  components: ComponentRow[];
}

type ParsedPatchBody =
  | {
      ok: true;
      updateDestination: boolean;
      destination: string | null;
      updateComponents: boolean;
      componentIds: string[] | null;
    }
  | { ok: false; error: string };

const SUBSCRIPTION_WITH_PAGE_SQL = `
  SELECT
    s.id::text AS id,
    s.status_page_id::text AS status_page_id,
    s.channel,
    s.destination,
    s.verified_at,
    s.is_active,
    s.created_at,
    s.updated_at,
    p.title AS status_page_title,
    p.slug AS status_page_slug,
    p.logo_text AS status_page_logo_text,
    p.custom_domain AS status_page_custom_domain,
    p.timezone AS status_page_timezone
  FROM subscribers s
  JOIN status_pages p ON p.id = s.status_page_id
  WHERE s.manage_token = $1 AND s.is_active = TRUE
`;

const COMPONENTS_FOR_SUBSCRIBER_SQL = `
  SELECT
    c.id::text AS id,
    c.status_page_id::text AS status_page_id,
    c.group_id::text AS group_id,
    c.name,
    c.description,
    c.current_status,
    c.position,
    c.is_visible
  FROM subscriber_components sc
  JOIN components c ON c.id = sc.component_id
  WHERE sc.subscriber_id = $1::bigint AND c.status_page_id = $2::bigint
  ORDER BY c.position ASC, c.id ASC
`;

function tokenFromRequest(request: NextRequest): string | null {
  const parts = request.nextUrl.pathname.split("/").filter(Boolean);
  const rawToken = parts[parts.length - 1];

  if (!rawToken) {
    return null;
  }

  try {
    return decodeURIComponent(rawToken);
  } catch {
    return null;
  }
}

function validateToken(token: string | null): token is string {
  if (typeof token !== "string") {
    return false;
  }

  if (token.length < 1 || token.length > 512) {
    return false;
  }

  return !/[\u0000-\u001F\u007F]/.test(token);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function normalizeComponentIds(value: unknown): { ok: true; ids: string[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) {
    return { ok: false, error: "component_ids_must_be_string_array" };
  }

  if (value.length > 500) {
    return { ok: false, error: "too_many_component_ids" };
  }

  const maxBigInt = "9223372036854775807";
  const ids = new Set<string>();

  for (const item of value) {
    if (typeof item !== "string") {
      return { ok: false, error: "component_ids_must_be_string_array" };
    }

    const trimmed = item.trim();
    if (!/^[1-9][0-9]*$/.test(trimmed)) {
      return { ok: false, error: "invalid_component_id" };
    }

    if (trimmed.length > maxBigInt.length || (trimmed.length === maxBigInt.length && trimmed > maxBigInt)) {
      return { ok: false, error: "invalid_component_id" };
    }

    ids.add(trimmed);
  }

  return { ok: true, ids: Array.from(ids) };
}

function parsePatchBody(body: unknown): ParsedPatchBody {
  if (!isRecord(body)) {
    return { ok: false, error: "body_must_be_object" };
  }

  const updateDestination = hasOwn(body, "destination");
  const updateComponents = hasOwn(body, "component_ids");

  if (!updateDestination && !updateComponents) {
    return { ok: false, error: "no_updates" };
  }

  let destination: string | null = null;
  if (updateDestination) {
    const rawDestination = body.destination;
    if (typeof rawDestination !== "string") {
      return { ok: false, error: "destination_must_be_string" };
    }

    destination = rawDestination.trim();
    if (destination.length < 1 || destination.length > 2048) {
      return { ok: false, error: "invalid_destination_length" };
    }
  }

  let componentIds: string[] | null = null;
  if (updateComponents) {
    const normalized = normalizeComponentIds(body.component_ids);
    if (!normalized.ok) {
      return normalized;
    }
    componentIds = normalized.ids;
  }

  return {
    ok: true,
    updateDestination,
    destination,
    updateComponents,
    componentIds,
  };
}

function validateDestinationForChannel(destination: string, channel: SubscriberChannel): string | null {
  if (channel === "email") {
    if (destination.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
      return "invalid_email_destination";
    }
    return null;
  }

  if (channel === "sms") {
    if (destination.length > 32 || !/^[+0-9][0-9 .()\-]{2,31}$/.test(destination)) {
      return "invalid_sms_destination";
    }
    return null;
  }

  if (channel === "webhook") {
    try {
      const parsed = new URL(destination);
      if (parsed.protocol !== "https:") {
        return "webhook_destination_must_be_https";
      }
    } catch {
      return "invalid_webhook_destination";
    }
    return null;
  }

  if (channel === "slack") {
    if (destination.length > 512) {
      return "invalid_slack_destination";
    }
    return null;
  }

  return "invalid_channel";
}

function makeSubscriptionResponse(subscriber: SubscriptionRow, components: ComponentRow[]): SubscriptionResponse {
  return {
    id: subscriber.id,
    status_page_id: subscriber.status_page_id,
    channel: subscriber.channel,
    destination: subscriber.destination,
    verified_at: subscriber.verified_at,
    is_active: subscriber.is_active,
    created_at: subscriber.created_at,
    updated_at: subscriber.updated_at,
    status_page: {
      id: subscriber.status_page_id,
      title: subscriber.status_page_title,
      slug: subscriber.status_page_slug,
      logo_text: subscriber.status_page_logo_text,
      custom_domain: subscriber.status_page_custom_domain,
      timezone: subscriber.status_page_timezone,
    },
    components,
  };
}

function isPgUniqueViolation(error: unknown): boolean {
  return isRecord(error) && error.code === "23505";
}

async function rollbackQuietly(client: { query: (sql: string) => Promise<unknown> }): Promise<void> {
  try {
    await client.query("ROLLBACK");
  } catch (error: any) {
    console.error("Failed to rollback subscription transaction", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = tokenFromRequest(request);
    if (!validateToken(token)) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }

    const subscriberResult = await pool.query<SubscriptionRow>(SUBSCRIPTION_WITH_PAGE_SQL, [token]);
    const subscriber = subscriberResult.rows[0];

    if (!subscriber) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const componentsResult = await pool.query<ComponentRow>(COMPONENTS_FOR_SUBSCRIBER_SQL, [
      subscriber.id,
      subscriber.status_page_id,
    ]);

    return NextResponse.json(makeSubscriptionResponse(subscriber, componentsResult.rows));
  } catch (error: any) {
    console.error("GET /api/public/subscribers/[token] failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = tokenFromRequest(request);
    if (!validateToken(token)) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const parsed = parsePatchBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const subscriberResult = await client.query<SubscriptionRow>(`${SUBSCRIPTION_WITH_PAGE_SQL} FOR UPDATE`, [token]);
      const subscriber = subscriberResult.rows[0];

      if (!subscriber) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }

      if (parsed.updateDestination && parsed.destination !== null) {
        const destinationError = validateDestinationForChannel(parsed.destination, subscriber.channel);
        if (destinationError !== null) {
          await client.query("ROLLBACK");
          return NextResponse.json({ error: destinationError }, { status: 400 });
        }
      }

      if (parsed.updateComponents && parsed.componentIds !== null) {
        if (parsed.componentIds.length > 0) {
          const componentCheck = await client.query<{ id: string }>(
            `
              SELECT id::text AS id
              FROM components
              WHERE status_page_id = $1::bigint AND id = ANY($2::bigint[])
            `,
            [subscriber.status_page_id, parsed.componentIds],
          );

          if (componentCheck.rows.length !== parsed.componentIds.length) {
            await client.query("ROLLBACK");
            return NextResponse.json({ error: "component_ids_must_belong_to_status_page" }, { status: 400 });
          }
        }

        await client.query("DELETE FROM subscriber_components WHERE subscriber_id = $1::bigint", [subscriber.id]);

        if (parsed.componentIds.length > 0) {
          await client.query(
            `
              INSERT INTO subscriber_components (subscriber_id, component_id)
              SELECT $1::bigint, ids.component_id
              FROM unnest($2::bigint[]) AS ids(component_id)
              ON CONFLICT DO NOTHING
            `,
            [subscriber.id, parsed.componentIds],
          );
        }
      }

      if (parsed.updateDestination && parsed.destination !== null) {
        await client.query("UPDATE subscribers SET destination = $1, updated_at = NOW() WHERE id = $2::bigint", [
          parsed.destination,
          subscriber.id,
        ]);
      } else {
        await client.query("UPDATE subscribers SET updated_at = NOW() WHERE id = $1::bigint", [subscriber.id]);
      }

      const refreshedSubscriberResult = await client.query<SubscriptionRow>(SUBSCRIPTION_WITH_PAGE_SQL, [token]);
      const refreshedSubscriber = refreshedSubscriberResult.rows[0];

      if (!refreshedSubscriber) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }

      const componentsResult = await client.query<ComponentRow>(COMPONENTS_FOR_SUBSCRIBER_SQL, [
        refreshedSubscriber.id,
        refreshedSubscriber.status_page_id,
      ]);

      await client.query("COMMIT");

      return NextResponse.json(makeSubscriptionResponse(refreshedSubscriber, componentsResult.rows));
    } catch (error: any) {
      await rollbackQuietly(client);

      if (isPgUniqueViolation(error)) {
        return NextResponse.json({ error: "subscription_destination_conflict" }, { status: 409 });
      }

      console.error("PATCH /api/public/subscribers/[token] failed", error);
      return NextResponse.json({ error: "internal" }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("PATCH /api/public/subscribers/[token] failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = tokenFromRequest(request);
    if (!validateToken(token)) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }

    const result = await pool.query<{
      id: string;
      status_page_id: string;
      channel: SubscriberChannel;
      destination: string;
      is_active: boolean;
      updated_at: DateLike;
    }>(
      `
        UPDATE subscribers
        SET is_active = FALSE, updated_at = NOW()
        WHERE manage_token = $1 AND is_active = TRUE
        RETURNING
          id::text AS id,
          status_page_id::text AS status_page_id,
          channel,
          destination,
          is_active,
          updated_at
      `,
      [token],
    );

    const subscriber = result.rows[0];
    if (!subscriber) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, subscriber });
  } catch (error: any) {
    console.error("DELETE /api/public/subscribers/[token] failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
