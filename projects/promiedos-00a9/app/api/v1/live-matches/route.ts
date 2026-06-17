import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const { rows: matches } = await pool.query(
      'SELECT * FROM matches WHERE match_date::date = $1',
      [date]
    );

    const { rows: tournaments } = await pool.query('SELECT * FROM tournaments ORDER BY created_at');
    const { rows: standings } = await pool.query('SELECT * FROM standings ORDER BY created_at');
    const { rows: goalScorers } = await pool.query('SELECT * FROM goal_scorers ORDER BY created_at');

    return NextResponse.json({ matches, tournaments, standings, goalScorers });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}