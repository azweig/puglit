# Build report — Promiedos

## Bespoke app (generation swarm)

Promiedos is a live Argentine football tracker that provides real-time updates on matches, fixtures by date, tournament standings, top goal scorers, and historical results. The data is scraped and updated periodically via cron jobs.

- Tablas: matches, tournaments, standings, goal_scorers
- Rutas API: app/api/live-matches/route.ts, app/api/tournaments/route.ts, app/api/standings/route.ts, app/api/goal-scorers/route.ts, app/api/matches/route.ts
- Pantallas: /, /tournaments, /standings/[tournamentId], /match/[matchId]/goal-scorers, /matches/create, /tournaments/create, /standings/update, /match/[matchId]/goal-scorers/add
