import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { title, description, imageUrl, city } = await request.json();

  await pool.query(
    'INSERT INTO items (owner_id, title, description, image_url, city) VALUES ($1, $2, $3, $4, $5)',
    [u.userId, title, description, imageUrl, city]
  );

  return NextResponse.json({ success: true });
}