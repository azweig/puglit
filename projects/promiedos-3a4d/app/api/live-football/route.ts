import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const tournament = url.searchParams.get('tournament');

  let matchesQuery = 'SELECT * FROM matches';
  const queryParams: (string | null)[] = [];

  if (date) {
    matchesQuery += ' WHERE date_time::date = $1';
    queryParams.push(date);
  }

  if (tournament) {
    if (queryParams.length > 0) {
      matchesQuery += ' AND';
    } else {
      matchesQuery += ' WHERE';
    }
    matchesQuery += ' id IN (SELECT id FROM matches WHERE tournament_id = (SELECT id FROM tournaments WHERE name = $2))';
    queryParams.push(tournament);
  }

  const matches = await pool.query(matchesQuery, queryParams);
  const tournaments = await pool.query('SELECT * FROM tournaments');
  const standings = await pool.query('SELECT * FROM standings');
  const topScorers = await pool.query('SELECT * FROM scorers');

  return NextResponse.json(matches.rows);
}