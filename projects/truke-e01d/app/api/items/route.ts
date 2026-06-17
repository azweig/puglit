import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { title, description, condition, location, image_url } = await request.json();

  if (!title || !condition || !location) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validConditions = ['new', 'like new', 'used', 'for parts'];
  if (!validConditions.includes(condition)) {
    return NextResponse.json({ error: "Invalid condition" }, { status: 400 });
  }

  try {
    await pool.query(
      "INSERT INTO items (owner_id, title, description, condition, location, image_url) VALUES ($1, $2, $3, $4, $5, $6)",
      [u.userId, title, description, condition, location, image_url]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}