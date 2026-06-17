import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { matchId, body }: { matchId: number; body: string } = await request.json();

  const { rows: matchRows } = await pool.query(
    'SELECT * FROM matches WHERE id = $1 AND (user_a = $2 OR user_b = $2)',
    [matchId, u.userId]
  );

  if (matchRows.length === 0) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await pool.query(
    'INSERT INTO messages (match_id, sender_id, body, created_at) VALUES ($1, $2, $3, NOW())',
    [matchId, u.userId, body]
  );

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const matchId = Number(searchParams.get('matchId'));

  const { rows: matchRows } = await pool.query(
    'SELECT * FROM matches WHERE id = $1 AND (user_a = $2 OR user_b = $2)',
    [matchId, u.userId]
  );

  if (matchRows.length === 0) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { rows: messageRows } = await pool.query(
    'SELECT * FROM messages WHERE match_id = $1 ORDER BY created_at ASC',
    [matchId]
  );

  return NextResponse.json(messageRows);
}
