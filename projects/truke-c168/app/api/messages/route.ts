import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { match_id, body }: { match_id: number; body: string } = await request.json();

  const { rows } = await pool.query('SELECT * FROM matches WHERE id=$1 AND (user_a=$2 OR user_b=$2)', [match_id, u.userId]);
  if (rows.length === 0) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await pool.query('INSERT INTO messages (match_id, sender_id, body) VALUES ($1, $2, $3)', [match_id, u.userId, body]);

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const match_id = new URL(request.url).searchParams.get('match_id');
  if (!match_id) return NextResponse.json({ error: 'match_id is required' }, { status: 400 });

  const { rows } = await pool.query('SELECT * FROM messages WHERE match_id=$1 ORDER BY sent_at ASC', [match_id]);

  return NextResponse.json(rows);
}