import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { rows } = await pool.query(
      `SELECT programs.id, programs.name, programs.provider, programs.category
       FROM user_memberships
       JOIN programs ON user_memberships.program_id = programs.id
       WHERE user_memberships.user_id = $1`,
      [u.userId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to retrieve programs." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { program_id } = await request.json();
    if (!program_id) {
      return NextResponse.json({ error: "program_id is required." }, { status: 400 });
    }

    // Check if the program exists
    const programCheck = await pool.query(
      "SELECT id FROM programs WHERE id = $1",
      [program_id]
    );
    if (programCheck.rows.length === 0) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 });
    }

    // Insert the new membership
    await pool.query(
      "INSERT INTO user_memberships (user_id, program_id) VALUES ($1, $2)",
      [u.userId, program_id]
    );

    return NextResponse.json({ message: "Program added to memberships." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add program to memberships." }, { status: 500 });
  }
}
