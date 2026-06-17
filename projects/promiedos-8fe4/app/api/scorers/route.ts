import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tournamentId = url.searchParams.get('tournament_id');
  if (!tournamentId) {
    return NextResponse.json({ error: 'tournament_id required' }, { status: 400 });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM scorers WHERE tournament_id = $1 ORDER BY goals DESC', [tournamentId]);
    return NextResponse.json({ scorers: rows });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}