import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
    const u = await getAuthUser(request);
    if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    try {
        const { name, country, season, current_round } = await request.json();

        if (!name || !country || !season || current_round === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { rows } = await pool.query(
            "INSERT INTO leagues (name, country, season, current_round) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, country, season, current_round]
        );

        return NextResponse.json(rows[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}