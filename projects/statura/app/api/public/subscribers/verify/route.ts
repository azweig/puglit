import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

type VerifySubscriberRow = {
  id: string;
  manage_token: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonBody(request: NextRequest): Promise<{ body?: unknown; error?: string }> {
  try {
    const body: unknown = await request.json();
    return { body };
  } catch {
    return { error: "invalid_json" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJsonBody(request);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const body = parsed.body;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "body_must_be_object" }, { status: 400 });
    }

    const tokenValue = body.token;
    if (typeof tokenValue !== "string") {
      return NextResponse.json({ error: "token_required" }, { status: 400 });
    }

    const token = tokenValue.trim();
    if (token.length === 0) {
      return NextResponse.json({ error: "token_required" }, { status: 400 });
    }
    if (token.length > 512) {
      return NextResponse.json({ error: "token_too_long" }, { status: 400 });
    }

    const { rows } = await pool.query<VerifySubscriberRow>(
      `UPDATE subscribers
       SET verified_at = NOW(), updated_at = NOW()
       WHERE verification_token = $1 AND is_active = TRUE
       RETURNING id, manage_token`,
      [token],
    );

    const subscriber = rows[0];
    if (!subscriber) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      manage_url: `/subscribe/manage/${subscriber.manage_token}`,
    });
  } catch (error: any) {
    console.error("POST /api/public/subscribers/verify failed", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
