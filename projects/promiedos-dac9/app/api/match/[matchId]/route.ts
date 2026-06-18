import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// Full match detail: header + minute-by-minute events + lineups (per team) + stats.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const id = Number(matchId);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  try {
    const match = (await pool.query(
      `SELECT m.*, t.name AS tournament_name, t.country, t.flag
         FROM matches m JOIN tournaments t ON t.id = m.tournament_id WHERE m.id = $1`, [id]
    )).rows[0];
    if (!match) return NextResponse.json({ error: "not found" }, { status: 404 });
    const events = (await pool.query(
      "SELECT minute, extra, team_name, player_name, assist_name, type, detail FROM match_events WHERE match_id=$1 ORDER BY minute ASC NULLS LAST, id ASC", [id]
    )).rows;
    const lineups = (await pool.query(
      "SELECT team_name, formation, player_name, number, pos, grid, is_starter FROM lineups WHERE match_id=$1 ORDER BY is_starter DESC, id ASC", [id]
    )).rows;
    const stats = (await pool.query(
      "SELECT team_name, stat_type, stat_value FROM match_stats WHERE match_id=$1 ORDER BY id ASC", [id]
    )).rows;
    return NextResponse.json({ match, events, lineups, stats });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
