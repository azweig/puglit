import { NextRequest, NextResponse, after } from "next/server"
import { pool } from "@/lib/db"
import fs from "node:fs"
import path from "node:path"

// Promiedos ingestion (the `researcher`/data agent at runtime). Pulls real football
// data from API-Football into our Postgres; falls back to a bundled mock when
// APIFOOTBALL_KEY is absent so the pipeline works offline. Fire-and-forget: responds
// immediately and does the work in after() (external cron callers cap at ~30s).
// Cadence: live ~every 10 min while matches run; fixtures/standings ~daily.
export const maxDuration = 300

const KEY = process.env.APIFOOTBALL_KEY
const BASE = process.env.APIFOOTBALL_BASE || "https://v3.football.api-sports.io"
// Curated leagues (API-Football ids). Bounded to respect the free 100 req/day.
const LEAGUES = [
  { id: 128, season: 2026, name: "Liga Profesional", country: "Argentina", flag: "🇦🇷" },
  { id: 39, season: 2025, name: "Premier League", country: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: 140, season: 2025, name: "LaLiga", country: "España", flag: "🇪🇸" },
  { id: 71, season: 2026, name: "Brasileirão Série A", country: "Brasil", flag: "🇧🇷" },
  { id: 13, season: 2026, name: "Copa Libertadores", country: "CONMEBOL", flag: "🏆" },
]

type Mock = any
let MOCK: Mock | null = null
function mock(): Mock {
  if (!MOCK) MOCK = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "mock_apifootball.json"), "utf8"))
  return MOCK
}

async function af(endpoint: string, params: Record<string, string | number>): Promise<any[]> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
  const res = await fetch(`${BASE}/${endpoint}?${qs}`, { headers: { "x-apisports-key": KEY! } })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data?.response) ? data.response : []
}

const liveCodes = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"])
const doneCodes = new Set(["FT", "AET", "PEN"])
const statusOf = (short: string) => (liveCodes.has(short) ? "live" : doneCodes.has(short) ? "finished" : "scheduled")

// mock 'when' → a date relative to now, so live/today always renders offline
function mockDate(f: any): Date {
  const now = Date.now()
  if (f.when === "live") return new Date(now - (f.elapsed || 30) * 60_000)
  if (f.when === "finished") return new Date(now - 3 * 3600_000)
  if (f.when === "soon") return new Date(now + 2 * 3600_000)
  return new Date(now + 26 * 3600_000)
}

async function upsertTournament(c: any, lg: { id: number; name: string; country: string; flag: string; season: number | string }): Promise<number> {
  const { rows } = await c.query(
    `INSERT INTO tournaments (api_id, name, country, flag, season) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (api_id) DO UPDATE SET name=$2, country=$3, flag=$4, season=$5 RETURNING id`,
    [lg.id, lg.name, lg.country, lg.flag, String(lg.season)]
  )
  return rows[0].id
}

async function upsertMatch(c: any, tId: number, m: any): Promise<number> {
  const { rows } = await c.query(
    `INSERT INTO matches (api_id, tournament_id, date, round, team_home, team_away, home_logo, away_logo, score_home, score_away, status, minute, venue, referee)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (api_id) DO UPDATE SET date=$3, round=$4, score_home=$9, score_away=$10, status=$11, minute=$12, venue=$13, referee=$14
     RETURNING id`,
    [m.api_id, tId, m.date, m.round, m.team_home, m.team_away, m.home_logo, m.away_logo, m.score_home, m.score_away, m.status, m.minute, m.venue, m.referee]
  )
  return rows[0].id
}

