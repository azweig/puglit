import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { title, description, imageUrl, location } = await request.json();

  const { rows } = await pool.query(
    'INSERT INTO items (title, description, image_url, location, owner_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [title, description, imageUrl, location, u.userId]
  );

  return NextResponse.json({ id: rows[0].id });
}