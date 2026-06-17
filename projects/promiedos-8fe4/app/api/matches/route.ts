import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
    const u = await getAuthUser(request);
    if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    try {
        const { date_time, team_home, team_away, score_home, score_away, tournament_id } = await request.json();

        // Validate input
        if (!date_time || !team_home || !team_away || !tournament_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify the user is a participant in the tournament
        const participantCheck = await pool.query(
            "SELECT 1 FROM tournaments WHERE id = $1",
            [tournament_id]
        );

        if (participantCheck.rowCount === 0) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Insert the new match into the database
        const { rows } = await pool.query(
            "INSERT INTO matches (date_time, team_home, team_away, score_home, score_away, tournament_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [date_time, team_home, team_away, score_home, score_away, tournament_id]
        );

        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}