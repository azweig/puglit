import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { tournament_id, team_name, points, matches_played, goal_difference } = await request.json();

    if (typeof tournament_id !== 'number' || typeof team_name !== 'string' || typeof points !== 'number' || typeof matches_played !== 'number' || typeof goal_difference !== 'number') {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { rows } = await pool.query(
      "INSERT INTO standings (tournament_id, team_name, points, matches_played, goal_difference) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
      [tournament_id, team_name, points, matches_played, goal_difference]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}