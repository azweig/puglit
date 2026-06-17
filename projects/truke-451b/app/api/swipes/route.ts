import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { itemId, liked }: { itemId: number; liked: boolean } = await request.json();

  // Ensure the item exists and is not owned by the user
  const { rows: itemRows } = await pool.query('SELECT owner_id FROM items WHERE id = $1 AND owner_id <> $2', [itemId, u.userId]);
  if (itemRows.length === 0) return NextResponse.json({ error: 'item not found or owned by user' }, { status: 404 });

  await pool.query('INSERT INTO swipes (user_id, item_id, liked) VALUES ($1, $2, $3)', [u.userId, itemId, liked]);

  if (liked) {
    const ownerId = itemRows[0].owner_id;

    const { rows: mutual } = await pool.query(
      'SELECT * FROM swipes WHERE user_id = $1 AND item_id IN (SELECT id FROM items WHERE owner_id = $2) AND liked = true',
      [ownerId, u.userId]
    );

    if (mutual.length > 0) {
      await pool.query(
        'INSERT INTO matches (user_a, user_b, item_a, item_b) VALUES ($1, $2, $3, $4)',
        [u.userId, ownerId, itemId, mutual[0].item_id]
      );
    }
  }

  return NextResponse.json({ success: true });
}