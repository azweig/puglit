/**
 * POST /api/genetic/seed — create the genetic schema (if needed) and upsert the 75-agent
 * roster (3 teams × 25 roles) + the 3 team philosophies. Idempotent; preserves accrued
 * stats/level/xp/quality on re-seed (only refreshes identity fields).
 */
import { NextResponse } from "next/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { query } from "@/lib/db"
import { buildRoster, TEAMS } from "@/lib/roster"

export async function POST() {
  try {
    const ddl = readFileSync(join(process.cwd(), "sql/genetic.sql"), "utf8")
    await query(ddl)
    for (const t of TEAMS) {
      await query(
        `INSERT INTO puglit_teams (id,philosophy,label,description,queen_agent) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO UPDATE SET philosophy=EXCLUDED.philosophy,label=EXCLUDED.label,description=EXCLUDED.description,queen_agent=EXCLUDED.queen_agent`,
        [t.id, t.philosophy, t.label, t.description, `${t.id}:queen-bee`],
      )
    }
    const roster = buildRoster()
    for (const a of roster) {
      await query(
        `INSERT INTO puglit_agents (id,team,role,name,room,persona,queen,stakeholder,stats,temperature)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,room=EXCLUDED.room,persona=EXCLUDED.persona,queen=EXCLUDED.queen,stakeholder=EXCLUDED.stakeholder,stats=EXCLUDED.stats,temperature=EXCLUDED.temperature`,
        [a.id, a.team, a.role, a.name, a.room, a.persona, a.queen, a.stakeholder, JSON.stringify(a.stats), a.temperature],
      )
    }
    return NextResponse.json({ ok: true, teams: TEAMS.length, agents: roster.length })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
