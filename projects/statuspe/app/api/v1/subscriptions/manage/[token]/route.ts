import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type QueryResult<Row> = {
  rows: Row[];
};

type QueryValues = readonly unknown[];

type DbQueryable = {
  query<Row = Record<string, unknown>>(text: string, values?: QueryValues): Promise<QueryResult<Row>>;
};

type DbClient = DbQueryable & {
  release(): void;
};

type DbPool = DbQueryable & {
  connect(): Promise<DbClient>;
};

const globalForPostgresPool = globalThis as typeof globalThis & {
  __subscriptionsManagePool?: DbPool;
};

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  return databaseUrl;
}

function shouldUseSsl(databaseUrl: string): boolean {
  if (process.env.PGSSLMODE === "disable") {
    return false;
  }

  return !/localhost|127\.0\.0\.1|::1/.test(databaseUrl);
}

function createPool(): DbPool {
  const { Pool } = require("pg") as { Pool: new (options: Record<string, unknown>) => DbPool };
  const databaseUrl = getDatabaseUrl();
  const options: Record<string, unknown> = { connectionString: databaseUrl };

  if (shouldUseSsl(databaseUrl)) {
    options.ssl = { rejectUnauthorized: false };
  }

  return new Pool(options);
}

function getPool(): DbPool {
  if (!globalForPostgresPool.__subscriptionsManagePool) {
    globalForPostgresPool.__subscriptionsManagePool = createPool();
  }

  return globalForPostgresPool.__subscriptionsManagePool;
}

const pool: DbPool = {
  query<Row = Record<string, unknown>>(text: string, values?: QueryValues): Promise<QueryResult<Row>> {
    return getPool().query<Row>(text, values);
  },
  connect(): Promise<DbClient> {
    return getPool().connect();
  },
};

type SubscriberRow = {
  id: string;
  status_page_id: string;
  channel: "email" | "webhook";
  email: string | null;
  webhook_url: string | null;
  phone: string | null;
  wants_all_components: boolean;
  verification_token: string;
  manage_token: string;
  verified_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
  slug: string;
  name: string;
};

type ComponentRow = {
  id: string;
  status_page_id: string;
  group_id: string | null;
  name: string;
  description: string | null;
  position: number;
  current_status: "operational" | "degraded" | "outage" | "paused" | "maintenance";
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

type SelectedComponentRow = {
  component_id: string;
};

type ComponentResponse = ComponentRow & {
  selected: boolean;
};

type ManageSubscriptionResponse = SubscriberRow & {
  selected_component_ids: string[];
  components: ComponentResponse[];
};

type PatchPreferences = {
  wantsAllComponents: boolean;
  componentIds: number[];
};

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getManageToken(request: NextRequest): string | null {
  const pathname = new URL(request.url).pathname;
  const marker = "/api/v1/subscriptions/manage/";
  const markerIndex = pathname.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const rawToken = pathname.slice(markerIndex + marker.length).split("/")[0];
  if (!rawToken) {
    return null;
  }

  try {
    const token = decodeURIComponent(rawToken).trim();
    if (token.length < 8 || token.length > 512) {
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

async function readJson(request: NextRequest): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  try {
    const value: unknown = await request.json();
    return { ok: true, value };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}

function parsePatchPreferences(value: unknown): { ok: true; value: PatchPreferences } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return { ok: false, error: "body_must_be_object" };
  }

  const allowedKeys = new Set(["wants_all_components", "component_ids"]);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      return { ok: false, error: `unsupported_field:${key}` };
    }
  }

  if (typeof value.wants_all_components !== "boolean") {
    return { ok: false, error: "wants_all_components_must_be_boolean" };
  }

  if (!Array.isArray(value.component_ids)) {
    return { ok: false, error: "component_ids_must_be_array" };
  }

  if (value.component_ids.length > 1000) {
    return { ok: false, error: "component_ids_too_many" };
  }

  const deduped = new Set<number>();
  for (const rawId of value.component_ids) {
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return { ok: false, error: "component_ids_must_be_positive_integers" };
    }
    deduped.add(id);
  }

  return {
    ok: true,
    value: {
      wantsAllComponents: value.wants_all_components,
      componentIds: Array.from(deduped),
    },
  };
}

