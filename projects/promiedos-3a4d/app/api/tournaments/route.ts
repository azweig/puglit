import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { name, start_date, end_date, current_stage } = await request.json();

    // Validate input
    if (!name || !start_date || !end_date || !current_stage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert new tournament into the database
    const { rows } = await pool.query(
      "INSERT INTO tournaments (name, start_date, end_date, current_stage) VALUES ($1, $2, $3, $4) RETURNING *;",
      [name, start_date, end_date, current_stage]
    );

    // Return the newly created tournament
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error("Error creating tournament:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}