import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { match_id, player_name, goals } = await request.json();

    if (!match_id || !player_name || typeof goals !== 'number') {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Verify the user is a participant in the match
    const participantCheck = await pool.query(
      "SELECT 1 FROM matches WHERE id=$1 AND (team_home=$2 OR team_away=$2)",
      [match_id, u.username] // Assuming `u.username` is the team name
    );

    if (participantCheck.rowCount === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { rows } = await pool.query(
      "INSERT INTO goal_scorers (match_id, player_name, goals) VALUES ($1, $2, $3) RETURNING *",
      [match_id, player_name, goals]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}