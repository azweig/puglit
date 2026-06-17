import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { tournament_id, team_name, points, matches_played } = await request.json();

    if (!tournament_id || !team_name || points === undefined || matches_played === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { rows: tournamentRows } = await pool.query(
      "SELECT id FROM tournaments WHERE id = $1",
      [tournament_id]
    );

    if (tournamentRows.length === 0) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    await pool.query(
      "INSERT INTO standings (tournament_id, team_name, points, matches_played, created_at) VALUES ($1, $2, $3, $4, NOW())",
      [tournament_id, team_name, points, matches_played]
    );

    return NextResponse.json({ message: "Standings entry created successfully" }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
