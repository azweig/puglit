import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { team_home, team_away, score_home, score_away, tournament_id, date } = await request.json();

    if (!team_home || !team_away || typeof score_home !== 'number' || typeof score_away !== 'number' || !tournament_id || !date) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const query = `
      INSERT INTO matches (team_home, team_away, score_home, score_away, tournament_id, date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const values = [team_home, team_away, score_home, score_away, tournament_id, new Date(date)];

    const { rows } = await pool.query(query, values);
    const matchId = rows[0].id;

    return NextResponse.json({ matchId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}