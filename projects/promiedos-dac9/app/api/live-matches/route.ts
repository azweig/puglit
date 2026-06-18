import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// Live + today's matches across every league, with tournament/country/flag, the live
// minute, and the goal events (scorer + minute) joined in so the home shows the same
// inline detail as promiedos.com.ar. Newest live first.
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
      `SELECT m.id, m.tournament_id, m.date, m.team_home, m.team_away, m.score_home, m.score_away,
              m.status, m.minute, t.name AS tournament_name, t.country, t.flag,
              COALESCE((SELECT json_agg(json_build_object('player', e.player_name, 'minute', e.minute, 'team', e.team_name) ORDER BY e.minute)
                        FROM match_events e WHERE e.match_id = m.id AND e.type = 'Goal'), '[]'::json) AS goals
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
