import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const tournamentId = new URL(request.url).searchParams.get("tournament_id");
  if (!tournamentId) return NextResponse.json({ error: "tournament_id is required" }, { status: 400 });
  try {
    const { rows } = await pool.query(
      "SELECT id, tournament_id, player_name, team_name, goals FROM goal_scorers WHERE tournament_id = $1 ORDER BY goals DESC",
      [Number(tournamentId)]
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
