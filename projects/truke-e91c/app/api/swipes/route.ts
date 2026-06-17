import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { item_id, liked }: { item_id: number; liked: boolean } = await request.json();

  // Insert the swipe
  await pool.query(
    'INSERT INTO swipes (user_id, item_id, liked) VALUES ($1, $2, $3)',
    [u.userId, item_id, liked]
  );

  if (liked) {
    // Check for mutual like
    const { rows } = await pool.query(
      'SELECT * FROM swipes WHERE item_id IN (SELECT id FROM items WHERE owner_id=$1) AND user_id=(SELECT owner_id FROM items WHERE id=$2) AND liked=true',
      [(await pool.query('SELECT owner_id FROM items WHERE id=$1', [item_id])).rows[0].owner_id, u.userId]
    );

    if (rows.length > 0) {
      // Insert a new match
      await pool.query(
        'INSERT INTO matches (user_a, user_b, item_a, item_b) VALUES ($1, $2, $3, $4)',
        [u.userId, rows[0].user_id, item_id, rows[0].item_id]
      );
    }
  }

  return NextResponse.json({ success: true });
}