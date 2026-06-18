import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// Live + today's matches across every league, newest live first, with the
// tournament name + country + flag joined in so the UI can group by country.
export async function GET(request: NextRequest) {
  try {
    const sp = new URL(request.url).searchParams;
    const country = sp.get("country");
    const tournamentId = sp.get("tournament_id");
    const params: any[] = [];
    const filters: string[] = ["(m.status = 'live' OR m.date::date = NOW()::date)"];
    if (country) { params.push(country); filters.push(`t.country = $${params.length}`); }
    if (tournamentId) { params.push(Number(tournamentId)); filters.push(`m.tournament_id = $${params.length}`); }
    const { rows } = await pool.query(
      `SELECT m.id, m.tournament_id, m.date, m.team_home, m.team_away, m.score_home, m.score_away, m.status,
              t.name AS tournament_name, t.country, t.flag
         FROM matches m JOIN tournaments t ON t.id = m.tournament_id
        WHERE ${filters.join(" AND ")}
        ORDER BY (m.status = 'live') DESC, t.country ASC, m.date ASC`,
      params
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
