import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { match_date, home_team, away_team, score, tournament_id } = await request.json();

    if (!match_date || !home_team || !away_team || !tournament_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the user is a participant in the tournament
    const participantCheckQuery = `SELECT 1 FROM tournaments WHERE id = $1`;
    const participantCheckValues = [tournament_id];
    const participantCheckResult = await pool.query(participantCheckQuery, participantCheckValues);

    if (participantCheckResult.rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const query = `INSERT INTO matches (match_date, home_team, away_team, score, tournament_id) 
                   VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const values = [match_date, home_team, away_team, score, tournament_id];

    const { rows } = await pool.query(query, values);
    const newMatch = rows[0];

    return NextResponse.json(newMatch, { status: 201 });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}