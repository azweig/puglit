import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const { rows: matches } = await pool.query('SELECT * FROM matches WHERE DATE(date_time) = $1', [date]);
    const { rows: tournaments } = await pool.query('SELECT * FROM tournaments');
    const { rows: standings } = await pool.query('SELECT * FROM standings');
    const { rows: goalScorers } = await pool.query('SELECT * FROM goal_scorers WHERE match_id IN (SELECT id FROM matches WHERE DATE(date_time) = $1)', [date]);

    return NextResponse.json({ matches, tournaments, standings, goalScorers });
  } catch (error) {
    console.error('Error fetching live football data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}