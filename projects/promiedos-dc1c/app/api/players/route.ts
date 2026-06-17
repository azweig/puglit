import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { name, team, goals, position } = await request.json();

    if (!name || !team || !position) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validPositions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
    if (!validPositions.includes(position)) {
      return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    }

    const { rows } = await pool.query(
      "INSERT INTO players (name, team, goals, position, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
      [name, team, goals || 0, position]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
