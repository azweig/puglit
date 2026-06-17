import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");
    const queryDate = dateParam ? new Date(dateParam) : new Date();

    const { rows } = await pool.query(
      "SELECT * FROM matches WHERE date::date = COALESCE($1::date, NOW()::date)",
      [queryDate.toISOString().split('T')[0]]
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}