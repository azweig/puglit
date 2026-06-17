import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { player_name, team_name, goals, tournament_id } = await request.json();

    if (!player_name || !team_name || typeof goals !== 'number' || !tournament_id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { rows } = await pool.query(
      "INSERT INTO scorers (player_name, team_name, goals, tournament_id) VALUES ($1, $2, $3, $4) RETURNING *;",
      [player_name, team_name, goals, tournament_id]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}