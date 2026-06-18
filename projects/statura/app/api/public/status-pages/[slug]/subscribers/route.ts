import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";

type SubscribeChannel = "email" | "sms" | "slack" | "webhook" | "rss";
type StoredChannel = Exclude<SubscribeChannel, "rss">;

interface StatusPageRow {
  id: string;
  title: string;
  sms_enabled: boolean;
  slack_enabled: boolean;
  webhook_enabled: boolean;
}

interface SubscriberRow {
  id: string;
  verification_token: string;
  manage_token: string;
}

interface ComponentIdRow {
  id: string;
}

interface SubscribeBody {
  channel: SubscribeChannel;
  destination?: string;
  component_ids?: string[];
}

const CHANNELS = new Set<SubscribeChannel>(["email", "sms", "slack", "webhook", "rss"]);
const MAX_DESTINATION_LENGTH = 2048;
const MAX_COMPONENT_IDS = 250;
const MAX_BIGINT = BigInt("9223372036854775807");

type EmailSender = (to: string, subject: string, html: string) => Promise<void> | void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSlugFromRequest(request: NextRequest): string | null {
  const pathname = new URL(request.url).pathname;
  const parts = pathname.split("/").filter(Boolean);
  const statusPagesIndex = parts.findIndex((part, index) => part === "status-pages" && parts[index - 1] === "public");

  if (statusPagesIndex < 0 || !parts[statusPagesIndex + 1]) {
    return null;
  }

  try {
    const slug = decodeURIComponent(parts[statusPagesIndex + 1]).trim();
    if (slug.length < 1 || slug.length > 200) {
      return null;
    }
    return slug;
  } catch {
    return null;
  }
}

function parseBody(value: unknown): { body?: SubscribeBody; error?: string } {
  if (!isRecord(value)) {
    return { error: "body must be an object" };
  }

  const channelValue = value.channel;
  if (typeof channelValue !== "string" || !CHANNELS.has(channelValue as SubscribeChannel)) {
    return { error: "channel must be one of email, sms, slack, webhook, rss" };
  }

  let destination: string | undefined;
  if (value.destination !== undefined) {
    if (typeof value.destination !== "string") {
      return { error: "destination must be a string" };
    }
    destination = value.destination.trim();
    if (destination.length > MAX_DESTINATION_LENGTH) {
      return { error: "destination is too long" };
    }
  }

  let componentIds: string[] | undefined;
  if (value.component_ids !== undefined) {
    if (!Array.isArray(value.component_ids)) {
      return { error: "component_ids must be an array of strings" };
    }
    if (value.component_ids.length > MAX_COMPONENT_IDS) {
      return { error: `component_ids cannot contain more than ${MAX_COMPONENT_IDS} items` };
    }

    const seen = new Set<string>();
    componentIds = [];
    for (const rawId of value.component_ids) {
      if (typeof rawId !== "string") {
        return { error: "component_ids must be an array of strings" };
      }
      const id = rawId.trim();
      if (!/^[1-9][0-9]{0,18}$/.test(id)) {
        return { error: "component_ids must contain positive numeric string ids" };
      }
      if (BigInt(id) > MAX_BIGINT) {
        return { error: "component_ids contains an id outside the supported range" };
      }
      if (!seen.has(id)) {
        seen.add(id);
        componentIds.push(id);
      }
    }
  }

  return {
    body: {
      channel: channelValue as SubscribeChannel,
      destination,
      component_ids: componentIds,
    },
  };
}

function normalizeAndValidateDestination(channel: StoredChannel, destination: string | undefined): { destination?: string; error?: string } {
  if (destination === undefined || destination.length === 0) {
    return { error: "destination is required" };
  }

  if (channel === "email") {
    const normalized = destination.toLowerCase();
    if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { error: "destination must be a valid email address" };
    }
    return { destination: normalized };
  }

  if (channel === "sms") {
    if (destination.length > 64) {
      return { error: "sms destination is too long" };
    }
    return { destination };
  }

  try {
    const parsedUrl = new URL(destination);
    if (parsedUrl.protocol !== "https:") {
      return { error: `${channel} destination must be an https URL` };
    }
    return { destination: parsedUrl.toString() };
  } catch {
    return { error: `${channel} destination must be an https URL` };
  }
}

