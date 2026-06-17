import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { latitude, longitude, address } = await request.json();

  if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof address !== 'string') {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    // Assuming the user's location is stored in a profile JSONB column in the users table
    await pool.query(
      "UPDATE users SET profile = jsonb_set(profile, '{location}', $1) WHERE id=$2",
      [JSON.stringify({ latitude, longitude, address }), u.userId]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}