async function loadSubscriptionResponse(manageToken: string): Promise<ManageSubscriptionResponse | null> {
  const subscriberResult = await pool.query<SubscriberRow>(
    `SELECT
       s.id,
       s.status_page_id,
       s.channel,
       s.email,
       s.webhook_url,
       s.phone,
       s.wants_all_components,
       s.verification_token,
       s.manage_token,
       s.verified_at,
       s.unsubscribed_at,
       s.created_at,
       s.updated_at,
       sp.slug,
       sp.name
     FROM subscribers s
     JOIN status_pages sp ON sp.id = s.status_page_id
     WHERE s.manage_token = $1`,
    [manageToken],
  );

  const subscriber = subscriberResult.rows[0];
  if (!subscriber) {
    return null;
  }

  const componentsResult = await pool.query<ComponentRow>(
    `SELECT
       id,
       status_page_id,
       group_id,
       name,
       description,
       position,
       current_status,
       is_public,
       created_at,
       updated_at
     FROM components
     WHERE status_page_id = $1
     ORDER BY position ASC, id ASC`,
    [subscriber.status_page_id],
  );

  const selectedResult = await pool.query<SelectedComponentRow>(
    `SELECT component_id
     FROM subscriber_components
     WHERE subscriber_id = $1
     ORDER BY component_id ASC`,
    [subscriber.id],
  );

  const selectedComponentIds = selectedResult.rows.map((row) => row.component_id);
  const selectedSet = new Set(selectedComponentIds);
  const components = componentsResult.rows.map((component) => ({
    ...component,
    selected: selectedSet.has(component.id),
  }));

  return {
    ...subscriber,
    selected_component_ids: selectedComponentIds,
    components,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = getManageToken(request);
    if (!token) {
      return errorResponse("invalid_token", 400);
    }

    const response = await loadSubscriptionResponse(token);
    if (!response) {
      return errorResponse("not_found", 404);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v1/subscriptions/manage/[token] failed", error);
    return errorResponse("internal", 500);
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const token = getManageToken(request);
    if (!token) {
      return errorResponse("invalid_token", 400);
    }

    const parsedJson = await readJson(request);
    if (!parsedJson.ok) {
      return errorResponse(parsedJson.error, 400);
    }

    const parsedPreferences = parsePatchPreferences(parsedJson.value);
    if (!parsedPreferences.ok) {
      return errorResponse(parsedPreferences.error, 400);
    }

    const { wantsAllComponents, componentIds } = parsedPreferences.value;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const subscriberResult = await client.query<SubscriberRow>(
        `SELECT
           s.id,
           s.status_page_id,
           s.channel,
           s.email,
           s.webhook_url,
           s.phone,
           s.wants_all_components,
           s.verification_token,
           s.manage_token,
           s.verified_at,
           s.unsubscribed_at,
           s.created_at,
           s.updated_at,
           sp.slug,
           sp.name
         FROM subscribers s
         JOIN status_pages sp ON sp.id = s.status_page_id
         WHERE s.manage_token = $1
         FOR UPDATE OF s`,
        [token],
      );

      const subscriber = subscriberResult.rows[0];
      if (!subscriber) {
        await client.query("ROLLBACK");
        return errorResponse("not_found", 404);
      }

      if (componentIds.length > 0) {
        const validComponentsResult = await client.query<{ id: string }>(
          `SELECT id
           FROM components
           WHERE status_page_id = $1
             AND id = ANY($2::bigint[])`,
          [subscriber.status_page_id, componentIds],
        );

        if (validComponentsResult.rows.length !== componentIds.length) {
          await client.query("ROLLBACK");
          return errorResponse("invalid_component_ids", 400);
        }
      }

      const updatedSubscriberResult = await client.query<SubscriberRow>(
        `UPDATE subscribers
         SET wants_all_components = $2,
             updated_at = NOW()
         WHERE id = $1
         RETURNING
           id,
           status_page_id,
           channel,
           email,
           webhook_url,
           phone,
           wants_all_components,
           verification_token,
           manage_token,
           verified_at,
           unsubscribed_at,
           created_at,
           updated_at,
           $3::text AS slug,
           $4::text AS name`,
        [subscriber.id, wantsAllComponents, subscriber.slug, subscriber.name],
      );

      const updatedSubscriber = updatedSubscriberResult.rows[0];
      if (!updatedSubscriber) {
        await client.query("ROLLBACK");
        return errorResponse("not_found", 404);
      }

      await client.query(
        `DELETE FROM subscriber_components
         WHERE subscriber_id = $1`,
        [updatedSubscriber.id],
      );

      if (!wantsAllComponents && componentIds.length > 0) {
        await client.query(
          `INSERT INTO subscriber_components (subscriber_id, component_id)
           SELECT $1::bigint, unnest($2::bigint[])`,
          [updatedSubscriber.id, componentIds],
        );
      }

      const componentsResult = await client.query<ComponentRow>(
        `SELECT
           id,
           status_page_id,
           group_id,
           name,
           description,
           position,
           current_status,
           is_public,
           created_at,
           updated_at
         FROM components
         WHERE status_page_id = $1
         ORDER BY position ASC, id ASC`,
        [updatedSubscriber.status_page_id],
      );

      const selectedResult = await client.query<SelectedComponentRow>(
        `SELECT component_id
         FROM subscriber_components
         WHERE subscriber_id = $1
         ORDER BY component_id ASC`,
        [updatedSubscriber.id],
      );

      await client.query("COMMIT");

      const selectedComponentIds = selectedResult.rows.map((row) => row.component_id);
      const selectedSet = new Set(selectedComponentIds);
      const components = componentsResult.rows.map((component) => ({
        ...component,
        selected: selectedSet.has(component.id),
      }));

      return NextResponse.json(
        {
          ...updatedSubscriber,
          selected_component_ids: selectedComponentIds,
          components,
        },
        { status: 200 },
      );
    } catch (error: any) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError: any) {
        console.error("PATCH /api/v1/subscriptions/manage/[token] rollback failed", rollbackError);
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("PATCH /api/v1/subscriptions/manage/[token] failed", error);
    return errorResponse("internal", 500);
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const token = getManageToken(request);
    if (!token) {
      return errorResponse("invalid_token", 400);
    }

    const result = await pool.query<{ id: string }>(
      `UPDATE subscribers
       SET unsubscribed_at = NOW(),
           updated_at = NOW()
       WHERE manage_token = $1
       RETURNING id`,
      [token],
    );

    if (result.rows.length === 0) {
      return errorResponse("not_found", 404);
    }

    return NextResponse.json({ ok: true, unsubscribed: true }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/v1/subscriptions/manage/[token] failed", error);
    return errorResponse("internal", 500);
  }
}