function channelEnabled(page: StatusPageRow, channel: StoredChannel): boolean {
  if (channel === "sms") {
    return page.sms_enabled;
  }
  if (channel === "slack") {
    return page.slack_enabled;
  }
  if (channel === "webhook") {
    return page.webhook_enabled;
  }
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function readJson(request: NextRequest): Promise<{ value?: unknown; error?: string }> {
  try {
    return { value: await request.json() };
  } catch {
    return { error: "invalid json body" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const slug = getSlugFromRequest(request);
    if (!slug) {
      return NextResponse.json({ error: "invalid slug" }, { status: 400 });
    }

    const json = await readJson(request);
    if (json.error) {
      return NextResponse.json({ error: json.error }, { status: 400 });
    }

    const parsed = parseBody(json.value);
    if (parsed.error || !parsed.body) {
      return NextResponse.json({ error: parsed.error ?? "invalid body" }, { status: 400 });
    }

    const pageResult = await pool.query<StatusPageRow>(
      `SELECT id, title, sms_enabled, slack_enabled, webhook_enabled
       FROM status_pages
       WHERE slug = $1 AND is_public = TRUE
       LIMIT 1`,
      [slug],
    );

    const page = pageResult.rows[0];
    if (!page) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    if (parsed.body.channel === "rss") {
      return NextResponse.json({ feed_url: `/api/public/status-pages/${encodeURIComponent(slug)}/rss` }, { status: 200 });
    }

    const channel = parsed.body.channel;
    if (!channelEnabled(page, channel)) {
      return NextResponse.json({ error: `${channel} subscriptions are not enabled for this status page` }, { status: 403 });
    }

    const destinationResult = normalizeAndValidateDestination(channel, parsed.body.destination);
    if (destinationResult.error || !destinationResult.destination) {
      return NextResponse.json({ error: destinationResult.error ?? "invalid destination" }, { status: 400 });
    }

    let validComponentIds: string[] = [];
    const requestedComponentIds = parsed.body.component_ids ?? [];
    if (requestedComponentIds.length > 0) {
      const componentResult = await pool.query<ComponentIdRow>(
        `SELECT id::text AS id
         FROM components
         WHERE status_page_id = $1 AND id = ANY($2::bigint[])
         ORDER BY position ASC, id ASC`,
        [page.id, requestedComponentIds],
      );
      validComponentIds = componentResult.rows.map((row) => row.id);

      if (validComponentIds.length === 0) {
        return NextResponse.json({ error: "component_ids do not match this status page" }, { status: 400 });
      }
    }

    const verificationToken = globalThis.crypto.randomUUID();
    const manageToken = globalThis.crypto.randomUUID();

    const client = await pool.connect();
    let subscriber: SubscriberRow;

    try {
      await client.query("BEGIN");

      const subscriberResult = await client.query<SubscriberRow>(
        `INSERT INTO subscribers (status_page_id, channel, destination, verification_token, manage_token)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (status_page_id, channel, destination)
         DO UPDATE SET verification_token = $4, is_active = TRUE, updated_at = NOW()
         RETURNING id::text AS id, verification_token, manage_token`,
        [page.id, channel, destinationResult.destination, verificationToken, manageToken],
      );

      subscriber = subscriberResult.rows[0];
      if (!subscriber) {
        throw new Error("subscriber upsert did not return a row");
      }

      await client.query(
        `DELETE FROM subscriber_components
         WHERE subscriber_id = $1`,
        [subscriber.id],
      );

      if (validComponentIds.length > 0) {
        await client.query(
          `INSERT INTO subscriber_components (subscriber_id, component_id)
           SELECT $1::bigint, id
           FROM components
           WHERE status_page_id = $2 AND id = ANY($3::bigint[])
           ON CONFLICT DO NOTHING`,
          [subscriber.id, page.id, validComponentIds],
        );
      }

      await client.query("COMMIT");
    } catch (error: any) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const baseUrl = new URL(request.url).origin;
    const verifyUrl = `${baseUrl}/subscribe/verify?token=${encodeURIComponent(subscriber.verification_token)}`;

    if (channel === "email") {
      try {
        const emailSender = sendEmail as EmailSender;
        await emailSender(
          destinationResult.destination,
          `Verify your ${page.title} status updates subscription`,
          `<p>Confirm your subscription to updates for <strong>${escapeHtml(page.title)}</strong>.</p><p><a href="${escapeHtml(verifyUrl)}">Verify subscription</a></p><p>If the button does not work, copy and paste this link into your browser: ${escapeHtml(verifyUrl)}</p>`,
        );
      } catch (emailError: any) {
        console.error("failed to send subscriber verification email", emailError);
        return NextResponse.json(
          {
            id: subscriber.id,
            channel,
            destination: destinationResult.destination,
            status: "pending_verification",
            verification_delivery: "failed",
          },
          { status: 201 },
        );
      }

      return NextResponse.json(
        {
          id: subscriber.id,
          channel,
          destination: destinationResult.destination,
          status: "pending_verification",
          verification_delivery: "sent",
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        id: subscriber.id,
        channel,
        destination: destinationResult.destination,
        status: "pending_verification",
        instructions:
          channel === "sms"
            ? "Check the SMS destination for verification instructions if SMS delivery is configured."
            : "Confirm that the HTTPS endpoint can receive status page notifications; verification is pending.",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("public subscriber create failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
