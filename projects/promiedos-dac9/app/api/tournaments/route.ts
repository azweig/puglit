import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, country, flag, season, current_round FROM tournaments ORDER BY country ASC, name ASC"
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}
