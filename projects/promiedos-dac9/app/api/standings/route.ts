import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tournamentId = url.searchParams.get("tournament_id");

  if (!tournamentId) {
    return NextResponse.json({ error: "tournament_id is required" }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM standings WHERE tournament_id = $1 ORDER BY points DESC, matches_played ASC",
      [tournamentId]
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}