import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { date_time, team_home, team_away, score_home, score_away } = await request.json();

    if (!date_time || !team_home || !team_away) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { rows } = await pool.query(
      "INSERT INTO matches (date_time, team_home, team_away, score_home, score_away) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [date_time, team_home, team_away, score_home || 0, score_away || 0]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}