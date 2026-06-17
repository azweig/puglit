import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { program_id, membership_number, expiration_date } = await request.json();

  try {
    await pool.query(
      "INSERT INTO user_memberships (user_id, program_id, membership_number, expiration_date) VALUES ($1, $2, $3, $4)",
      [u.id, program_id, membership_number, expiration_date]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add membership" }, { status: 500 });
  }
}