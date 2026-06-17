import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { matchId, body } = await request.json();

  const { rows } = await pool.query('SELECT * FROM matches WHERE id=$1 AND (user_a=$2 OR user_b=$2)', [matchId, u.userId]);
  if (rows.length === 0) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await pool.query('INSERT INTO messages (match_id, sender_id, body) VALUES ($1, $2, $3)', [matchId, u.userId, body]);

  return NextResponse.json({ success: true });
}