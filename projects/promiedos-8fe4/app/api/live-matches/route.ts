import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  const { rows } = await pool.query('SELECT * FROM matches WHERE date(date_time) = $1 ORDER BY date_time ASC', [date]);
  return NextResponse.json({ matches: rows });
}