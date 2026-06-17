import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const u = await getAuthUser(request);
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const leagueId = url.searchParams.get('leagueId');

  let query = 'SELECT m.*, f.*, l.* FROM matches m JOIN fixtures f ON m.id = f.match_id JOIN leagues l ON f.league_id = l.id WHERE 1=1';
  const params: (string | number)[] = [];

  if (date) {
    query += ' AND f.date = $' + (params.length + 1);
    params.push(date);
  }

  if (leagueId) {
    query += ' AND l.id = $' + (params.length + 1);
    params.push(Number(leagueId));
  }

  try {
    const { rows } = await pool.query(query, params);
    return NextResponse.json({ matches: rows });
  } catch (error) {
    return NextResponse.json({ error: "Database query failed" }, { status: 500 });
  }
}