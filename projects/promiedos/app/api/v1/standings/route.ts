import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { tournament_id, team_name, points, matches_played } = await request.json();

    if (typeof tournament_id !== 'number' || typeof team_name !== 'string' || typeof points !== 'number' || typeof matches_played !== 'number') {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Verify the tournament exists
    const tournamentCheckQuery = `SELECT 1 FROM tournaments WHERE id = $1`;
    const tournamentCheckResult = await pool.query(tournamentCheckQuery, [tournament_id]);
    if (tournamentCheckResult.rowCount === 0) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const query = `INSERT INTO standings (tournament_id, team_name, points, matches_played) VALUES ($1, $2, $3, $4) RETURNING *`;
    const values = [tournament_id, team_name, points, matches_played];

    const { rows } = await pool.query(query, values);
    const newStanding = rows[0];

    return NextResponse.json(newStanding, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}