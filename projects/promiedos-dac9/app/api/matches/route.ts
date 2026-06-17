import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { date, team_home, team_away, score_home, score_away } = await request.json();

    // Validate input
    if (!date || !team_home || !team_away) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert new match into the database
    const { rows } = await pool.query(
      "INSERT INTO matches (date, team_home, team_away, score_home, score_away) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [date, team_home, team_away, score_home || 0, score_away || 0]
    );

    // Return the newly created match ID
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}