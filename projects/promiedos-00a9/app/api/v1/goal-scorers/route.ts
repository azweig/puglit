import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { player_name, team_name, goals, tournament_id } = await request.json();

    if (!player_name || !team_name || typeof goals !== 'number' || !tournament_id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { rows: tournamentRows } = await pool.query(
      "SELECT id FROM tournaments WHERE id = $1",
      [tournament_id]
    );

    if (tournamentRows.length === 0) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const { rows } = await pool.query(
      "INSERT INTO goal_scorers (player_name, team_name, goals, tournament_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [player_name, team_name, goals, tournament_id]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}