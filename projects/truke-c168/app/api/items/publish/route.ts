import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { title, description, image_url, condition } = await request.json();

  // Validate condition
  const validConditions = ['new', 'like new', 'used', 'for parts'];
  if (!validConditions.includes(condition)) {
    return NextResponse.json({ error: 'invalid condition' }, { status: 400 });
  }

  await pool.query(
    'INSERT INTO items (title, description, image_url, condition, owner_id) VALUES ($1, $2, $3, $4, $5)',
    [title, description, image_url, condition, u.userId]
  );

  return NextResponse.json({ success: true }, { status: 201 });
}