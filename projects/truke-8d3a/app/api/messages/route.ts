import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { matchId, body } = await request.json();
  if (!matchId || !body) return NextResponse.json({ error: 'invalid input' }, { status: 400 });

  const { rows } = await pool.query(
    'SELECT 1 FROM matches WHERE id=$1 AND (user_a=$2 OR user_b=$2)',
    [matchId, u.userId]
  );

  if (rows.length === 0) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await pool.query(
    'INSERT INTO messages (match_id, sender_id, body, sent_at) VALUES ($1, $2, $3, NOW())',
    [matchId, u.userId, body]
  );

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const matchId = url.searchParams.get('matchId');
  if (!matchId) return NextResponse.json({ error: 'invalid input' }, { status: 400 });

  const { rows: matchRows } = await pool.query(
    'SELECT 1 FROM matches WHERE id=$1 AND (user_a=$2 OR user_b=$2)',
    [matchId, u.userId]
  );

  if (matchRows.length === 0) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { rows } = await pool.query(
    'SELECT * FROM messages WHERE match_id=$1 ORDER BY sent_at',
    [matchId]
  );

  return NextResponse.json(rows);
}