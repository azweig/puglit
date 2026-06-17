import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { name, start_date, end_date, type } = await request.json();

    if (!name || !start_date || !end_date || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validTypes = ['league', 'cup', 'friendly'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid tournament type" }, { status: 400 });
    }

    const result = await pool.query(
      "INSERT INTO tournaments (name, start_date, end_date, type) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, start_date, end_date, type]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}