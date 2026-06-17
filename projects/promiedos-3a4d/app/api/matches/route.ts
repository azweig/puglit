import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { date_time, team_home, team_away, score_home, score_away } = await request.json();

    // Validate required fields
    if (!date_time || !team_home || !team_away) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert new match into the database
    const { rows } = await pool.query(
      "INSERT INTO matches (date_time, team_home, team_away, score_home, score_away) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
      [date_time, team_home, team_away, score_home, score_away]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}