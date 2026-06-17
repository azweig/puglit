import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { itemId, liked }: { itemId: number; liked: boolean } = await request.json();

  await pool.query('INSERT INTO swipes (user_id, item_id, liked) VALUES ($1, $2, $3)', [u.userId, itemId, liked]);

  if (liked) {
    const { rows } = await pool.query(
      'SELECT * FROM swipes WHERE item_id IN (SELECT id FROM items WHERE owner_id=$1) AND user_id=(SELECT owner_id FROM items WHERE id=$2) AND liked=true',
      [u.userId, itemId]
    );

    if (rows.length > 0) {
      const itemB = rows[0].item_id;
      const userB = rows[0].user_id;
      await pool.query('INSERT INTO matches (user_a, user_b, item_a, item_b) VALUES ($1, $2, $3, $4)', [u.userId, userB, itemId, itemB]);
    }
  }

  return NextResponse.json({ success: true });
}