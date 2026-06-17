# Build report — Promiedos

## Bespoke app (generation swarm)

Promiedos is a live Argentine football tracker providing real-time updates on daily matches, fixtures by date, tournament standings, top scorers, and historical results. The data is scraped and updated via cron jobs, offering users a comprehensive view of Argentine football without the need for an account.

- Tablas: matches, tournaments, standings, goal_scorers
- Rutas API: app/api/live-matches/route.ts, app/api/tournaments/route.ts, app/api/standings/route.ts, app/api/goal-scorers/route.ts, app/api/matches/route.ts
- Pantallas: /, /tournaments, /tournament/[id]/standings, /tournament/[id]/goal-scorers, /matches/new, /tournaments/new, /tournament/[id]/standings/update, /tournament/[id]/goal-scorers/update
