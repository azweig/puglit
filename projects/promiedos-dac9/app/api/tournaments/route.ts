import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { rows } = await pool.query("SELECT * FROM tournaments");
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}