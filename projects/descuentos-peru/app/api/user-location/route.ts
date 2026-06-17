import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { latitude, longitude, address } = await request.json();

  await pool.query(
    'INSERT INTO user_locations (user_id, latitude, longitude, address) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET latitude = $2, longitude = $3, address = $4, created_at = NOW()',
    [u.userId, latitude, longitude, address]
  );

  return NextResponse.json({ success: true });
}