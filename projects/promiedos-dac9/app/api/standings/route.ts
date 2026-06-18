import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const tournamentId = new URL(request.url).searchParams.get("tournament_id");
  if (!tournamentId) return NextResponse.json({ error: "tournament_id is required" }, { status: 400 });
  try {
    const { rows } = await pool.query(
      `SELECT id, tournament_id, team_name, points, played, won, drawn, lost, gf, ga, (gf - ga) AS goal_diff
         FROM standings WHERE tournament_id = $1
        ORDER BY points DESC, (gf - ga) DESC, gf DESC`,
      [Number(tournamentId)]
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
