import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type QueryResult<TRow> = {
  rows: TRow[];
};

type QueryablePool = {
  query<TRow = unknown>(text: string, values?: readonly unknown[]): Promise<QueryResult<TRow>>;
};

type PgModule = {
  Pool: new (config?: Record<string, unknown>) => QueryablePool;
};

declare global {
  // eslint-disable-next-line no-var
  var __subscriptionsVerifyPool: QueryablePool | undefined;
}

type VerifySubscriptionRow = {
  email: string;
  manage_token: string;
  verified_at: Date | string;
  status_slug: string;
  status_name: string;
};

function createPool(): QueryablePool {
  const { Pool } = require("pg") as PgModule;
  const connectionString = process.env.DATABASE_URL;
  const config = connectionString ? { connectionString } : undefined;

  return new Pool(config);
}

function getPool(): QueryablePool {
  if (!globalThis.__subscriptionsVerifyPool) {
    globalThis.__subscriptionsVerifyPool = createPool();
  }

  return globalThis.__subscriptionsVerifyPool;
}

const pool = getPool();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    if (!isRecord(body)) {
      return NextResponse.json({ error: "body_must_be_object" }, { status: 400 });
    }

    const rawToken = body.token;
    if (typeof rawToken !== "string") {
      return NextResponse.json({ error: "token_required" }, { status: 400 });
    }

    const token = rawToken.trim();
    if (token.length === 0) {
      return NextResponse.json({ error: "token_required" }, { status: 400 });
    }

    if (token.length > 512) {
      return NextResponse.json({ error: "token_too_long" }, { status: 400 });
    }

    const { rows } = await pool.query<VerifySubscriptionRow>(
      `WITH verified AS (
         UPDATE subscribers s
         SET verified_at = COALESCE(s.verified_at, NOW()),
             updated_at = NOW()
         WHERE s.verification_token = $1
           AND s.unsubscribed_at IS NULL
         RETURNING s.email, s.manage_token, s.verified_at, s.status_page_id
       )
       SELECT v.email,
              v.manage_token,
              v.verified_at,
              sp.slug AS status_slug,
              sp.name AS status_name
       FROM verified v
       JOIN status_pages sp ON sp.id = v.status_page_id`,
      [token],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const row = rows[0];

    return NextResponse.json(
      {
        ok: true,
        subscriber: {
          email: row.email,
          manage_token: row.manage_token,
          verified_at: row.verified_at,
        },
        status_page: {
          slug: row.status_slug,
          name: row.status_name,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("POST /api/v1/subscriptions/verify failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
