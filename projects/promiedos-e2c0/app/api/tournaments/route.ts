import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { rows } = await pool.query('SELECT * FROM tournaments ORDER BY created_at DESC');
    return NextResponse.json({ tournaments: rows });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}