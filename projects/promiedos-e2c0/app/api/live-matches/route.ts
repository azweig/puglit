import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');
  const queryDate = dateParam ? new Date(dateParam) : new Date();
  const formattedDate = queryDate.toISOString().split('T')[0];

  try {
    const { rows } = await pool.query(
      'SELECT * FROM matches WHERE date::date = $1',
      [formattedDate]
    );
    return NextResponse.json({ matches: rows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch live matches' }, { status: 500 });
  }
}