/**
 * GET /api/genetic/agents — the roster with computed reputation (for the office + RPG cards).
 *   ?team=A|B|C   filter to one team
 *   ?id=A:role    a single agent's full RPG card + recent diary entries
 */
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const id = sp.get("id"), team = sp.get("team")
    if (id) {
      const { rows } = await query(`SELECT * FROM puglit_agents WHERE id=$1`, [id])
      if (!rows.length) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
      const a = rows[0]
      const diary = await query(`SELECT kind, entry, quality, created_at FROM puglit_agent_diary WHERE agent_id=$1 ORDER BY created_at DESC LIMIT 12`, [id])
      return NextResponse.json({ ok: true, agent: { ...a, quality: a.quality_n ? Math.round((a.quality_sum / a.quality_n) * 10) / 10 : 0 }, diary: diary.rows })
    }
    const { rows } = await query(
      `SELECT id,team,role,name,room,queen,stakeholder,stats,temperature,level,xp,projects,wins,quality_sum,quality_n
       FROM puglit_agents ${team ? "WHERE team=$1" : ""} ORDER BY team, role`,
      team ? [team] : [],
    )
    return NextResponse.json({ ok: true, count: rows.length, agents: rows.map((a) => ({ ...a, quality: a.quality_n ? Math.round((a.quality_sum / a.quality_n) * 10) / 10 : 0 })) })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
