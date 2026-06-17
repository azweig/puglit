# Build report — Promiedos

## Bespoke app (generation swarm)

Promiedos clone provides live updates of Argentine football matches, including daily match details, tournament fixtures, standings, top scorers, and historical results. Data is scraped and updated via cron jobs.

- Tablas: matches, tournaments, standings, scorers
- Rutas API: app/api/live-matches/route.ts, app/api/tournaments/route.ts, app/api/standings/route.ts, app/api/scorers/route.ts, app/api/matches/route.ts
- Pantallas: /app, /app/tournaments, /app/standings, /app/scorers, /app/matches/create, /app/tournaments/create, /app/standings/create, /app/scorers/create
