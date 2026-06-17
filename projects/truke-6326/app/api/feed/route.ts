import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM items WHERE owner_id <> $1 AND id NOT IN (SELECT item_id FROM swipes WHERE user_id = $1)',
      [u.userId]
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}