import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { item_id, liked }: { item_id: number; liked: boolean } = await request.json();

  await pool.query('INSERT INTO swipes (user_id, item_id, liked) VALUES ($1, $2, $3)', [u.userId, item_id, liked]);

  if (liked) {
    const { rows } = await pool.query(
      'SELECT * FROM swipes WHERE item_id IN (SELECT id FROM items WHERE owner_id=$1) AND user_id=(SELECT owner_id FROM items WHERE id=$2) AND liked=true',
      [u.userId, item_id]
    );

    if (rows.length > 0) {
      await pool.query(
        'INSERT INTO matches (item_a_id, item_b_id, user_a_id, user_b_id) VALUES ($1, $2, $3, $4)',
        [item_id, rows[0].item_id, u.userId, rows[0].user_id]
      );
    }
  }

  return NextResponse.json({ success: true });
}