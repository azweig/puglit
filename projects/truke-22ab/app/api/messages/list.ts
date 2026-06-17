import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  if (!matchId) return NextResponse.json({ error: 'matchId is required' }, { status: 400 });

  const { rows } = await pool.query(
    'SELECT * FROM messages WHERE match_id=$1 AND ((SELECT user_a FROM matches WHERE id=$1)=$2 OR (SELECT user_b FROM matches WHERE id=$1)=$2)',
    [matchId, u.userId]
  );

  return NextResponse.json(rows);
}