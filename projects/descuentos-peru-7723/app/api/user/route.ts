import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.program_id && body.membership_id && body.expiration_date) {
    // Add a loyalty program to the user's memberships
    const { program_id, membership_id, expiration_date } = body;
    await pool.query(
      "INSERT INTO user_memberships (user_id, program_id, membership_id, expiration_date) VALUES ($1, $2, $3, $4)",
      [u.userId, program_id, membership_id, expiration_date]
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const program_id = url.searchParams.get("program_id");

  if (!program_id) {
    return NextResponse.json({ error: "program_id is required" }, { status: 400 });
  }

  await pool.query(
    "DELETE FROM user_memberships WHERE user_id = $1 AND program_id = $2",
    [u.userId, program_id]
  );

  return NextResponse.json({ success: true });
}