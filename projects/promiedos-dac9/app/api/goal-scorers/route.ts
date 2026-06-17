import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const matchId = url.searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "matchId is required" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM goal_scorers WHERE match_id = $1 ORDER BY goals DESC",
      [parseInt(matchId, 10)]
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}