async function ingestEvents(c: any, matchId: number, events: any[]) {
  await c.query("DELETE FROM match_events WHERE match_id=$1", [matchId])
  for (const e of events)
    await c.query(
      "INSERT INTO match_events (match_id, minute, extra, team_name, player_name, assist_name, type, detail) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [matchId, e.minute ?? null, e.extra ?? null, e.team_name, e.player_name, e.assist_name ?? null, e.type, e.detail]
    )
}
async function ingestLineups(c: any, matchId: number, lineups: any[]) {
  await c.query("DELETE FROM lineups WHERE match_id=$1", [matchId])
  for (const t of lineups) {
    const add = (p: any, starter: boolean) =>
      c.query("INSERT INTO lineups (match_id, team_name, formation, player_name, number, pos, grid, is_starter) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [matchId, t.team_name, t.formation, p.name, p.number ?? null, p.pos ?? null, p.grid ?? null, starter])
    for (const p of t.startXI || []) await add(p, true)
    for (const p of t.substitutes || []) await add(p, false)
  }
}
async function ingestStats(c: any, matchId: number, stats: any[]) {
  await c.query("DELETE FROM match_stats WHERE match_id=$1", [matchId])
  for (const t of stats)
    for (const s of t.stats || [])
      await c.query("INSERT INTO match_stats (match_id, team_name, stat_type, stat_value) VALUES ($1,$2,$3,$4)", [matchId, t.team_name, s.type, String(s.value ?? "")])
}
async function ingestStandings(c: any, tId: number, rows: any[]) {
  await c.query("DELETE FROM standings WHERE tournament_id=$1", [tId])
  for (const r of rows)
    await c.query(
      "INSERT INTO standings (tournament_id, rank, team_name, points, played, won, drawn, lost, gf, ga) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [tId, r.rank, r.team, r.points, r.played, r.won, r.drawn, r.lost, r.gf, r.ga]
    )
}
async function ingestScorers(c: any, tId: number, rows: any[]) {
  await c.query("DELETE FROM goal_scorers WHERE tournament_id=$1", [tId])
  for (const r of rows)
    await c.query("INSERT INTO goal_scorers (tournament_id, player_name, team_name, goals) VALUES ($1,$2,$3,$4)", [tId, r.player, r.team, r.goals])
}

// Normalize a raw API-Football fixture (real) OR a mock fixture into our match shape.
function normFixture(raw: any, mode: "real" | "mock") {
  if (mode === "mock") {
    return {
      api_id: raw.id, leagueId: raw.leagueId, round: raw.round,
      date: mockDate(raw).toISOString(),
      team_home: raw.home.name, team_away: raw.away.name, home_logo: raw.home.logo || null, away_logo: raw.away.logo || null,
      score_home: raw.goals.home ?? 0, score_away: raw.goals.away ?? 0,
      status: raw.when === "live" ? "live" : raw.when === "finished" ? "finished" : "scheduled",
      minute: raw.when === "live" ? raw.elapsed : null, venue: raw.venue || null, referee: raw.referee || null,
    }
  }
  return {
    api_id: raw.fixture.id, leagueId: raw.league.id, round: raw.league.round,
    date: raw.fixture.date,
    team_home: raw.teams.home.name, team_away: raw.teams.away.name, home_logo: raw.teams.home.logo, away_logo: raw.teams.away.logo,
    score_home: raw.goals.home ?? 0, score_away: raw.goals.away ?? 0,
    status: statusOf(raw.fixture.status?.short), minute: raw.fixture.status?.elapsed ?? null,
    venue: raw.fixture.venue?.name || null, referee: raw.fixture.referee || null,
  }
}

async function refresh(): Promise<{ leagues: number; matches: number; detailed: number }> {
  const c = await pool.connect()
  let nMatches = 0, detailed = 0
  try {
    const usingMock = !KEY
    const src = usingMock ? mock() : null
    const leagues = usingMock ? src.leagues : LEAGUES
    const tIdByApi = new Map<number, number>()
    for (const lg of leagues) tIdByApi.set(lg.id, await upsertTournament(c, lg))

    // fixtures
    let fixtures: any[]
    if (usingMock) {
      fixtures = src.fixtures.map((f: any) => normFixture(f, "mock"))
    } else {
      const today = new Date().toISOString().slice(0, 10)
      const live = await af("fixtures", { live: "all" })
      const day = await af("fixtures", { date: today })
      const byId = new Map<number, any>()
      for (const r of [...live, ...day]) byId.set(r.fixture.id, r)
      const wanted = new Set(LEAGUES.map((l) => l.id))
      fixtures = Array.from(byId.values()).filter((r) => wanted.has(r.league.id)).map((r) => normFixture(r, "real"))
    }

    const matchIdByApi = new Map<number, number>()
    for (const f of fixtures) {
      const tId = tIdByApi.get(f.leagueId)
      if (!tId) continue
      const id = await upsertMatch(c, tId, f)
      matchIdByApi.set(f.api_id, id)
      nMatches++
    }

    // per-match detail for live + finished (bounded to respect the free request budget)
    const detailTargets = fixtures.filter((f) => f.status === "live" || f.status === "finished").slice(0, usingMock ? 99 : 8)
    for (const f of detailTargets) {
      const mId = matchIdByApi.get(f.api_id)!
      if (usingMock) {
        if (src.events[f.api_id]) await ingestEvents(c, mId, src.events[f.api_id].map((e: any) => ({ minute: e.elapsed, extra: e.extra, team_name: e.team, player_name: e.player, assist_name: e.assist, type: e.type, detail: e.detail })))
        if (src.lineups[f.api_id]) await ingestLineups(c, mId, src.lineups[f.api_id].map((t: any) => ({ team_name: t.team, formation: t.formation, startXI: t.startXI, substitutes: t.substitutes })))
        if (src.statistics[f.api_id]) await ingestStats(c, mId, src.statistics[f.api_id].map((t: any) => ({ team_name: t.team, stats: t.stats })))
      } else {
        const [ev, lu, st] = await Promise.all([
          af("fixtures/events", { fixture: f.api_id }),
          af("fixtures/lineups", { fixture: f.api_id }),
          af("fixtures/statistics", { fixture: f.api_id }),
        ])
        await ingestEvents(c, mId, ev.map((e: any) => ({ minute: e.time?.elapsed, extra: e.time?.extra, team_name: e.team?.name, player_name: e.player?.name, assist_name: e.assist?.name, type: e.type, detail: e.detail })))
        await ingestLineups(c, mId, lu.map((t: any) => ({ team_name: t.team?.name, formation: t.formation, startXI: (t.startXI || []).map((x: any) => x.player), substitutes: (t.substitutes || []).map((x: any) => x.player) })))
        await ingestStats(c, mId, st.map((t: any) => ({ team_name: t.team?.name, stats: (t.statistics || []).map((s: any) => ({ type: s.type, value: s.value })) })))
      }
      detailed++
    }

    // standings + scorers per league
    for (const lg of leagues) {
      const tId = tIdByApi.get(lg.id)!
      if (usingMock) {
        if (src.standings[lg.id]) await ingestStandings(c, tId, src.standings[lg.id])
        if (src.topscorers[lg.id]) await ingestScorers(c, tId, src.topscorers[lg.id])
      } else {
        const st = await af("standings", { league: lg.id, season: lg.season })
        const table = st?.[0]?.league?.standings?.[0] || []
        await ingestStandings(c, tId, table.map((r: any) => ({ rank: r.rank, team: r.team?.name, points: r.points, played: r.all?.played, won: r.all?.win, drawn: r.all?.draw, lost: r.all?.lose, gf: r.all?.goals?.for, ga: r.all?.goals?.against })))
        const sc = await af("players/topscorers", { league: lg.id, season: lg.season })
        await ingestScorers(c, tId, sc.slice(0, 10).map((p: any) => ({ player: p.player?.name, team: p.statistics?.[0]?.team?.name, goals: p.statistics?.[0]?.goals?.total })))
      }
    }
    return { leagues: leagues.length, matches: nMatches, detailed }
  } finally {
    c.release()
  }
}

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams
  const secret = process.env.CRON_SECRET
  if (secret && sp.get("key") !== secret && request.headers.get("x-cron-secret") !== secret)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  if (sp.get("sync") === "1") {
    const r = await refresh().catch((e) => ({ error: String(e?.message || e) }))
    return NextResponse.json({ ok: true, mode: KEY ? "live" : "mock", ...r })
  }
  after(refresh().catch(() => {}))
  return NextResponse.json({ ok: true, started: true, mode: KEY ? "live" : "mock" })
}
