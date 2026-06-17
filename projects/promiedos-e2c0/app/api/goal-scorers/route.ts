import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tournamentId = url.searchParams.get('tournamentId');

  if (!tournamentId) {
    return NextResponse.json({ error: "tournamentId is required" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM goal_scorers WHERE tournament_id = $1 ORDER BY goals DESC',
      [tournamentId]
    );
    return NextResponse.json({ goalScorers: rows });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch goal scorers" }, { status: 500 });
  }
}