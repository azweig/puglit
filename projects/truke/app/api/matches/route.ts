import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemId, userId } = await request.json();

  if (u.userId !== userId) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  try {
    // Check if the user is trying to match with their own item
    const userItemResult = await pool.query(
      "SELECT * FROM items WHERE id = $1 AND owner_id = $2",
      [itemId, userId]
    );

    if (userItemResult.rows.length > 0) {
      return NextResponse.json({ error: "Cannot match with own item" }, { status: 400 });
    }

    // Check if the item is available
    const itemResult = await pool.query(
      "SELECT * FROM items WHERE id = $1 AND is_available = true",
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      return NextResponse.json({ error: "Item not available or owned by user" }, { status: 400 });
    }

    const item = itemResult.rows[0];

    // Create a new match
    const matchResult = await pool.query(
      "INSERT INTO matches (item_id, user_id1, user_id2, match_date) VALUES ($1, $2, $3, NOW()) RETURNING id, item_id, user_id1, user_id2, match_date",
      [itemId, userId, item.owner_id]
    );

    const match = matchResult.rows[0];

    return NextResponse.json({
      matchId: match.id,
      itemId: match.item_id,
      userId1: match.user_id1,
      userId2: match.user_id2,
      matchDate: match.match_date
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}