import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { date_time, team_home, team_away, score_home, score_away, tournament_id } = await request.json();

    if (!date_time || !team_home || !team_away || typeof score_home !== 'number' || typeof score_away !== 'number' || !tournament_id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Verify the user is a participant in the tournament
    const { rowCount: participantCount } = await pool.query(
      "SELECT 1 FROM tournaments WHERE id = $1 AND (SELECT COUNT(*) FROM matches WHERE tournament_id = $1 AND (team_home = $2 OR team_away = $2)) > 0",
      [tournament_id, u.userId]
    );

    if (participantCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { rows } = await pool.query(
      "INSERT INTO matches (date_time, team_home, team_away, score_home, score_away, tournament_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [date_time, team_home, team_away, score_home, score_away, tournament_id]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
