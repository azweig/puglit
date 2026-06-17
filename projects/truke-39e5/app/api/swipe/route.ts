import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { itemId, liked }: { itemId: number; liked: boolean } = await request.json();

  // Insert the swipe into the database
  await pool.query(
    'INSERT INTO swipes (user_id, item_id, liked) VALUES ($1, $2, $3)',
    [u.userId, itemId, liked]
  );

  if (liked) {
    // Check for mutual like
    const { rows } = await pool.query(
      'SELECT * FROM swipes WHERE item_id = $1 AND user_id = (SELECT owner_id FROM items WHERE id = $1) AND liked = true',
      [itemId]
    );

    if (rows.length > 0) {
      // Insert a new match into the database
      await pool.query(
        'INSERT INTO matches (user_a, user_b, item_a, item_b) VALUES ($1, $2, $3, $4)',
        [u.userId, rows[0].user_id, itemId, rows[0].item_id]
      );
    }
  }

  return NextResponse.json({ success: true });
}