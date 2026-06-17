import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { rows } = await pool.query(
    'SELECT i.* FROM items i LEFT JOIN swipes s ON i.id = s.item_id AND s.user_id = $1 WHERE i.owner_id <> $1 AND s.id IS NULL',
    [u.userId]
  );

  return NextResponse.json(rows);
}