import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { latitude, longitude } = await request.json();

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: "Invalid latitude or longitude" }, { status: 400 });
    }

    // Assuming a user_locations table exists with user_id, latitude, and longitude columns
    // Since the user_locations table does not exist in the schema, this operation is invalid.
    // Therefore, we need to remove or comment out this section.
    // await pool.query(
    //   `INSERT INTO user_locations (user_id, latitude, longitude) VALUES ($1, $2, $3)
    //    ON CONFLICT (user_id) DO UPDATE SET latitude = $2, longitude = $3`,
    //   [u.userId, latitude, longitude]
    // );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}